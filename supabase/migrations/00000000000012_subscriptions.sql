-- =====================================================================
-- ПОДПИСКИ (Pro-тариф с автосписанием)
-- =====================================================================
-- Провайдер-независимая схема. Карты НЕ храним — только токен подписки
-- у провайдера. Статусом управляет ТОЛЬКО сервер (service_role):
-- RLS разрешает мастеру лишь ЧТЕНИЕ своей подписки, запись политиками
-- не открыта, поэтому обычный пользователь ничего изменить не может.
-- =====================================================================

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  master_id uuid not null unique references public.masters(id) on delete cascade,
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'past_due', 'canceled', 'expired')),
  provider text,                          -- 'cloudpayments' | 'freedom' | 'ioka' | null
  provider_subscription_id text,          -- id подписки/токена у провайдера
  card_last4 text,                        -- для показа «карта •• 1234», не сама карта
  amount_kzt integer not null default 7990,
  current_period_end timestamptz,         -- до какого момента оплачен Pro
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- История списаний: аудит + идемпотентность (provider_payment_id UNIQUE)
create table if not exists public.subscription_payments (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  master_id uuid references public.masters(id) on delete set null,
  provider text,
  provider_payment_id text unique,        -- одно списание не засчитается дважды
  amount_kzt integer,
  status text not null check (status in ('success', 'failed')),
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_period_end
  on public.subscriptions (current_period_end)
  where status in ('active', 'past_due');

alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- Мастер видит ТОЛЬКО свою подписку и свои платежи (только select).
drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read" on public.subscriptions
  for select using (
    master_id in (select id from public.masters where profile_id = auth.uid())
  );

drop policy if exists "sub_payments_owner_read" on public.subscription_payments;
create policy "sub_payments_owner_read" on public.subscription_payments
  for select using (
    master_id in (select id from public.masters where profile_id = auth.uid())
  );

-- Читать можно, писать — нельзя (нет политик insert/update/delete → RLS их
-- блокирует даже при table-grant). service_role обходит RLS и пишет статусы.
grant select on public.subscriptions to authenticated;
grant select on public.subscription_payments to authenticated;
revoke insert, update, delete on public.subscriptions from authenticated, anon;
revoke insert, update, delete on public.subscription_payments from authenticated, anon;
