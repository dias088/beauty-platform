-- Add boost_until to masters for sponsored/boosted profiles
alter table masters
  add column if not exists boost_until timestamptz default null;

-- Index for efficient boosted-first sorting
create index if not exists idx_masters_boost_until on masters (boost_until desc nulls last);
