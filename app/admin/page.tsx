import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/google/auth';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session || !session.isAuthenticated) {
    redirect('/admin/login');
  }

  return <AdminDashboardClient adminUser={session} />;
}
