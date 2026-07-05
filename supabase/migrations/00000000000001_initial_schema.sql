-- =====================================================
-- РАСШИРЕНИЯ
-- =====================================================
create extension if not exists "uuid-ossp";
create extension if not exists "btree_gist";

-- =====================================================
-- ENUMS
-- =====================================================
create type user_role as enum ('client', 'master');
create type service_category as enum ('nail', 'lash', 'brow', 'hair', 'makeup', 'cosmetology');
create type booking_status as enum ('pending', 'confirmed', 'cancelled_by_client', 'cancelled_by_master', 'completed', 'no_show');
create type client_level as enum ('new', 'verified', 'trusted');

-- =====================================================
-- ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);

-- =====================================================
-- МАСТЕРА
-- =====================================================
create table masters (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  bio text,
  categories service_category[] not null default '{}',
  -- Геолокация
  address text,
  city text not null default 'Astana',
  lat double precision,
  lng double precision,
  -- Соцсети
  instagram_handle text,
  -- Метрики
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0,
  completed_bookings integer not null default 0,
  -- Статусы
  is_verified boolean not null default false,
  is_active boolean not null default true,
  -- Поиск
  search_vector tsvector generated always as (
    to_tsvector('russian', coalesce(bio, '') || ' ' || coalesce(address, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_masters_categories on masters using gin(categories);
create index idx_masters_location on masters(lat, lng) where is_active = true;
create index idx_masters_search on masters using gin(search_vector);
create index idx_masters_rating on masters(rating desc) where is_active = true;

-- =====================================================
-- УСЛУГИ
-- =====================================================
create table services (
  id uuid primary key default uuid_generate_v4(),
  master_id uuid not null references masters(id) on delete cascade,
  name text not null,
  description text,
  category service_category not null,
  price_kzt integer not null check (price_kzt > 0),
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 480),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_services_master on services(master_id) where is_active = true;

-- =====================================================
-- ФОТО ПОРТФОЛИО
-- =====================================================
create table portfolio_photos (
  id uuid primary key default uuid_generate_v4(),
  master_id uuid not null references masters(id) on delete cascade,
  url text not null,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_portfolio_master on portfolio_photos(master_id, position);

-- =====================================================
-- СЛОТЫ С ЗАЩИТОЙ ОТ ДВОЙНОЙ ЗАПИСИ
-- =====================================================
create table slots (
  id uuid primary key default uuid_generate_v4(),
  master_id uuid not null references masters(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Защита от пересекающихся слотов одного мастера
  exclude using gist (
    master_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
);

create index idx_slots_master_time on slots(master_id, starts_at) where is_booked = false;

-- =====================================================
-- ЗАПИСИ
-- =====================================================
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null unique references slots(id),
  client_id uuid not null references profiles(id),
  master_id uuid not null references masters(id),
  service_id uuid not null references services(id),
  -- Снапшот данных на момент записи
  service_name_snapshot text not null,
  price_kzt_snapshot integer not null,
  duration_minutes_snapshot integer not null,
  -- Статус
  status booking_status not null default 'pending',
  client_notes text,
  master_notes text,
  -- Время
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now()
);

create index idx_bookings_client on bookings(client_id, starts_at desc);
create index idx_bookings_master on bookings(master_id, starts_at desc);
create index idx_bookings_status on bookings(status, starts_at);

-- =====================================================
-- ОТЗЫВЫ
-- =====================================================
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null unique references bookings(id),
  master_id uuid not null references masters(id),
  client_id uuid not null references profiles(id),
  rating integer not null check (rating between 1 and 5),
  text text,
  created_at timestamptz not null default now()
);

create index idx_reviews_master on reviews(master_id, created_at desc);

-- =====================================================
-- BEAUTY SCORE
-- =====================================================
create table client_scores (
  client_id uuid primary key references profiles(id) on delete cascade,
  total_bookings integer not null default 0,
  completed_bookings integer not null default 0,
  no_shows integer not null default 0,
  late_cancellations integer not null default 0,
  score integer not null default 0,
  level client_level not null default 'new',
  updated_at timestamptz not null default now()
);

-- =====================================================
-- ТРИГГЕР: автосоздание профиля при регистрации
-- =====================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );

  -- Если клиент — создаём ему запись в client_scores
  if coalesce((new.raw_user_meta_data->>'role')::user_role, 'client') = 'client' then
    insert into client_scores (client_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================
-- ТРИГГЕР: пересчёт рейтинга мастера при новом отзыве
-- =====================================================
create or replace function recalculate_master_rating()
returns trigger
language plpgsql
security definer
as $$
begin
  update masters
  set
    rating = (select coalesce(avg(rating), 0) from reviews where master_id = new.master_id),
    reviews_count = (select count(*) from reviews where master_id = new.master_id),
    updated_at = now()
  where id = new.master_id;
  return new;
end;
$$;

create trigger on_review_created
  after insert on reviews
  for each row execute function recalculate_master_rating();

-- =====================================================
-- ТРИГГЕР: пересчёт Beauty Score
-- =====================================================
create or replace function recalculate_beauty_score()
returns trigger
language plpgsql
security definer
as $$
declare
  v_total int;
  v_completed int;
  v_no_shows int;
  v_late int;
  v_score int;
  v_level client_level;
begin
  select
    count(*),
    count(*) filter (where status = 'completed'),
    count(*) filter (where status = 'no_show'),
    count(*) filter (where status = 'cancelled_by_client' and starts_at - status_changed_at < interval '3 hours')
  into v_total, v_completed, v_no_shows, v_late
  from bookings
  where client_id = new.client_id;

  v_score := greatest(0, v_completed * 10 - v_no_shows * 25 - v_late * 10);

  v_level := case
    when v_score >= 150 then 'trusted'::client_level
    when v_score >= 50 then 'verified'::client_level
    else 'new'::client_level
  end;

  update client_scores
  set
    total_bookings = v_total,
    completed_bookings = v_completed,
    no_shows = v_no_shows,
    late_cancellations = v_late,
    score = v_score,
    level = v_level,
    updated_at = now()
  where client_id = new.client_id;

  return new;
end;
$$;

create trigger on_booking_status_changed
  after update of status on bookings
  for each row
  when (old.status is distinct from new.status)
  execute function recalculate_beauty_score();

-- =====================================================
-- RLS ПОЛИТИКИ
-- =====================================================
alter table profiles enable row level security;
alter table masters enable row level security;
alter table services enable row level security;
alter table portfolio_photos enable row level security;
alter table slots enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table client_scores enable row level security;

-- profiles
create policy "profiles_self_read" on profiles for select using (auth.uid() = id);
create policy "profiles_public_read_master" on profiles for select using (
  id in (select profile_id from masters where is_active = true)
);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);

-- masters
create policy "masters_public_read" on masters for select using (is_active = true);
create policy "masters_owner_all" on masters for all using (
  profile_id = auth.uid()
) with check (profile_id = auth.uid());

-- services
create policy "services_public_read" on services for select using (
  is_active = true and master_id in (select id from masters where is_active = true)
);
create policy "services_owner_all" on services for all using (
  master_id in (select id from masters where profile_id = auth.uid())
) with check (
  master_id in (select id from masters where profile_id = auth.uid())
);

-- portfolio_photos
create policy "portfolio_public_read" on portfolio_photos for select using (true);
create policy "portfolio_owner_all" on portfolio_photos for all using (
  master_id in (select id from masters where profile_id = auth.uid())
) with check (
  master_id in (select id from masters where profile_id = auth.uid())
);

-- slots
create policy "slots_public_read_free" on slots for select using (
  is_booked = false and starts_at > now()
);
create policy "slots_master_all" on slots for all using (
  master_id in (select id from masters where profile_id = auth.uid())
) with check (
  master_id in (select id from masters where profile_id = auth.uid())
);
create policy "slots_client_read_own" on slots for select using (
  id in (select slot_id from bookings where client_id = auth.uid())
);

-- bookings
create policy "bookings_client_read" on bookings for select using (auth.uid() = client_id);
create policy "bookings_master_read" on bookings for select using (
  master_id in (select id from masters where profile_id = auth.uid())
);
create policy "bookings_client_create" on bookings for insert with check (auth.uid() = client_id);
create policy "bookings_client_update_own" on bookings for update using (auth.uid() = client_id);
create policy "bookings_master_update" on bookings for update using (
  master_id in (select id from masters where profile_id = auth.uid())
);

-- reviews
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_client_create" on reviews for insert with check (
  auth.uid() = client_id and
  booking_id in (select id from bookings where client_id = auth.uid() and status = 'completed')
);

-- client_scores
create policy "scores_self_read" on client_scores for select using (auth.uid() = client_id);
create policy "scores_master_read" on client_scores for select using (
  client_id in (
    select client_id from bookings
    where master_id in (select id from masters where profile_id = auth.uid())
  )
);
