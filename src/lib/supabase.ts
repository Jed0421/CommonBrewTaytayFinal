import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Explicit Vite references are replaced at build time. Never expose the server key.
const isServer = typeof window === 'undefined';
const browserEnv = import.meta.env;
const supabaseUrl = isServer
  ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
  : (browserEnv?.VITE_SUPABASE_URL || '');
const supabaseServiceKey = isServer
  ? (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  : (browserEnv?.VITE_SUPABASE_ANON_KEY || '');

// Tell whether a Supabase key is the secret server key or the public (anon/publishable) one
function describeKey(key: string): string {
  if (key.startsWith('sb_secret_')) return 'secret/service_role';
  if (key.startsWith('sb_publishable_')) return 'public/anon';
  try {
    const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'service_role' ? 'secret/service_role' : 'public/anon';
  } catch {
    return 'unknown';
  }
}

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    if (isServer) {
      console.log(`[Supabase] Server client initialized successfully (key type: ${describeKey(supabaseServiceKey)})`);
      if (describeKey(supabaseServiceKey) !== 'secret/service_role') {
        console.warn('[Supabase] WARNING: the server is not using the secret service_role key. Set SUPABASE_SERVICE_KEY in .env, or database writes will fail once Row Level Security is locked down.');
      }
    }
  } catch (err) {
    console.warn('[Supabase] Client skipped or failed initialization:', err);
  }
} else if (isServer) {
  console.warn(
    '[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. In-memory sync remains active.'
  );
}

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseInstance);
};
