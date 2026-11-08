begin;

alter table public.online_orders
  add column if not exists gcash_receipt_image text,
  add column if not exists gcash_receipt_pending boolean not null default false;

alter table public.online_orders
  drop constraint if exists online_orders_receipt_requires_completion;

alter table public.online_orders
  add constraint online_orders_receipt_requires_completion
  check (
    gcash_receipt_image is null
    or (status is not distinct from 'Completed' and payment_method is not distinct from 'GCash')
  );

-- Access stays server-side. Do not add anon/authenticated policies to this bucket.
insert into storage.buckets (id, name, public)
values ('gcash-receipts-pending', 'gcash-receipts-pending', false)
on conflict (id) do update set public = false;

commit;

