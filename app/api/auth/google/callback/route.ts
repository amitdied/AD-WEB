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

    // 1. Verify required environment variables
    if (!GOOGLE_CONFIG.CLIENT_ID) {
      console.error('[AUTH ERROR] Missing required environment variable: GOOGLE_CLIENT_ID');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=GOOGLE_CLIENT_ID', req.url)
      );
    }
    if (!GOOGLE_CONFIG.CLIENT_SECRET) {
      console.error('[AUTH ERROR] Missing required environment variable: GOOGLE_CLIENT_SECRET');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=GOOGLE_CLIENT_SECRET', req.url)
      );
    }
    if (!GOOGLE_CONFIG.REDIRECT_URI) {
      console.error('[AUTH ERROR] Missing required environment variable: GOOGLE_REDIRECT_URI');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=GOOGLE_REDIRECT_URI', req.url)
      );
    }
    if (!GOOGLE_CONFIG.ADMIN_EMAIL) {
      console.error('[AUTH ERROR] Missing required environment variable: ADMIN_GOOGLE_EMAIL');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=ADMIN_GOOGLE_EMAIL', req.url)
      );
    }

    // 2. Handle OAuth provider error (e.g. user cancelled, consent denied)
    if (errorParam) {
      console.error('[AUTH ERROR] Google OAuth callback returned error:', errorParam);
      return NextResponse.redirect(
        new URL(
          `/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=${encodeURIComponent(errorParam)}`,
          req.url
        )
      );
    }

    // 3. CSRF State Validation
    const stateCookie = req.cookies.get(STATE_COOKIE_NAME)?.value;
    if (!state || !stateCookie || state !== stateCookie) {
      console.error(
        '[AUTH ERROR] OAuth state verification failed or state cookie expired. Reason: STATE_MISMATCH'
      );
      return NextResponse.redirect(
        new URL('/admin/login?code=STATE_MISMATCH', req.url)
      );
    }

    if (!code) {
      console.error('[AUTH ERROR] Authorization code missing from callback URL.');
      return NextResponse.redirect(
        new URL('/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=missing_code', req.url)
      );
    }

    // 4. Exchange authorization code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code, GOOGLE_CONFIG.REDIRECT_URI);
    } catch (tokenErr: any) {
      const rawMessage = String(tokenErr.message || 'token_exchange_failed');
      console.error('[AUTH ERROR] Token exchange failed with Google:', rawMessage);

      // Extract specific Google error code like invalid_grant, invalid_client, etc.
      const match = rawMessage.match(/\b(invalid_grant|invalid_client|invalid_request|unauthorized_client|unsupported_grant_type|redirect_uri_mismatch)\b/i);
      const safeErrorName = match ? match[1].toLowerCase() : rawMessage.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);

      return NextResponse.redirect(
        new URL(
          `/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=${encodeURIComponent(safeErrorName)}`,
          req.url
        )
      );
    }

    // 5. Fetch user profile from Google to verify email
    let userInfo;
    try {
      userInfo = await fetchGoogleUserInfo(tokens.access_token);
    } catch (userErr: any) {
      console.error('[AUTH ERROR] Failed to fetch Google user profile info:', userErr.message || 'unknown error');
      return NextResponse.redirect(
        new URL('/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=userinfo_failed', req.url)
      );
    }

    const email = (userInfo?.email || '').toLowerCase().trim();
    const requiredAdmin = GOOGLE_CONFIG.ADMIN_EMAIL.toLowerCase().trim();

    // 6. Strict access control: ONLY AMITDIED69@gmail.com
    if (!email || email !== requiredAdmin) {
      console.error(
        `[AUTH ERROR] Unauthorized email attempt: ${email || 'none'}. Allowed admin: ${requiredAdmin}. Reason: EMAIL_NOT_ALLOWED`
      );
      const unauthResponse = NextResponse.redirect(
        new URL(
          `/admin/login?code=EMAIL_NOT_ALLOWED&detail=${encodeURIComponent(userInfo?.email || 'unknown')}`,
          req.url
        )
      );
      unauthResponse.cookies.delete(STATE_COOKIE_NAME);
      return unauthResponse;
    }

    // 7. Establish session and persist credentials securely server-side
    try {
      saveStoredTokens({
        ...tokens,
        user: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      });

      const sessionToken = signSessionPayload({
        email: userInfo.email,
        name: userInfo.name || 'AMITDIED',
        picture: userInfo.picture || '',
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const response = NextResponse.redirect(new URL('/admin', req.url));

      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      response.cookies.delete(STATE_COOKIE_NAME);
      return response;
    } catch (sessionErr: any) {
      console.error('[AUTH ERROR] Session token creation or persistence failed:', sessionErr.message || 'unknown error');
      return NextResponse.redirect(
        new URL('/admin/login?code=SESSION_FAILED', req.url)
      );
    }
  } catch (err: any) {
    console.error('[AUTH ERROR] Unexpected exception during OAuth callback:', err.message || err);
    return NextResponse.redirect(
      new URL('/admin/login?code=SESSION_FAILED', req.url)
    );
  }
}
