'use server';

import { cookies } from 'next/headers';

export async function clearConnectCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('google_connect_refresh_token');
}
