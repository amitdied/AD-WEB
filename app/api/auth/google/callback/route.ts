import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_CONFIG } from '@/lib/google/config';
import {
  STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  saveStoredTokens,
  signSessionPayload,
} from '@/lib/google/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const errorParam = searchParams.get('error');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Handle OAuth provider error (e.g. user cancelled)
    if (errorParam) {
      console.warn('Google OAuth returned error:', errorParam);
      return NextResponse.redirect(
        new URL(`/admin/login?error=${encodeURIComponent(errorParam)}`, req.url)
      );
    }

    // CSRF State Validation
    const stateCookie = req.cookies.get(STATE_COOKIE_NAME)?.value;
    if (!state || !stateCookie || state !== stateCookie) {
      console.error('OAuth state/CSRF validation failed', { state, stateCookie });
      return NextResponse.redirect(
        new URL('/admin/login?error=csrf_validation_failed', req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/login?error=missing_code', req.url)
      );
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code, GOOGLE_CONFIG.REDIRECT_URI);

    // Fetch user profile from Google to verify email
    const userInfo = await fetchGoogleUserInfo(tokens.access_token);
    const email = (userInfo.email || '').toLowerCase().trim();
    const requiredAdmin = GOOGLE_CONFIG.ADMIN_EMAIL.toLowerCase().trim();

    // STRICT ACCESS CONTROL: ONLY AMITDIED69@gmail.com
    if (email !== requiredAdmin) {
      console.warn(`[SECURITY] Rejected Google login attempt from ${email}. Authorized: ${requiredAdmin}`);
      const unauthResponse = NextResponse.redirect(
        new URL(
          `/admin/login?error=unauthorized_account&attempted=${encodeURIComponent(userInfo.email || '')}`,
          req.url
        )
      );
      unauthResponse.cookies.delete(STATE_COOKIE_NAME);
      return unauthResponse;
    }

    // Persist tokens securely server-side for Drive & Sheets API calls
    saveStoredTokens({
      ...tokens,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    });

    // Create secure signed session token
    const sessionToken = signSessionPayload({
      email: userInfo.email,
      name: userInfo.name || 'AMITDIED',
      picture: userInfo.picture || '',
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Success: Redirect to /admin with secure HTTP-only session cookie
    const response = NextResponse.redirect(new URL('/admin', req.url));

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Clear state cookie
    response.cookies.delete(STATE_COOKIE_NAME);

    return response;
  } catch (err: any) {
    console.error('Error in Google OAuth callback:', err);
    return NextResponse.redirect(
      new URL(`/admin/login?error=callback_error&message=${encodeURIComponent(err.message || 'Unknown error')}`, req.url)
    );
  }
}
