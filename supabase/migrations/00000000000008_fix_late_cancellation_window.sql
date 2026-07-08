-- =====================================================
-- BUG FIX: recalculate_beauty_score() counted a cancellation as
-- "late" only if it happened less than 3 hours before the
-- appointment. Every user-facing text (cancellation policy,
-- Beauty Score explainer) says 24 hours. This redefines the
-- trigger function to use the same 24-hour window everywhere.
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
    count(*) filter (where status = 'cancelled_by_client' and starts_at - status_changed_at < interval '24 hours')
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
    total_bookings      = v_total,
    completed_bookings  = v_completed,
    no_shows            = v_no_shows,
    late_cancellations  = v_late,
    score               = v_score,
    level               = v_level,
    updated_at          = now()
  where client_id = new.client_id;

  return new;
end;
$$;
