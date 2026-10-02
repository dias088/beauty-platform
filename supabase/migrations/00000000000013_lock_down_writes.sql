-- =====================================================
-- SECURITY FIX: подделка записей, отзывов, рейтинга, верификации и буста
-- =====================================================
-- Что было (00000000000001_initial_schema.sql):
--   * bookings_client_update_own — клиент мог обновить ЛЮБУЮ колонку своей
--     записи: поставить status = 'completed' без визита и оставить отзыв,
--     поменять цену-снапшот, время и т.д.
--   * bookings_master_update — то же для мастера: цена, клиент, время.
--   * bookings_client_create — запись вставлялась напрямую, в обход
--     create_booking_atomic(), с любой ценой и любым слотом.
--   * reviews_client_create — не сверял master_id отзыва с мастером записи:
--     можно было «повесить» отзыв на чужого мастера.
--   * masters_owner_all — мастер сам ставил себе is_verified, rating,
--     reviews_count, boost_until и включал профиль после блокировки админом.
--
-- Почему триггеры, а не column-level GRANT: миграция 09 делает
-- `grant all` и помечена как «можно запускать повторно» — повторный запуск
-- молча снял бы ограничения по колонкам. Триггеры от грантов не зависят.
--
-- Доверенные пути не затронуты: service_role (админка, биллинг),
-- SECURITY DEFINER-функции (create_booking_atomic, пересчёт рейтинга и
-- Beauty Score) выполняются не от anon/authenticated и проходят свободно.
-- =====================================================

-- -----------------------------------------------------
-- BOOKINGS: создание только через create_booking_atomic()
-- -----------------------------------------------------
drop policy if exists "bookings_client_create" on public.bookings;

-- -----------------------------------------------------
-- BOOKINGS: какие изменения разрешены клиенту и мастеру
-- -----------------------------------------------------
-- Клиент:  pending/confirmed -> cancelled_by_client. Больше ничего.
-- Мастер:  pending -> confirmed;
--          pending/confirmed -> cancelled_by_master;
--          pending/confirmed -> completed | no_show (только после начала записи);
--          master_notes — свободно.
-- Остальные колонки (цена, клиент, слот, время, снапшоты…) неизменяемы.
-- status_changed_at всегда ставит сама база: от него зависит подсчёт
-- поздних отмен в Beauty Score.
create or replace function public.guard_booking_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_master boolean;
  v_mutable constant text[] := array['status', 'status_changed_at', 'master_notes', 'updated_at'];
begin
  -- Доверенный код (service_role, SECURITY DEFINER-функции) не ограничиваем
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if (to_jsonb(new) - v_mutable) is distinct from (to_jsonb(old) - v_mutable) then
    raise exception 'booking_field_is_read_only' using errcode = '42501';
  end if;

  v_is_master := exists (
    select 1 from masters where id = old.master_id and profile_id = v_uid
  );

  if not v_is_master then
    -- Клиент (RLS уже проверила, что запись его)
    if new.master_notes is distinct from old.master_notes then
      raise exception 'booking_field_is_read_only' using errcode = '42501';
    end if;
    if new.status is distinct from old.status
       and not (old.status in ('pending', 'confirmed') and new.status = 'cancelled_by_client') then
      raise exception 'booking_status_transition_not_allowed' using errcode = '42501';
    end if;
  elsif new.status is distinct from old.status then
    if not (
      (old.status = 'pending' and new.status = 'confirmed')
      or (old.status in ('pending', 'confirmed') and new.status = 'cancelled_by_master')
      or (old.status in ('pending', 'confirmed') and new.status in ('completed', 'no_show')
          and old.starts_at <= now())
    ) then
      raise exception 'booking_status_transition_not_allowed' using errcode = '42501';
    end if;
  end if;

  new.status_changed_at := case
    when new.status is distinct from old.status then now()
    else old.status_changed_at
  end;
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists guard_booking_update on public.bookings;
create trigger guard_booking_update
  before update on public.bookings
  for each row execute function public.guard_booking_update();

-- -----------------------------------------------------
-- REVIEWS: только на свою завершённую запись, только тому мастеру,
-- у которого был визит, и не самому себе
-- -----------------------------------------------------
drop policy if exists "reviews_client_create" on public.reviews;
create policy "reviews_client_create" on public.reviews for insert with check (
  auth.uid() = client_id
  and exists (
    select 1 from public.bookings b
    where b.id = reviews.booking_id
      and b.client_id = auth.uid()
      and b.master_id = reviews.master_id
      and b.status = 'completed'
  )
  and not exists (
    select 1 from public.masters m
    where m.id = reviews.master_id and m.profile_id = auth.uid()
  )
);

-- -----------------------------------------------------
-- MASTERS: верификация, рейтинг, счётчики и буст — только доверенный код
-- -----------------------------------------------------
-- Мастер по-прежнему правит био, категории, адрес, координаты, Instagram,
-- город и может скрыть свой профиль (is_active -> false). Включить профиль
-- обратно после блокировки админом (false -> true) может только админ.
create or replace function public.guard_master_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_verified
       or new.rating <> 0
       or new.reviews_count <> 0
       or new.completed_bookings <> 0
       or new.boost_until is not null then
      raise exception 'master_field_is_read_only' using errcode = '42501';
    end if;
  else
    if new.profile_id is distinct from old.profile_id
       or new.is_verified is distinct from old.is_verified
       or new.rating is distinct from old.rating
       or new.reviews_count is distinct from old.reviews_count
       or new.completed_bookings is distinct from old.completed_bookings
       or new.boost_until is distinct from old.boost_until
       or (new.is_active and not old.is_active) then
      raise exception 'master_field_is_read_only' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_master_protected_columns on public.masters;
create trigger guard_master_protected_columns
  before insert or update on public.masters
  for each row execute function public.guard_master_protected_columns();
