create or replace function public.reconcile_subscription_expiry(
  p_user_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affected integer := 0;
begin
  update public.subscriptions
  set plan = 'free',
      status = 'expired',
      updated_at = now()
  where plan = 'pro'
    and status = 'active'
    and expires_at is not null
    and expires_at <= now()
    and (p_user_id is null or user_id = p_user_id);

  get diagnostics v_affected = row_count;
  return v_affected;
end;
$$;

revoke all on function public.reconcile_subscription_expiry(uuid) from public;
revoke all on function public.reconcile_subscription_expiry(uuid) from anon;
revoke all on function public.reconcile_subscription_expiry(uuid) from authenticated;
grant execute on function public.reconcile_subscription_expiry(uuid) to service_role;
