import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase environment variables from either process.env (server) or import.meta.env (client Vite)
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Vite client fallback
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return ((import.meta as any).env[`VITE_${key}`] || (import.meta as any).env[key] || '') as string;
  }
  return '';
};

const isServer = typeof window === 'undefined';

// Only use default remote URL/key on the server where CORS does not apply and secrets are safe
const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || (isServer ? 'https://itgzbiizvdkuwozqbnqo.supabase.co' : '');
const supabaseServiceKey = isServer
  ? (getEnvVar('SUPABASE_SERVICE_KEY') || getEnvVar('SUPABASE_ANON_KEY') || '')
  : (getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || '');

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
