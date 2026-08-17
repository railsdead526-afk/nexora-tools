create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('midtrans')),
  provider_order_id text not null unique,
  provider_payment_id text,
  amount integer not null check (amount > 0),
  currency text not null default 'IDR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payments_user_id_created_at_idx
  on public.payments(user_id, created_at desc);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  type text not null check (type in ('Bug', 'Saran', 'Pertanyaan')),
  message text not null check (char_length(message) between 1 and 3000),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  usage_date date not null default current_date,
  usage_count integer not null default 0 check (usage_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, tool, usage_date)
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.feedback enable row level security;
alter table public.usage_daily enable row level security;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "subscriptions_select_own"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "payments_select_own"
  on public.payments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "feedback_insert_own"
  on public.feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "usage_select_own"
  on public.usage_daily for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.activate_pro_subscription(
  p_order_id text,
  p_provider_payment_id text,
  p_paid_at timestamptz
)
returns void
language plpgsql
security definer set search_path = public
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

  -- Webhook Midtrans dapat dikirim lebih dari sekali. Jika sudah paid, jangan tambah masa aktif lagi.
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
        when public.subscriptions.expires_at is null or public.subscriptions.expires_at <= now()
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
