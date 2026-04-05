-- Run this in Supabase SQL Editor
create table if not exists app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Allow admin reads/writes (RLS off for simplicity, or add policy)
alter table app_config enable row level security;

create policy "Public read app_config" on app_config
  for select using (true);

create policy "Admin write app_config" on app_config
  for all using (true);
