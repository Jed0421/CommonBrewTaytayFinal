import { supabase } from './supabase.ts';
import { sendRealEmail } from './sendEmail.ts';
import { commonBrewEmail, emailEscape, emailParagraph } from './commonBrewEmail.ts';

export function philippineDate(now = new Date()) {
  return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}
export function isExpired(date: string | null, today = philippineDate()) {
  return Boolean(date && date < today);
}
export async function sendExpirationAlerts() {
  if (!supabase) return;
  const today = philippineDate();
  const { data: items, error } = await supabase.from('inventory')
    .select('id,name,expiration_date,current_stock,unit').eq('is_archived', false)
    .eq('expiration_date_is_demo', false).gt('current_stock', 0).lt('expiration_date', today);
  if (error) throw error;
  if (!items?.length) return;
  const { data: admins, error: adminError } = await supabase.from('users')
    .select('id,email').eq('role', 'Administrator').eq('is_active', true);
  if (adminError) throw adminError;
  for (const item of items) for (const admin of admins || []) {
    if (!admin.email?.trim()) continue;
    const key = { inventory_id: item.id, expiration_date: item.expiration_date, administrator_id: admin.id };
    const { error: claimError } = await supabase.from('ingredient_expiration_alerts').insert(key);
    if (claimError?.code === '23505') continue;
    if (claimError) throw claimError;
    // Retain the claim on uncertain provider outcomes to prevent duplicate delivery.
    const text = `${item.name} has expired.\nExpiration date: ${item.expiration_date}\nChecked on: ${today} (Philippine time)\nRemaining stock: ${item.current_stock} ${item.unit}\nPlease remove expired stock from use and update inventory after replacing it.`;
    const html = commonBrewEmail({ category: 'Ingredient expiration', title: 'Expired ingredient: ' + item.name, preview: item.name + ' has expired.', body: text.split('\n').map(line => emailParagraph(emailEscape(line))).join('') });
    const result = await sendRealEmail(admin.email.trim(), 'CommonBrew expired ingredient: ' + item.name, html, text);
    if (!result.sent) throw new Error('Expiration email not confirmed; inspect provider logs before retrying the claim.');
    const { error: markError } = await supabase.from('ingredient_expiration_alerts').update({sent_at: new Date().toISOString()})
      .eq('inventory_id', item.id).eq('expiration_date', item.expiration_date).eq('administrator_id', admin.id);
    if (markError) throw markError;
  }
}
export function startExpirationEmailWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await sendExpirationAlerts(); }
    catch (error) { console.error('[Ingredient expiration] Check failed:', error); }
    finally { running = false; }
  };
  void tick();
  setInterval(() => void tick(), 15 * 60 * 1000).unref();
}
