-- Фото в отзывах: массив публичных URL из media-бакета.
-- Storage-политики менять не нужно — media уже разрешает загрузку любому
-- авторизованному пользователю и публичное чтение.

alter table reviews
  add column if not exists photos text[] not null default '{}';
