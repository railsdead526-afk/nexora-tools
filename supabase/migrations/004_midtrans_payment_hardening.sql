-- Harden automatic Midtrans settlement so only a Midtrans payment with the
-- expected order and amount can activate a PRO subscription.

create or replace function public.activate_midtrans_subscription(
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
    and provider = 'midtrans'
  for update;

  if not found then
    raise exception 'Midtrans payment not found: %', p_order_id;
  end if;

  if v_payment.amount <> p_amount then
    raise exception 'Payment amount mismatch for order: %', p_order_id;
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

revoke all on function public.activate_midtrans_subscription(text, text, timestamptz, integer) from public;
revoke all on function public.activate_midtrans_subscription(text, text, timestamptz, integer) from anon;
revoke all on function public.activate_midtrans_subscription(text, text, timestamptz, integer) from authenticated;
grant execute on function public.activate_midtrans_subscription(text, text, timestamptz, integer) to service_role;
