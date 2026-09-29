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
  const baseAppUrl = process.env.APP_URL || 'https://amitdied.vercel.app';

  try {
    const { searchParams } = req.nextUrl;
    const errorParam = searchParams.get('error');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // 1. Verify required environment variables
    if (!GOOGLE_CONFIG.CLIENT_ID) {
      console.error('[AUTH ERROR] Missing required environment variable: GOOGLE_CLIENT_ID');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=GOOGLE_CLIENT_ID', baseAppUrl)
      );
    }
    if (!GOOGLE_CONFIG.CLIENT_SECRET) {
      console.error('[AUTH ERROR] Missing required environment variable: GOOGLE_CLIENT_SECRET');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=GOOGLE_CLIENT_SECRET', baseAppUrl)
      );
    }
    if (!GOOGLE_CONFIG.REDIRECT_URI) {
      console.error('[AUTH ERROR] Missing required environment variable: GOOGLE_REDIRECT_URI');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=GOOGLE_REDIRECT_URI', baseAppUrl)
      );
    }
    if (!GOOGLE_CONFIG.ADMIN_EMAIL) {
      console.error('[AUTH ERROR] Missing required environment variable: ADMIN_GOOGLE_EMAIL');
      return NextResponse.redirect(
        new URL('/admin/login?code=MISSING_ENV&detail=ADMIN_GOOGLE_EMAIL', baseAppUrl)
      );
    }

    // 2. Handle OAuth provider error (e.g. user cancelled, consent denied)
    if (errorParam) {
      console.error('[AUTH ERROR] Google OAuth callback returned error:', errorParam);
      return NextResponse.redirect(
        new URL(
          `/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=${encodeURIComponent(errorParam)}`,
          baseAppUrl
        )
      );
    }

    // 3. CSRF State & Connect Mode Validation
    const stateCookie = req.cookies.get(STATE_COOKIE_NAME)?.value || '';

    if (!state || !stateCookie || state !== stateCookie) {
      console.error(
        '[AUTH ERROR] OAuth state verification failed or state cookie expired. Reason: STATE_MISMATCH'
      );
      return NextResponse.redirect(
        new URL('/admin/login?code=STATE_MISMATCH', baseAppUrl)
      );
    }

    const isConnectMode = state.endsWith('.connect') || stateCookie.endsWith('.connect');

    if (!code) {
      console.error('[AUTH ERROR] Authorization code missing from callback URL.');
      return NextResponse.redirect(
        new URL('/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=missing_code', baseAppUrl)
      );
    }

    // 4. Exchange authorization code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code, GOOGLE_CONFIG.REDIRECT_URI);
    } catch (tokenErr: any) {
      const rawMessage = String(tokenErr?.message || 'token_exchange_failed');
      console.error('[AUTH ERROR] Token exchange failed with Google:', rawMessage);

      const match = rawMessage.match(
        /\b(invalid_grant|invalid_client|invalid_request|unauthorized_client|unsupported_grant_type|redirect_uri_mismatch)\b/i
      );
      const safeErrorName = match
        ? match[1].toLowerCase()
        : rawMessage.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);

      return NextResponse.redirect(
        new URL(
          `/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=${encodeURIComponent(safeErrorName)}`,
          baseAppUrl
        )
      );
    }

    // 5. Fetch user profile from Google to verify email
    let userInfo;
    try {
      userInfo = await fetchGoogleUserInfo(tokens.access_token);
    } catch (userErr: any) {
      const userErrName = userErr?.name || 'userinfo_failed';
      console.error('[AUTH ERROR] Failed to fetch Google user profile info:', userErrName);
      return NextResponse.redirect(
        new URL(`/admin/login?code=TOKEN_EXCHANGE_FAILED&detail=${encodeURIComponent(userErrName)}`, baseAppUrl)
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
          baseAppUrl
        )
      );
      unauthResponse.cookies.delete(STATE_COOKIE_NAME);
      return unauthResponse;
    }

    // Sign session token for authenticated admin session
    let sessionToken: string;
    try {
      sessionToken = signSessionPayload({
        email: userInfo.email,
        name: userInfo.name || 'AMITDIED',
        picture: userInfo.picture || '',
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    } catch (signErr: any) {
      const errName = signErr?.name || 'sign_session_failed';
      console.error('[AUTH ERROR] Failed to sign session token:', errName);
      return NextResponse.redirect(
        new URL(`/admin/login?code=SESSION_FAILED&detail=${encodeURIComponent(errName)}`, baseAppUrl)
      );
    }

    // 7. Check if this is the "connect" flow for Drive & Sheets
    if (isConnectMode) {
      if (!tokens.refresh_token) {
        console.error('[AUTH ERROR] Google did not return a refresh token during connect flow.');
        const noTokenResponse = NextResponse.redirect(
          new URL('/admin/connect-google?error=NO_REFRESH_TOKEN_RETURNED', baseAppUrl)
        );
        noTokenResponse.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        noTokenResponse.cookies.delete(STATE_COOKIE_NAME);
        return noTokenResponse;
      }

      // Put the refresh token in a short-lived (5 minute), HTTP-only, Secure cookie and redirect to /admin/connect-google
      const connectResponse = NextResponse.redirect(new URL('/admin/connect-google', baseAppUrl));
      connectResponse.cookies.set('google_connect_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 5 * 60, // 5 minutes
      });
      // Maintain admin session so /admin/connect-google can be accessed immediately
      connectResponse.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      connectResponse.cookies.delete(STATE_COOKIE_NAME);
      return connectResponse;
    }

    // 8. Normal Login Mode: Save in-memory tokens
    saveStoredTokens({
      ...tokens,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    });

    // Redirect directly to /admin using NextResponse.redirect and attach session cookie
    const adminUrl = new URL('/admin', process.env.APP_URL || 'https://amitdied.vercel.app');
    const response = NextResponse.redirect(adminUrl);

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    response.cookies.delete(STATE_COOKIE_NAME);

    return response;
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT' || err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }

    const errName = err?.name || 'session_failed';
    const errMessage = String(err?.message || '');
    const safeErrorDetail = errName !== 'Error'
      ? errName
      : (errMessage.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'unknown_error');

    console.error('[AUTH ERROR] Exception in OAuth callback route:', safeErrorDetail);
    return NextResponse.redirect(
      new URL(
        `/admin/login?code=SESSION_FAILED&detail=${encodeURIComponent(safeErrorDetail)}`,
        process.env.APP_URL || 'https://amitdied.vercel.app'
      )
    );
  }
}
