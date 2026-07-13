-- =====================================================
-- ГРАНТЫ + БЭКФИЛЛ ПРОФИЛЕЙ
-- =====================================================
-- Причина: без прав на уровне таблиц роли anon/authenticated
-- получают "permission denied for table ...", и любой запрос
-- залогиненного пользователя к profiles/masters падает — из-за
-- этого роль читалась как null и все выглядели клиентами.
-- RLS остаётся включённым и продолжает ограничивать доступ к строкам;
-- эти GRANT'ы лишь открывают доступ к таблицам (как в дефолтной
-- настройке Supabase). Идемпотентно — можно запускать повторно.
-- =====================================================

grant usage on schema public to anon, authenticated;

grant all on all tables    in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines  in schema public to anon, authenticated;

-- Права для будущих таблиц/функций/последовательностей
alter default privileges in schema public grant all on tables    to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on routines  to anon, authenticated;

-- =====================================================
-- БЭКФИЛЛ: создать профили пользователям, у которых их нет
-- (например, зарегистрированным до установки триггера handle_new_user).
-- Роль берётся из метаданных регистрации, по умолчанию 'client'.
-- =====================================================
insert into profiles (id, role, full_name)
select u.id,
       coalesce((u.raw_user_meta_data->>'role')::user_role, 'client'),
       coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;

-- Клиентам без записи client_scores — создать
insert into client_scores (client_id)
select p.id
from profiles p
left join client_scores cs on cs.client_id = p.id
where p.role = 'client' and cs.client_id is null;
