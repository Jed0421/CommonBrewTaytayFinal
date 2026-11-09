begin;

create table if not exists public.daily_sales_report_runs (
  report_date date primary key,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.daily_sales_report_runs enable row level security;
revoke all on public.daily_sales_report_runs from anon, authenticated;
grant select, insert, update, delete on public.daily_sales_report_runs to service_role;

create or replace function public.daily_sales_report(day_start timestamptz, day_end timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'reference', t.ref_code, 'time', t.created_at, 'payment', t.payment_method,
        'total', t.total, 'online', t.id like 'tx-onl-%',
        'excluded', coalesce(t.is_voided, false) or
          (t.id like 'tx-onl-%' and o.status is distinct from 'Completed')
      ) order by t.created_at, t.id)
      from public.transactions t
      left join public.online_orders o on t.id like 'tx-onl-%' and t.ref_code = o.order_ref
      where t.created_at >= day_start and t.created_at < day_end
    ), '[]'::jsonb),
    'online_orders', coalesce((
      select jsonb_object_agg(status, quantity)
      from (
        select status, count(*) as quantity
        from public.online_orders
        where created_at >= day_start and created_at < day_end
        group by status
      ) counts
    ), '{}'::jsonb)
  );
$$;

revoke all on function public.daily_sales_report(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.daily_sales_report(timestamptz, timestamptz) to service_role;

commit;
