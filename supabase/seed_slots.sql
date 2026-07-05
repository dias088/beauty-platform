-- Добавляем тестовые слоты для всех активных мастеров
-- Завтра и послезавтра, с 10:00 до 19:00 с шагом 1 час (UTC+5 = UTC-5h)

INSERT INTO slots (master_id, starts_at, ends_at)
SELECT
  m.id,
  (CURRENT_DATE + 1 + make_interval(hours => h))::timestamptz AT TIME ZONE 'Asia/Almaty',
  (CURRENT_DATE + 1 + make_interval(hours => h + 1))::timestamptz AT TIME ZONE 'Asia/Almaty'
FROM masters m
CROSS JOIN generate_series(5, 14) AS h  -- 10:00-19:00 Алматы = 05:00-14:00 UTC
WHERE m.is_active = true

UNION ALL

SELECT
  m.id,
  (CURRENT_DATE + 2 + make_interval(hours => h))::timestamptz AT TIME ZONE 'Asia/Almaty',
  (CURRENT_DATE + 2 + make_interval(hours => h + 1))::timestamptz AT TIME ZONE 'Asia/Almaty'
FROM masters m
CROSS JOIN generate_series(5, 14) AS h
WHERE m.is_active = true

ON CONFLICT DO NOTHING;

SELECT COUNT(*) as created_slots FROM slots WHERE is_booked = false AND starts_at > now();
