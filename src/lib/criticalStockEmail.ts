import { commonBrewEmail, emailEscape, emailParagraph } from './commonBrewEmail.ts';
import { sendRealEmail } from './sendEmail.ts';
import { supabase } from './supabase.ts';

export function startCriticalStockEmailWorker() {
  const client = supabase;
  if (!client) return;

  let running = false;
  async function deliverQueuedAlerts() {
    if (running || !client) return;
    running = true;

    try {
      // Limit each sweep so a backlog does not monopolize the server.
      for (let index = 0; index < 10; index++) {
        const { data: alert, error: claimError } = await client
          .rpc('claim_critical_stock_email').maybeSingle<{
            id: number;
            administrator_id: string;
            ingredient_name: string;
            unit: string;
            current_stock: number;
            critical_level: number;
            available_at: string;
          }>();
        if (claimError) throw claimError;
        if (!alert) break;

        const { data: admin, error: adminError } = await client.from('users')
          .select('email').eq('id', alert.administrator_id)
          .eq('role', 'Administrator').eq('is_active', true).maybeSingle();
        if (adminError) throw adminError;

        const recipient = admin?.email?.trim();
        let result: { sent: boolean } | undefined;
        if (recipient) {
          const ingredient = alert.ingredient_name;
          const stock = alert.current_stock + ' ' + alert.unit;
          const threshold = alert.critical_level + ' ' + alert.unit;
          const detail = 'Stock at alert: ' + stock + '. Critical level: ' + threshold + '.';
          const text = ingredient + ' reached critical stock. ' + detail + ' Please review inventory and arrange restocking.';
          const html = commonBrewEmail({
            category: 'Inventory alert',
            title: 'Critical stock reached',
            preview: ingredient + ' needs restocking.',
            body: emailParagraph('<strong>' + emailEscape(ingredient) + '</strong> reached its critical stock level.') +
              emailParagraph(emailEscape(detail)) +
              emailParagraph('Please review inventory and arrange restocking.')
          });
          result = await sendRealEmail(recipient, 'CommonBrew critical stock alert', html, text);
          if (!result.sent) {
            console.error('[Critical stock email] Provider did not confirm alert ' + alert.id + '. Will retry.');
            continue;
          }
        }

        const timestamp = new Date().toISOString();
        const { error: saveError } = await client.from('critical_stock_email_queue')
          .update(result?.sent ? { sent_at: timestamp } : { skipped_at: timestamp })
          .eq('id', alert.id).eq('available_at', alert.available_at);
        if (saveError) throw saveError;
      }
    } catch (error) {
      console.error('[Critical stock email] Queue processing failed:', error);
    } finally {
      running = false;
    }
  }

  void deliverQueuedAlerts();
  const interval = setInterval(() => void deliverQueuedAlerts(), 30_000);
  interval.unref();
}
