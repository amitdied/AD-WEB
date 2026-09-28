import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/google/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await clearAdminSessionCookie();
  return NextResponse.redirect(new URL('/admin/login', req.url));
}

export async function POST(req: NextRequest) {
  await clearAdminSessionCookie();
  return NextResponse.json({ success: true });
}
