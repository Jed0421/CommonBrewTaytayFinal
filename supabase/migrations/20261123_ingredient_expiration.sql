begin;
alter table public.inventory add column if not exists expiration_date date;
create table if not exists public.ingredient_expiration_alerts (
 inventory_id text not null,
 expiration_date date not null,
 administrator_id text not null,
 claimed_at timestamptz not null default now(),
 sent_at timestamptz,
 primary key (inventory_id, expiration_date, administrator_id)
);
alter table public.ingredient_expiration_alerts enable row level security;
revoke all on public.ingredient_expiration_alerts from anon, authenticated;
grant select, insert, update on public.ingredient_expiration_alerts to service_role;
commit;
