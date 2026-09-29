import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function isValidSupabaseUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Validate before calling createClient: must have valid http/https URL and anon key
  if (!isValidSupabaseUrl(url) || !anonKey) {
    return null;
  }

  try {
    clientInstance = createClient(url, anonKey);
    return clientInstance;
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err);
    return null;
  }
}

// Safe proxy to prevent build-time crashes while maintaining existing export contract
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      throw new Error(
        'Supabase client not initialized: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid.'
      );
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default supabase;
