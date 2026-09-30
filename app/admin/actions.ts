'use server';

import { redirect } from 'next/navigation';
import {
  verifyAdminPassword,
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
} from '@/lib/auth';

export async function loginWithPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const result = await verifyAdminPassword(password);
  if (!result.ok) {
    return result;
  }

  await createAdminSession();
  return { ok: true };
}

export async function checkSession() {
  const session = await getAdminSession();
  return session;
}

export async function logout() {
  await destroyAdminSession();
  redirect('/admin/login');
}
