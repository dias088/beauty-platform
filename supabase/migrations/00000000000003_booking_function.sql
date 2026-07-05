create or replace function create_booking_atomic(
  p_client_id uuid,
  p_master_id uuid,
  p_service_id uuid,
  p_slot_id uuid,
  p_client_notes text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_slot record;
  v_service record;
  v_booking_id uuid;
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
  select * into v_service from services where id = p_service_id and master_id = p_master_id;
  if not found then raise exception 'service_not_found'; end if;

  -- Создаём запись
  insert into bookings (
    client_id, master_id, service_id, slot_id,
    service_name_snapshot, price_kzt_snapshot, duration_minutes_snapshot,
    starts_at, ends_at, client_notes, status
  ) values (
    p_client_id, p_master_id, p_service_id, p_slot_id,
    v_service.name, v_service.price_kzt, v_service.duration_minutes,
    v_slot.starts_at, v_slot.ends_at, p_client_notes, 'pending'
  ) returning id into v_booking_id;

  -- Помечаем слот забуканным
  update slots set is_booked = true where id = p_slot_id;

  return v_booking_id;
end;
$$;

grant execute on function create_booking_atomic to authenticated;
