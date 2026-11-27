begin;
create table if not exists public.expiration_stock_deductions (
 id bigint generated always as identity primary key,
 inventory_id text not null,
 expiration_date date not null,
 quantity numeric not null,
 deducted_at timestamptz not null default now()
);
alter table public.expiration_stock_deductions enable row level security;
revoke all on public.expiration_stock_deductions from anon, authenticated;
grant select, insert on public.expiration_stock_deductions to service_role;
create or replace function public.deduct_expired_inventory()
returns void language plpgsql security definer set search_path = '' as $$
declare item record;
begin
 for item in select id, expiration_date, current_stock from public.inventory
 where not coalesce(is_archived,false) and current_stock > 0
 and expiration_date <= (now() at time zone 'Asia/Manila')::date
 for update skip locked
 loop
  insert into public.expiration_stock_deductions(inventory_id,expiration_date,quantity)
  values(item.id,item.expiration_date,item.current_stock);
  update public.inventory set current_stock=0, updated_at=now() where id=item.id;
 end loop;
end;
$$;
revoke all on function public.deduct_expired_inventory() from public,anon,authenticated;
grant execute on function public.deduct_expired_inventory() to service_role;
commit;
