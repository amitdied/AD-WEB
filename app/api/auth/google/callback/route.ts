import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserInfo, setAdminSessionCookie } from '@/lib/google/auth';
import { getGoogleConfig } from '@/lib/google/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/login?error=missing_code', req.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getGoogleUserInfo(tokens.access_token);
    const config = getGoogleConfig();

    const allowedEmail = (config.ADMIN_GOOGLE_EMAIL || 'amitdied69@gmail.com').toLowerCase().trim();
    const userEmail = (userInfo.email || '').toLowerCase().trim();

    // Verify authorized admin email
    if (userEmail !== allowedEmail) {
      console.warn(`Unauthorized login attempt from: ${userEmail} (expected: ${allowedEmail})`);
      return NextResponse.redirect(
        new URL(
          `/admin/login?error=unauthorized&attempted=${encodeURIComponent(userEmail)}`,
          req.url
        )
      );
    }

    // Set secure admin session cookie
    await setAdminSessionCookie({
      email: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });

    return NextResponse.redirect(new URL('/admin', req.url));
  } catch (err: any) {
    console.error('OAuth callback processing failed:', err);
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(err.message || 'auth_failed')}`, req.url)
    );
  }
}
