begin;

create table if not exists public.critical_stock_email_queue (
  id bigint generated always as identity primary key,
  administrator_id text not null,
  ingredient_name text not null,
  unit text not null,
  current_stock double precision not null,
  critical_level double precision not null,
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  sent_at timestamptz,
  skipped_at timestamptz
);

create index if not exists critical_stock_email_queue_pending
  on public.critical_stock_email_queue (available_at, id)
  where sent_at is null and skipped_at is null;

alter table public.critical_stock_email_queue enable row level security;
revoke all on public.critical_stock_email_queue from public, anon, authenticated;
grant select, update on public.critical_stock_email_queue to service_role;

create or replace function public.queue_critical_stock_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_archived is true or new.current_stock > new.critical_level then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_archived is not true and old.current_stock <= old.critical_level then
      return new;
    end if;
  end if;

  insert into public.critical_stock_email_queue (
    administrator_id, ingredient_name, unit, current_stock, critical_level
  )
  select id, new.name, new.unit, new.current_stock, new.critical_level
  from public.users
  where role = 'Administrator' and is_active is true
    and nullif(btrim(email), '') is not null;
  return new;
end;
$$;

revoke all on function public.queue_critical_stock_email() from public, anon, authenticated;

drop trigger if exists inventory_critical_stock_email on public.inventory;
create trigger inventory_critical_stock_email
after insert or update of current_stock, critical_level, is_archived on public.inventory
for each row execute function public.queue_critical_stock_email();

create or replace function public.claim_critical_stock_email()
returns setof public.critical_stock_email_queue
language sql
set search_path = ''
as $$
  update public.critical_stock_email_queue q
  set available_at = now() + interval '10 minutes'
  where q.id = (
    select p.id from public.critical_stock_email_queue p
    where p.sent_at is null and p.skipped_at is null and p.available_at <= now()
    order by p.available_at, p.id
    limit 1
    for update skip locked
  )
  returning q.*;
$$;

revoke all on function public.claim_critical_stock_email() from public, anon, authenticated;
grant execute on function public.claim_critical_stock_email() to service_role;

commit;
