-- Постоянный шаблон рабочей недели мастера.
-- Слоты остаются отдельными записями: этот шаблон задаёт,
-- какие слоты создавать при нажатии «Создать день/неделю».

create table if not exists public.master_schedule_templates (
  master_id uuid not null references public.masters(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  enabled boolean not null default false,
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  slot_duration_minutes integer not null default 60
    check (slot_duration_minutes between 15 and 480),
  updated_at timestamptz not null default now(),
  primary key (master_id, weekday),
  check (end_time > start_time)
);

alter table public.master_schedule_templates enable row level security;

drop policy if exists "schedule_templates_master_all" on public.master_schedule_templates;
create policy "schedule_templates_master_all"
on public.master_schedule_templates
for all
using (
  master_id in (
    select id from public.masters where profile_id = auth.uid()
  )
)
with check (
  master_id in (
    select id from public.masters where profile_id = auth.uid()
  )
);

grant select, insert, update, delete on public.master_schedule_templates to authenticated;
