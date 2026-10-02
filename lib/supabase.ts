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

export function sanitizeStorageFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

export type StorageBucketType = 'audio' | 'covers' | 'cctv';

export interface SupabaseUploadResult {
  ok: boolean;
  path?: string;
  bucket?: string;
  error?: string;
}

/**
 * Client-side browser upload to Supabase Storage with real-time 0-100% progress tracking.
 * Does NOT convert files to Node Buffers.
 */
export async function uploadToSupabaseStorage(
  bucket: StorageBucketType,
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<SupabaseUploadResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey || !isValidSupabaseUrl(url)) {
    return {
      ok: false,
      error: 'Supabase configuration missing or invalid: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY',
    };
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Browser-native XMLHttpRequest allows real-time upload progress events without server buffering
  if (typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined') {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const endpoint = `${url.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${cleanPath}`;

      xhr.open('POST', endpoint);
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'false');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100);
          resolve({ ok: true, path: cleanPath, bucket });
        } else {
          let errorMsg = `Upload failed with status ${xhr.status}`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            errorMsg = parsed.message || parsed.error || errorMsg;
          } catch {
            if (xhr.statusText) errorMsg = xhr.statusText;
          }
          resolve({ ok: false, error: errorMsg });
        }
      };

      xhr.onerror = () => {
        resolve({ ok: false, error: 'Network error occurred during Supabase Storage upload' });
      };

      xhr.onabort = () => {
        resolve({ ok: false, error: 'Upload was aborted' });
      };

      xhr.send(file);
    });
  }

  // Fallback to client.storage.from()
  const client = getSupabase();
  if (!client) {
    return { ok: false, error: 'Could not initialize Supabase client' };
  }

  if (onProgress) onProgress(10);
  const { error } = await client.storage.from(bucket).upload(cleanPath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (onProgress) onProgress(100);
  return { ok: true, path: cleanPath, bucket };
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
