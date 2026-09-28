import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthURL } from '@/lib/google/auth';
import { checkConfiguration } from '@/lib/google/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { isOAuthConfigured } = checkConfiguration();
  if (!isOAuthConfigured) {
    return NextResponse.redirect(new URL('/admin/login?error=not_configured', req.url));
  }

  try {
    const authUrl = getGoogleOAuthURL();
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('Failed to generate OAuth URL:', err);
    return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
