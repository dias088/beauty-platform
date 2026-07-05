-- =====================================================
-- BEAUTY SCORE DISCOUNTS
-- Мастер сам решает, давать ли скидки клиентам
-- по их Beauty Score уровню. По умолчанию — выключено.
-- =====================================================

-- Настройки скидок мастера
create table master_score_discounts (
  master_id          uuid primary key references masters(id) on delete cascade,
  -- Скидка для уровня 'verified' (0 = выключено, 1-30 = процент)
  verified_discount  integer not null default 0 check (verified_discount between 0 and 30),
  -- Скидка для уровня 'trusted'
  trusted_discount   integer not null default 0 check (trusted_discount between 0 and 30),
  updated_at         timestamptz not null default now()
);

-- RLS: читать может любой (нужно при бронировании),
-- менять — только владелец
alter table master_score_discounts enable row level security;

create policy "discounts_public_read" on master_score_discounts
  for select using (true);

create policy "discounts_owner_write" on master_score_discounts
  for all using (
    master_id in (select id from masters where profile_id = auth.uid())
  ) with check (
    master_id in (select id from masters where profile_id = auth.uid())
  );

-- =====================================================
-- Добавляем в bookings два новых поля:
-- original_price  — цена до скидки (null если скидки не было)
-- discount_pct    — процент скидки (null если не применялась)
-- =====================================================
alter table bookings
  add column if not exists original_price_kzt integer default null,
  add column if not exists discount_pct        integer default null;

-- =====================================================
-- Обновляем атомарную функцию бронирования:
-- теперь она проверяет Beauty Score клиента,
-- смотрит настройки скидок мастера и применяет их
-- =====================================================
create or replace function create_booking_atomic(
  p_client_id    uuid,
  p_master_id    uuid,
  p_service_id   uuid,
  p_slot_id      uuid,
  p_client_notes text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_slot           record;
  v_service        record;
  v_discount_cfg   record;
  v_client_score   record;
  v_discount_pct   integer := 0;
  v_original_price integer;
  v_final_price    integer;
  v_booking_id     uuid;
begin
  -- Блокируем слот для исключения race condition
  select * into v_slot from slots where id = p_slot_id for update;

  if not found or v_slot.master_id != p_master_id then
    raise exception 'slot_not_found';
  end if;
  if v_slot.is_booked then
    raise exception 'slot_already_booked';
  end if;
  if v_slot.starts_at < now() then
    raise exception 'slot_in_past';
  end if;

  -- Получаем услугу для снапшота
  select * into v_service
  from services
  where id = p_service_id and master_id = p_master_id;

  if not found then
    raise exception 'service_not_found';
  end if;

  v_original_price := v_service.price_kzt;
  v_final_price    := v_service.price_kzt;

  -- Проверяем Beauty Score клиента
  select level into v_client_score
  from client_scores
  where client_id = p_client_id;

  -- Получаем настройки скидок мастера (если есть)
  select * into v_discount_cfg
  from master_score_discounts
  where master_id = p_master_id;

  -- Применяем скидку если она настроена
  if found and v_client_score.level is not null then
    if v_client_score.level = 'trusted' and v_discount_cfg.trusted_discount > 0 then
      v_discount_pct := v_discount_cfg.trusted_discount;
    elsif v_client_score.level = 'verified' and v_discount_cfg.verified_discount > 0 then
      v_discount_pct := v_discount_cfg.verified_discount;
    end if;
  end if;

  -- Считаем финальную цену
  if v_discount_pct > 0 then
    v_final_price := round(v_original_price * (100 - v_discount_pct) / 100.0);
  end if;

  -- Создаём запись
  insert into bookings (
    client_id, master_id, service_id, slot_id,
    service_name_snapshot,
    price_kzt_snapshot,
    duration_minutes_snapshot,
    starts_at, ends_at,
    client_notes, status,
    original_price_kzt,
    discount_pct
  ) values (
    p_client_id, p_master_id, p_service_id, p_slot_id,
    v_service.name,
    v_final_price,
    v_service.duration_minutes,
    v_slot.starts_at, v_slot.ends_at,
    p_client_notes, 'pending',
    case when v_discount_pct > 0 then v_original_price else null end,
    case when v_discount_pct > 0 then v_discount_pct   else null end
  ) returning id into v_booking_id;

  -- Помечаем слот забуканным
  update slots set is_booked = true where id = p_slot_id;

  return v_booking_id;
end;
$$;

grant execute on function create_booking_atomic to authenticated;
