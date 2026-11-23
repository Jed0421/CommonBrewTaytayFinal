-- DEMO ONLY. Run after 20261123_ingredient_expiration.sql.
-- Preserves any dates already entered. Excludes non-food items.
begin;
alter table public.inventory add column if not exists expiration_date_is_demo boolean not null default false;
update public.inventory
set expiration_date = (now() at time zone 'Asia/Manila')::date + (1 + floor(random() * 60))::integer,
    expiration_date_is_demo = true,
    updated_at = now()
where expiration_date is null
  and not coalesce(is_archived, false)
  and category in ('Tea & Base', 'Coffee Beans', 'Dairy & Milk', 'Powders', 'Syrups', 'Syrups & Flavors', 'Toppings & Add-ons', 'Fresh Fruit', 'Beverages', 'Snack Ingredients', 'Pastries')
  and name !~* '(cup|straw|seal|lid|packaging|container|napkin|tissue|bag|utensil|cleaner|detergent)';
commit;
-- Review assigned demo dates and any unmatched items still needing classification.
select name, category, expiration_date, expiration_date_is_demo
from public.inventory where not coalesce(is_archived, false) order by category, name;
