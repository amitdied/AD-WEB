import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function testSupabaseStorageConnection(): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  details?: Record<string, boolean>;
  itemsFound?: number;
}> {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasUrl || !hasKey) {
    const errorMsg = 'MISSING_ENV_VARS: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in this environment';
    console.warn('[SUPABASE_TEST]', errorMsg, { hasUrl, hasKey });
    return {
      ok: false,
      error: errorMsg,
      details: {
        hasNextPublicSupabaseUrl: hasUrl,
        hasNextPublicSupabaseAnonKey: hasKey,
      },
    };
  }

  try {
    // Harmless operation: list root items from 'covers' bucket without modifying anything
    const { data, error } = await supabase.storage.from('covers').list('', {
      limit: 1,
      offset: 0,
    });

    if (error) {
      console.error('[SUPABASE_TEST] Storage operation error:', error.message);
      return {
        ok: false,
        error: error.message,
      };
    }

    console.log('[SUPABASE_TEST] Successfully connected to covers bucket. Item count:', data?.length ?? 0);
    return {
      ok: true,
      message: 'Successfully connected to Supabase covers storage bucket',
      itemsFound: data?.length ?? 0,
    };
  } catch (err: any) {
    const message = err?.message || 'UNKNOWN_STORAGE_ERROR';
    console.error('[SUPABASE_TEST] Unexpected failure during storage test:', message);
    return {
      ok: false,
      error: message,
    };
  }
}

export async function GET() {
  const result = await testSupabaseStorageConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : (result.error?.startsWith('MISSING_ENV') ? 503 : 400) });
}
