create or replace function public.consume_tool_quota(
  p_user_id uuid,
  p_tool text,
  p_limit integer
)
returns table (
  allowed boolean,
  used integer,
  remaining integer,
  usage_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_date date := (timezone('Asia/Jakarta', now()))::date;
  v_used integer;
begin
  if p_limit <= 0 then
    raise exception 'Quota limit must be greater than zero';
  end if;

  if p_tool not in ('downloader', 'bg_remover', 'heavy_default') then
    raise exception 'Unknown quota tool: %', p_tool;
  end if;

  insert into public.usage_daily (
    user_id,
    tool,
    usage_date,
    usage_count,
    updated_at
  )
  values (
    p_user_id,
    p_tool,
    v_usage_date,
    1,
    now()
  )
  on conflict (user_id, tool, usage_date)
  do update
    set usage_count = public.usage_daily.usage_count + 1,
        updated_at = now()
    where public.usage_daily.usage_count < p_limit
  returning public.usage_daily.usage_count into v_used;

  if v_used is null then
    select ud.usage_count
      into v_used
    from public.usage_daily as ud
    where ud.user_id = p_user_id
      and ud.tool = p_tool
      and ud.usage_date = v_usage_date;

    return query
      select false, coalesce(v_used, p_limit), 0, v_usage_date;
    return;
  end if;

  return query
    select true, v_used, greatest(p_limit - v_used, 0), v_usage_date;
end;
$$;

revoke all on function public.consume_tool_quota(uuid, text, integer) from public;
revoke all on function public.consume_tool_quota(uuid, text, integer) from anon;
revoke all on function public.consume_tool_quota(uuid, text, integer) from authenticated;
grant execute on function public.consume_tool_quota(uuid, text, integer) to service_role;

create or replace function public.refund_tool_quota(
  p_user_id uuid,
  p_tool text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_date date := (timezone('Asia/Jakarta', now()))::date;
begin
  update public.usage_daily
  set usage_count = greatest(usage_count - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and tool = p_tool
    and usage_date = v_usage_date
    and usage_count > 0;
end;
$$;

revoke all on function public.refund_tool_quota(uuid, text) from public;
revoke all on function public.refund_tool_quota(uuid, text) from anon;
revoke all on function public.refund_tool_quota(uuid, text) from authenticated;
grant execute on function public.refund_tool_quota(uuid, text) to service_role;
