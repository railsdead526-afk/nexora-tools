-- Manual bank-transfer payment flow.
-- PRO duration starts when an admin approves a valid proof, not when it is submitted.

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

alter table public.payments
  add column if not exists payer_email text;

-- Keep historical Midtrans rows readable, but allow the new manual provider.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'payments_provider_check'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments drop constraint payments_provider_check;
  end if;

  alter table public.payments
    add constraint payments_provider_check
    check (provider = any (array['midtrans'::text, 'dana_manual'::text, 'manual_bank'::text]));
exception
  when duplicate_object then null;
end;
$$;

-- Return the newest open manual order for the user. The advisory lock prevents
-- double-clicks or parallel requests from creating duplicate pending orders.
create or replace function public.create_manual_payment_order(
  p_user_id uuid,
  p_amount integer,
  p_email text default null
)
returns table (
  provider_order_id text,
  amount integer,
  currency text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.payments%rowtype;
  v_order_id text;
begin
  if p_user_id is null or p_amount <= 0 then
    raise exception 'Invalid manual payment parameters';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('nexora-manual-payment:' || p_user_id::text, 0));

  select * into v_existing
  from public.payments
  where user_id = p_user_id
    and provider = 'manual_bank'
    and status in ('pending', 'pending_review')
  order by created_at desc
  limit 1
  for update;

  if found then
    return query
      select v_existing.provider_order_id, v_existing.amount, v_existing.currency,
             v_existing.status, v_existing.created_at;
    return;
  end if;

  v_order_id := 'NXR-MANUAL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));

  insert into public.payments (
    user_id, payer_email, provider, provider_order_id, amount, currency, status
  )
  values (
    p_user_id, nullif(left(trim(coalesce(p_email, '')), 320), ''),
    'manual_bank', v_order_id, p_amount, 'IDR', 'pending'
  )
  returning payments.provider_order_id, payments.amount, payments.currency,
            payments.status, payments.created_at
  into provider_order_id, amount, currency, status, created_at;

  return next;
end;
$$;

revoke all on function public.create_manual_payment_order(uuid, integer, text) from public;
revoke all on function public.create_manual_payment_order(uuid, integer, text) from anon;
revoke all on function public.create_manual_payment_order(uuid, integer, text) from authenticated;
grant execute on function public.create_manual_payment_order(uuid, integer, text) to service_role;

create or replace function public.activate_manual_subscription(
  p_order_id text,
  p_provider_payment_id text,
  p_paid_at timestamptz,
  p_amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_current_expiry timestamptz;
  v_new_expiry timestamptz;
begin
  select * into v_payment
  from public.payments
  where provider_order_id = p_order_id
    and provider in ('manual_bank', 'dana_manual')
  for update;

  if not found then
    raise exception 'Manual payment not found';
  end if;

  if v_payment.amount <> p_amount then
    raise exception 'Payment amount mismatch';
  end if;

  if v_payment.status = 'paid' then
    return;
  end if;

  if v_payment.status <> 'pending_review' then
    raise exception 'Payment is not awaiting review';
  end if;

  update public.payments
  set status = 'paid',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      paid_at = coalesce(p_paid_at, now()),
      updated_at = now()
  where id = v_payment.id;

  select expires_at into v_current_expiry
  from public.subscriptions
  where user_id = v_payment.user_id
  for update;

  v_new_expiry := greatest(coalesce(v_current_expiry, now()), now()) + interval '30 days';

  insert into public.subscriptions (user_id, plan, status, started_at, expires_at, updated_at)
  values (v_payment.user_id, 'pro', 'active', now(), v_new_expiry, now())
  on conflict (user_id) do update
  set plan = 'pro',
      status = 'active',
      started_at = case
        when public.subscriptions.expires_at is null
          or public.subscriptions.expires_at <= now()
          then now()
        else public.subscriptions.started_at
      end,
      expires_at = v_new_expiry,
      updated_at = now();
end;
$$;

revoke all on function public.activate_manual_subscription(text, text, timestamptz, integer) from public;
revoke all on function public.activate_manual_subscription(text, text, timestamptz, integer) from anon;
revoke all on function public.activate_manual_subscription(text, text, timestamptz, integer) from authenticated;
grant execute on function public.activate_manual_subscription(text, text, timestamptz, integer) to service_role;

create or replace function public.review_manual_payment(
  p_order_id text,
  p_reviewer_id uuid,
  p_action text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_note text := nullif(left(trim(coalesce(p_note, '')), 500), '');
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'Unsupported review action';
  end if;

  select * into v_payment
  from public.payments
  where provider_order_id = p_order_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  if v_payment.provider not in ('manual_bank', 'dana_manual') then
    raise exception 'Payment is not a manual order';
  end if;

  if p_action = 'approve' then
    if v_payment.status = 'paid' then
      return;
    end if;

    if v_payment.status <> 'pending_review' or v_payment.proof_path is null then
      raise exception 'Payment is not awaiting review with proof';
    end if;

    perform public.activate_manual_subscription(
      v_payment.provider_order_id,
      coalesce(v_payment.provider_payment_id, 'manual-review'),
      now(),
      v_payment.amount
    );

    update public.payments
    set reviewed_at = now(), reviewed_by = p_reviewer_id,
        review_note = v_note, updated_at = now()
    where id = v_payment.id;
  else
    if v_payment.status = 'paid' then
      raise exception 'Paid payment cannot be rejected';
    end if;

    if v_payment.status <> 'pending_review' then
      raise exception 'Payment is not awaiting review';
    end if;

    update public.payments
    set status = 'rejected', reviewed_at = now(), reviewed_by = p_reviewer_id,
        review_note = v_note, updated_at = now()
    where id = v_payment.id;
  end if;
end;
$$;

revoke all on function public.review_manual_payment(text, uuid, text, text) from public;
revoke all on function public.review_manual_payment(text, uuid, text, text) from anon;
revoke all on function public.review_manual_payment(text, uuid, text, text) from authenticated;
grant execute on function public.review_manual_payment(text, uuid, text, text) to service_role;

create index if not exists payments_manual_open_user_idx
  on public.payments(user_id, created_at desc)
  where provider = 'manual_bank' and status in ('pending', 'pending_review');

create index if not exists payments_manual_review_idx
  on public.payments(provider, status, submitted_at desc)
  where provider in ('manual_bank', 'dana_manual');
