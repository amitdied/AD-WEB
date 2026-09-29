import { NextResponse } from 'next/server';
import { getSupabase, isValidSupabaseUrl } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function testSupabaseStorageConnection(): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  details?: Record<string, boolean>;
  itemsFound?: number;
}> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const hasUrl = Boolean(rawUrl);
  const hasKey = Boolean(rawKey);
  const isUrlValid = isValidSupabaseUrl(rawUrl);

  if (!hasUrl || !hasKey) {
    const errorMsg = 'MISSING_ENV_VARS: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in this environment';
    console.warn('[SUPABASE_TEST]', errorMsg, { hasUrl, hasKey });
    return {
      ok: false,
      error: errorMsg,
      details: {
        hasNextPublicSupabaseUrl: hasUrl,
        hasNextPublicSupabaseAnonKey: hasKey,
        isUrlValid: false,
      },
    };
  }

  if (!isUrlValid) {
    const errorMsg = 'INVALID_ENV_VAR: NEXT_PUBLIC_SUPABASE_URL must start with http:// or https:// and be a valid URL';
    console.warn('[SUPABASE_TEST]', errorMsg);
    return {
      ok: false,
      error: errorMsg,
      details: {
        hasNextPublicSupabaseUrl: true,
        hasNextPublicSupabaseAnonKey: hasKey,
        isUrlValid: false,
      },
    };
  }

  const supabaseClient = getSupabase();
  if (!supabaseClient) {
    return {
      ok: false,
      error: 'INITIALIZATION_FAILED: Could not initialize Supabase client with provided environment variables',
      details: {
        hasNextPublicSupabaseUrl: true,
        hasNextPublicSupabaseAnonKey: true,
        isUrlValid: true,
      },
    };
  }

  try {
    // Harmless operation: list root items from existing 'covers' bucket without modifying anything
    const { data, error } = await supabaseClient.storage.from('covers').list('', {
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
  const isEnvIssue =
    result.error?.startsWith('MISSING_ENV') ||
    result.error?.startsWith('INVALID_ENV') ||
    result.error?.startsWith('INITIALIZATION_FAILED');
  return NextResponse.json(result, { status: result.ok ? 200 : (isEnvIssue ? 503 : 400) });
}
