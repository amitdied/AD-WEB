import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_CONFIG } from '@/lib/google/config';
import { generateOAuthState, STATE_COOKIE_NAME } from '@/lib/google/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isConnect = req.nextUrl.searchParams.get('mode') === 'connect';
    const state = generateOAuthState();
    const stateCookieValue = isConnect ? `${state}:connect` : state;

    const redirectUri = GOOGLE_CONFIG.REDIRECT_URI;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CONFIG.CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_CONFIG.SCOPES.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(authUrl.toString());

    // Secure HTTP-only state cookie for CSRF and mode tracking
    response.cookies.set(STATE_COOKIE_NAME, stateCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error('Error starting Google OAuth:', error);
    return NextResponse.redirect(
      new URL('/admin/login?code=SESSION_FAILED&detail=oauth_start_failed', req.url)
    );
  }
}
