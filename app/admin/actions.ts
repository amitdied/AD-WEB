'use server';

import { redirect } from 'next/navigation';
import { setAdminSessionCookie, clearAdminSessionCookie } from '@/lib/google/auth';

export async function login(prevState: any, formData: FormData) {
  const password = formData.get('password');
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin';

  if (password === correctPassword) {
    await setAdminSessionCookie({
      email: process.env.ADMIN_GOOGLE_EMAIL || 'amitdied69@gmail.com',
      accessToken: '',
      expiresAt: Date.now() + 86400000 * 7,
      isDevPasswordAuth: true,
    });

    redirect('/admin');
  } else {
    return { error: 'Invalid password. Try "admin" or configure Google OAuth.' };
  }
}

export async function logout() {
  await clearAdminSessionCookie();
  redirect('/admin/login');
}
