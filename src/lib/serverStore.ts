import { createHash } from 'node:crypto';
import { supabase } from './supabase.ts';

// Server-only, RLS-protected storage shared by all Vercel instances.
export class PersistentStore<T extends { createdAt?: number; expiresAt?: number; userId?: string; customerId?: string }> {
  private memory = new Map<string, T>();
  constructor(private namespace: string, private persistent: boolean) {}
  private key(key: string) { return createHash('sha256').update(key).digest('hex'); }
  private client() {
    if (!supabase) throw new Error('Supabase server credentials are missing.');
    return supabase;
  }
  private expiry(value: T) {
    return value.expiresAt ?? ((value.createdAt ?? Date.now()) +
      (this.namespace === 'staff-session' ? 12 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000));
  }
  async get(key: string): Promise<T | undefined> {
    if (!this.persistent) return this.memory.get(key);
    const { data, error } = await this.client().from('server_state').select('value, expires_at')
      .eq('namespace', this.namespace).eq('key_hash', this.key(key)).maybeSingle();
    if (error) throw new Error('Session storage unavailable. Apply the Vercel SQL migration.');
    if (!data || new Date(data.expires_at).getTime() <= Date.now()) return undefined;
    return data.value as T;
  }
  async set(key: string, value: T): Promise<void> {
    if (!this.persistent) { this.memory.set(key, value); return; }
    // Store only the hash of session tokens, never the bearer token itself.
    const { token: _token, ...safeValue } = value as T & { token?: string };
    const { error } = await this.client().from('server_state').upsert({
      namespace: this.namespace, key_hash: this.key(key), value: safeValue,
      user_id: value.userId || value.customerId || null,
      expires_at: new Date(this.expiry(value)).toISOString()
    });
    if (error) throw new Error('Could not persist session or verification code.');
  }
  async delete(key: string): Promise<boolean> {
    if (!this.persistent) return this.memory.delete(key);
    const { error } = await this.client().from('server_state').delete()
      .eq('namespace', this.namespace).eq('key_hash', this.key(key));
    if (error) throw new Error('Could not revoke session or verification code.');
    return true;
  }
  async deleteForUser(userId: string): Promise<number> {
    if (!this.persistent) {
      let count = 0;
      for (const [key, value] of this.memory) if (value.userId === userId) { this.memory.delete(key); count++; }
      return count;
    }
    const { error } = await this.client().from('server_state').delete()
      .eq('namespace', this.namespace).eq('user_id', userId);
    if (error) throw new Error('Could not revoke account sessions.');
    return 0;
  }
}
