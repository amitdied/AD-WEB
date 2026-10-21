import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isValidSupabaseUrl } from './supabase';

let supabaseAdminInstance: SupabaseClient | null = null;

export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && isValidSupabaseUrl(url) && serviceKey);
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey || !isValidSupabaseUrl(url)) {
    return null;
  }

  try {
    supabaseAdminInstance = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return supabaseAdminInstance;
  } catch (err) {
    console.warn('[Supabase Admin] Could not initialize client:', err);
    return null;
  }
}
