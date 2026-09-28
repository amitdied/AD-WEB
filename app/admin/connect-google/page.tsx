import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/google/auth';
import ConnectGoogleClient from './ConnectGoogleClient';

export const dynamic = 'force-dynamic';

export default async function ConnectGooglePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();

  // Strict check: only logged-in AMITDIED69@gmail.com can open it
  if (!session || !session.isAuthenticated) {
    redirect('/admin/login');
  }

  const { error } = await searchParams;
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('google_connect_refresh_token')?.value || null;

  return (
    <ConnectGoogleClient
      initialRefreshToken={refreshToken}
      errorMessage={error || null}
    />
  );
}
