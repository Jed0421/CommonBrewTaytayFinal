# Free daily sales report scheduling

No Render cron, new paid service, or new email provider is needed. Use the existing GitHub Actions secrets and Gmail sender. Standard ubuntu-latest runners are free for public repositories. Keep this repository public; private repositories have different usage allowances.

## Activate

Push the workflow and scripts to main. The Daily sales report workflow requests a runner at 7:17 PM Philippine time (11:17 UTC) and again at 8:17 PM (12:17 UTC) as a backup. Dependencies install before closing; the script waits until 9 PM PHT / 13:00 UTC before querying sales and sending. The 130-minute job timeout accommodates the early start. Concurrency does not cancel the active waiting run; the backup queues behind it. The database report-date claim prevents another email after a successful run.

The existing DAILY_SALES_REPORT_EMAIL, Supabase credentials and Gmail API secrets in GitHub Actions are reused. The previously proposed DAILY_SALES_REPORT_SCHEDULER variable is no longer used. Do not create the paid Render cron service. If you separately created one, disable/delete it to avoid charges.

## Timing limits

This is a best-effort free setup, not a guarantee of exactly 9:00 PM inbox arrival. GitHub can delay or drop scheduled triggers. The early triggers provide a buffer but are not independent scheduling services. Database queries, Gmail submission and inbox processing also take time. The script logs the target closing time, actual run time and email submission time.

No email is sent before 9 PM. If both scheduled triggers are delayed past Philippine midnight, scheduled waiting mode fails rather than choosing the wrong day; recover using workflow_dispatch with the explicit missed report_date. Keep preview=true first, then preview=false to send after verifying. Do not automatically clear database claims with no sent_at: check provider logs first to avoid duplicate delivery.

Scheduled Actions in inactive public repositories can be disabled by GitHub; monitor Actions for failures and disabled workflows. No laptop or website visit is needed for the report.

## Local checks (no email sent)

node --experimental-strip-types scripts/reportSchedule.test.ts
npm run lint

Sources:
https://docs.github.com/en/actions/concepts/billing-and-usage
https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
