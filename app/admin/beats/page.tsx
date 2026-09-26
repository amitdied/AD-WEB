import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminBeatsManagerClient } from './AdminBeatsManagerClient';

export const metadata = {
  title: 'Beat Management & Direct Upload | AMITDIED Admin',
  description: 'Upload MP3/WAV tracks, cover artwork, and publish live beats to Supabase and store.',
};

export default async function AdminBeatsPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session || session.value !== 'authenticated') {
    redirect('/admin/login');
  }

  return <AdminBeatsManagerClient />;
}
