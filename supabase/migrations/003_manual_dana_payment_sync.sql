-- Keep the repository schema aligned with the production DANA payment foundation.
-- Production already contains these changes; this migration makes the state reproducible.

alter table public.payments
  add column if not exists proof_path text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_note text;

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
    check (provider = any (array['midtrans'::text, 'dana_manual'::text]));
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'payments_status_check'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments drop constraint payments_status_check;
  end if;

  alter table public.payments
    add constraint payments_status_check
    check (
      status = any (
        array[
          'pending'::text,
          'pending_review'::text,
          'paid'::text,
          'failed'::text,
          'rejected'::text,
          'expired'::text,
          'cancelled'::text,
          'refunded'::text
        ]
      )
    );
exception
  when duplicate_object then null;
end;
$$;

create or replace function public.activate_pro_subscription(
  p_order_id text,
  p_provider_payment_id text,
  p_paid_at timestamptz
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
  for update;

  if not found then
    raise exception 'Payment not found: %', p_order_id;
  end if;

  if v_payment.status = 'paid' then
    return;
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

revoke all on function public.activate_pro_subscription(text, text, timestamptz) from public;
revoke all on function public.activate_pro_subscription(text, text, timestamptz) from anon;
revoke all on function public.activate_pro_subscription(text, text, timestamptz) from authenticated;
grant execute on function public.activate_pro_subscription(text, text, timestamptz) to service_role;

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

  if v_payment.provider <> 'dana_manual' then
    raise exception 'Payment is not a manual DANA order';
  end if;

  if p_action = 'approve' then
    if v_payment.status = 'paid' then
      return;
    end if;

    if v_payment.status <> 'pending_review' then
      raise exception 'Payment is not awaiting review';
    end if;

    if v_payment.proof_path is null then
      raise exception 'Payment proof is missing';
    end if;

    perform public.activate_pro_subscription(
      v_payment.provider_order_id,
      coalesce(v_payment.provider_payment_id, 'manual-dana-review'),
      now()
    );

    update public.payments
    set reviewed_at = now(),
        reviewed_by = p_reviewer_id,
        review_note = v_note,
        updated_at = now()
    where id = v_payment.id;
  else
    if v_payment.status = 'paid' then
      raise exception 'Paid payment cannot be rejected';
    end if;

    if v_payment.status <> 'pending_review' then
      raise exception 'Payment is not awaiting review';
    end if;

    update public.payments
    set status = 'rejected',
        reviewed_at = now(),
        reviewed_by = p_reviewer_id,
        review_note = v_note,
        updated_at = now()
    where id = v_payment.id;
  end if;
end;
$$;

revoke all on function public.review_manual_payment(text, uuid, text, text) from public;
revoke all on function public.review_manual_payment(text, uuid, text, text) from anon;
revoke all on function public.review_manual_payment(text, uuid, text, text) from authenticated;
grant execute on function public.review_manual_payment(text, uuid, text, text) to service_role;

create index if not exists payments_provider_status_submitted_at_idx
  on public.payments(provider, status, submitted_at desc);
