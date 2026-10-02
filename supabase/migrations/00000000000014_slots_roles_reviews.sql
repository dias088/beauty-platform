-- =====================================================
-- Три дыры, найденные при работе над 00000000000013_lock_down_writes.sql
-- =====================================================

-- -----------------------------------------------------
-- 1. Отменённая запись освобождает слот, и на него можно записаться снова
-- -----------------------------------------------------
-- Было: приложение после отмены само делало `update slots set is_booked = false`.
-- У клиента нет политики update на slots, поэтому при отмене клиентом запрос
-- молча ничего не менял и слот оставался занятым. А если слот всё же
-- освобождался (отмена мастером), повторная запись падала на unique(slot_id).
-- Теперь слот освобождает база, а уникальность действует только среди
-- неотменённых записей.
alter table public.bookings drop constraint if exists bookings_slot_id_key;
create unique index if not exists bookings_slot_id_active_key
  on public.bookings (slot_id)
  where status not in ('cancelled_by_client', 'cancelled_by_master');

create or replace function public.release_slot_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update slots set is_booked = false where id = new.slot_id;
  return new;
end;
$$;

drop trigger if exists release_slot_on_cancel on public.bookings;
create trigger release_slot_on_cancel
  after update of status on public.bookings
  for each row
  when (old.status is distinct from new.status
        and new.status in ('cancelled_by_client', 'cancelled_by_master'))
  execute function public.release_slot_on_cancel();

-- -----------------------------------------------------
-- 2. Роль выбирается при регистрации и дальше не меняется пользователем
-- -----------------------------------------------------
-- Было: profiles_self_update разрешал менять любую колонку своего профиля,
-- в том числе role. А masters_owner_all давал создать строку мастера
-- любому пользователю, даже клиенту.
create or replace function public.guard_profile_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.id is distinct from old.id or new.role is distinct from old.role then
    raise exception 'profile_field_is_read_only' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_protected_columns on public.profiles;
create trigger guard_profile_protected_columns
  before update on public.profiles
  for each row execute function public.guard_profile_protected_columns();

create or replace function public.guard_master_requires_master_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if not exists (select 1 from profiles where id = new.profile_id and role = 'master') then
    raise exception 'profile_is_not_master' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_master_requires_master_role on public.masters;
create trigger guard_master_requires_master_role
  before insert on public.masters
  for each row execute function public.guard_master_requires_master_role();

-- -----------------------------------------------------
-- 3. Накрутка отзывов через второй аккаунт
-- -----------------------------------------------------
-- Полностью отличить второй аккаунт мастера от настоящего клиента база не
-- может. Решение по умолчанию:
--   * один отзыв от одного клиента одному мастеру (как на картах и
--     маркетплейсах). Повторные визиты одного аккаунта больше не добавляют
--     отзывов, так что для каждого фейкового отзыва нужен новый аккаунт и
--     отдельная завершённая запись;
--   * рейтинг пересчитывается и при удалении отзыва, чтобы админ мог убрать
--     фейковый отзыв и рейтинг сразу исправился.
-- Проверка сделана триггером, а не unique-индексом: если в базе уже есть
-- несколько отзывов одного клиента одному мастеру, миграция не упадёт.
create or replace function public.guard_one_review_per_master()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if exists (
    select 1 from reviews where client_id = new.client_id and master_id = new.master_id
  ) then
    raise exception 'master_already_reviewed' using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_one_review_per_master on public.reviews;
create trigger guard_one_review_per_master
  before insert on public.reviews
  for each row execute function public.guard_one_review_per_master();

create or replace function public.recalculate_master_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_master_id uuid := case when tg_op = 'DELETE' then old.master_id else new.master_id end;
begin
  update masters
  set
    rating = (select coalesce(avg(rating), 0) from reviews where master_id = v_master_id),
    reviews_count = (select count(*) from reviews where master_id = v_master_id),
    updated_at = now()
  where id = v_master_id;
  return null;
end;
$$;

drop trigger if exists on_review_deleted on public.reviews;
create trigger on_review_deleted
  after delete on public.reviews
  for each row execute function public.recalculate_master_rating();
