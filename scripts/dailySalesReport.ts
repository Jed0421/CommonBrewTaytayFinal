import 'dotenv/config';
import { commonBrewEmail, emailEscape, emailParagraph } from '../src/lib/commonBrewEmail.ts';
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
  const text = [
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
  const headingStyle = 'margin:24px 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#796651;';
  const cellStyle = 'padding:10px 0;border-bottom:1px solid #e6dfd6;font-size:13px;line-height:19px;color:#30251e;';
  const totals = [
    ['Completed sales', String(sales.length)],
    ['POS · ' + pos.length + ' sales', money(total(pos))],
    ['Online · ' + online.length + ' completed sales', money(total(online))],
    ['Online orders placed', String(placed)],
    ['Excluded transactions', String(report.transactions.length - sales.length)]
  ];
  const html = commonBrewEmail({
    category: 'Closing report',
    title: 'Daily Sales Report',
    preview: date + ' · ' + sales.length + ' completed sales · ' + money(total(sales)),
    body: `
      ${emailParagraph(emailEscape(date) + ' &nbsp;·&nbsp; Midnight to 9:00 PM Philippine time')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr><td bgcolor="#eee9e1" style="padding:16px 18px;">
          <p style="margin:0 0 5px;font-size:10px;letter-spacing:2px;color:#796651;">TOTAL REVENUE</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:30px;line-height:36px;color:#30251e;">${emailEscape(money(total(sales)))}</p>
        </td></tr>
      </table>
      <h2 style="${headingStyle}">Sales summary</h2>
      <table width="100%" cellpadding="0" cellspacing="0" aria-label="Sales summary" style="border-collapse:collapse;">
        ${totals.map(([label, value]) => `<tr>
          <th scope="row" align="left" style="${cellStyle}font-weight:normal;padding-right:12px;">${emailEscape(label)}</th>
          <td align="right" style="${cellStyle}font-weight:bold;">${emailEscape(value)}</td>
        </tr>`).join('')}
      </table>
      ${statuses ? `<p style="margin:10px 0 0;font-size:12px;line-height:18px;color:#6f6256;">Online order status: ${emailEscape(statuses)}</p>` : ''}
      <h2 style="${headingStyle}">Transactions</h2>
      <table width="100%" cellpadding="0" cellspacing="0" aria-label="Transactions" style="border-collapse:collapse;">
        <tr>
          <th scope="col" align="left" style="${cellStyle}">Sale details</th>
          <th scope="col" align="right" style="${cellStyle}">Amount</th>
        </tr>
        ${report.transactions.map(row => `<tr>
          <td style="${cellStyle}padding-right:12px;word-break:break-word;">
            <strong>${emailEscape(row.reference)}</strong><br>
            <span style="font-size:12px;color:#6f6256;">${emailEscape([
              timeFormatter.format(new Date(row.time)), row.online ? 'Online' : 'POS', row.payment,
              ...(row.excluded ? ['Excluded'] : [])
            ].join(' · '))}</span>
          </td>
          <td align="right" valign="top" style="${cellStyle}white-space:nowrap;">${emailEscape(money(Math.round(row.total * 100)))}</td>
        </tr>`).join('')}
        ${report.transactions.length ? '' : `<tr><td colspan="2" style="${cellStyle}">No transactions recorded.</td></tr>`}
      </table>`
  });
  return { text, html };

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
  if (dryRun) { console.log(report.text); return; }

  const recipient = process.env.DAILY_SALES_REPORT_EMAIL?.trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Set DAILY_SALES_REPORT_EMAIL to the owner or admin email address.');
  }
  const gmailKeys = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'];
  const missingGmail = gmailKeys.filter(key => !process.env[key]?.trim());
  const smtpConfigured = Boolean(process.env.SMTP_PASS?.replace(/\s+/g, ''));
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  if (missingGmail.length && !smtpConfigured && !resendConfigured) {
    throw new Error(
      'No email provider configured in GitHub Actions. Missing Gmail API secrets: ' +
      missingGmail.join(', ') + '. Alternatively configure SMTP_PASS or RESEND_API_KEY.'
    );
  }

  const { error: claimError } = await supabase.from('daily_sales_report_runs').insert({ report_date: date });
  if (claimError?.code === '23505') {
    console.log('A report run already exists for ' + date + '. Check sent_at before retrying.');
    return;
  }
  if (claimError) throw claimError;

  // Keep the claim on an uncertain outcome to prevent a duplicate email.
  const result = await sendRealEmail(recipient, 'CommonBrew Daily Sales Report | ' + date, report.html, report.text);
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

