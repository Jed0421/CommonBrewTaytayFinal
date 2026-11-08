-- Run once in Supabase SQL Editor before deploying the Vercel API.
-- Does not modify existing users, passwords, products, or inventory.
create table if not exists public.server_state (
  namespace text not null,
  key_hash text not null,
  value jsonb not null,
  user_id text,
  expires_at timestamptz not null,
  primary key (namespace, key_hash)
);
create index if not exists server_state_expiry_idx on public.server_state (expires_at);
create index if not exists server_state_user_idx on public.server_state (namespace, user_id);
alter table public.server_state enable row level security;
revoke all on public.server_state from anon, authenticated;
grant select, insert, update, delete on public.server_state to service_role;
-- Expired rows are rejected by the API. They may be periodically removed with:
-- delete from public.server_state where expires_at < now();
