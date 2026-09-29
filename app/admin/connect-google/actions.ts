'use server';

import { cookies } from 'next/headers';

export async function clearConnectCookie(): Promise<{ ok: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('google_connect_refresh_token');
    return { ok: true };
  } catch (err) {
    return { ok: false };
  }
}
