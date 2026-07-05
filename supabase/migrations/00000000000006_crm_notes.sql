-- Заметки мастера о клиентах (CRM)
create table master_client_notes (
  master_id  uuid not null references masters(id) on delete cascade,
  client_id  uuid not null references profiles(id) on delete cascade,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (master_id, client_id)
);

alter table master_client_notes enable row level security;

create policy "notes_owner_all" on master_client_notes
  for all using (
    master_id in (select id from masters where profile_id = auth.uid())
  ) with check (
    master_id in (select id from masters where profile_id = auth.uid())
  );

-- Индекс для быстрого поиска заметок по мастеру
create index idx_notes_master on master_client_notes(master_id);
