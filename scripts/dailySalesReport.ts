import 'dotenv/config';
import { supabase } from '../src/lib/supabase.ts';
import { sendRealEmail } from '../src/lib/sendEmail.ts';

interface Sale {
  reference: string;
  time: string;
  payment: string;
  total: number;
  online: boolean;
  excluded: boolean;
}

interface SalesReport {
  transactions: Sale[];
  online_orders: Record<string, number>;
}

const zone = 'Asia/Manila';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
});
const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: zone, hour: 'numeric', minute: '2-digit'
});
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const money = (cents: number) => peso.format(cents / 100);

function formatReport(date: string, report: SalesReport) {
  const sales = report.transactions.filter(row => !row.excluded);
  const online = sales.filter(row => row.online);
  const pos = sales.filter(row => !row.online);
  const total = (rows: Sale[]) => rows.reduce((sum, row) => sum + Math.round(row.total * 100), 0);
  const placed = Object.values(report.online_orders).reduce((sum, count) => sum + count, 0);
  const statuses = Object.entries(report.online_orders)
    .map(([status, count]) => status + ': ' + count).join(', ');
  return [
    'CommonBrew Taytay | Daily Sales Report',
    date + ' | Midnight to 9:00 PM Philippine time',
    '',
    'Total completed sales: ' + sales.length,
    'Total revenue: ' + money(total(sales)),
    'POS: ' + pos.length + ' sales | ' + money(total(pos)),
    'Completed online sales: ' + online.length + ' | ' + money(total(online)),
    'Online orders placed: ' + placed + (statuses ? ' (' + statuses + ')' : ''),
    'Excluded transactions (voided or online order not completed): ' + (report.transactions.length - sales.length),
    '',
    'Transactions',
    ...report.transactions.map(row =>
      [timeFormatter.format(new Date(row.time)), row.reference, row.online ? 'Online' : 'POS',
        row.payment, money(Math.round(row.total * 100)), row.excluded ? 'Excluded' : 'Counted'].join(' | ')
    ),
    ...(report.transactions.length ? [] : ['No transactions recorded.'])
  ].join('\n');
}

async function main() {
  if (!supabase) throw new Error('Configure the Supabase server credentials.');
  const dryRun = process.argv.includes('--dry-run');
  const date = dateFormatter.format(new Date());
  const start = new Date(date + 'T00:00:00+08:00');
  const closing = new Date(date + 'T21:00:00+08:00');
  if (!dryRun && Date.now() < closing.getTime()) {
    throw new Error('The report can be emailed at or after 9:00 PM Philippine time. Use --dry-run to preview.');
  }

  const { data, error } = await supabase.rpc('daily_sales_report', {
    day_start: start.toISOString(), day_end: closing.toISOString()
  });
  if (error) throw error;
  const report = formatReport(date, data as SalesReport);
  if (dryRun) { console.log(report); return; }

  const recipient = process.env.DAILY_SALES_REPORT_EMAIL?.trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Set DAILY_SALES_REPORT_EMAIL to the owner or admin email address.');
  }
  const { error: claimError } = await supabase.from('daily_sales_report_runs').insert({ report_date: date });
  if (claimError?.code === '23505') {
    console.log('A report run already exists for ' + date + '. Check sent_at before retrying.');
    return;
  }
  if (claimError) throw claimError;

  // Keep the claim on an uncertain outcome to prevent a duplicate email.
  const html = '<pre style="white-space:pre-wrap;font-family:system-ui">' +
    report.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
  const result = await sendRealEmail(recipient, 'CommonBrew Daily Sales Report | ' + date, html, report);
  if (!result.sent) throw new Error('Email provider did not confirm delivery. Check provider logs before clearing the report run.');
  const { error: markError } = await supabase.from('daily_sales_report_runs')
    .update({ sent_at: new Date().toISOString() }).eq('report_date', date);
  if (markError) throw markError;
  console.log('Daily sales report sent for ' + date);
}

main().catch(error => {
  console.error('Daily sales report failed:', error);
  process.exitCode = 1;
});

