-- Fix ambiguous PL/pgSQL output variables and refresh PostgREST schema cache.
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
  v_new public.payments%rowtype;
  v_order_id text;
begin
  if p_user_id is null or p_amount <= 0 then
    raise exception 'Invalid manual payment parameters';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('nexora-manual-payment:' || p_user_id::text, 0));

  select p.* into v_existing
  from public.payments as p
  where p.user_id = p_user_id
    and p.provider = 'manual_bank'
    and p.status in ('pending', 'pending_review')
  order by p.created_at desc
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
  returning * into v_new;

  return query
    select v_new.provider_order_id, v_new.amount, v_new.currency,
           v_new.status, v_new.created_at;
end;
$$;

revoke all on function public.create_manual_payment_order(uuid, integer, text) from public;
revoke all on function public.create_manual_payment_order(uuid, integer, text) from anon;
revoke all on function public.create_manual_payment_order(uuid, integer, text) from authenticated;
grant execute on function public.create_manual_payment_order(uuid, integer, text) to service_role;

notify pgrst, 'reload schema';
