import { cookies } from 'next/headers';
import { getGoogleConfig } from './config';

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');

export interface AdminSession {
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  isDevPasswordAuth?: boolean;
}

export function getGoogleOAuthURL(state?: string): string {
  const config = getGoogleConfig();
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI) are missing.');
  }

  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: config.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });

  if (state) {
    params.set('state', state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth credentials not configured in environment.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to exchange authorization code: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to refresh token: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  verified_email: boolean;
  picture?: string;
}> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google user profile: ${res.status}`);
  }

  return res.json();
}

export async function setAdminSessionCookie(session: AdminSession) {
  const cookieStore = await cookies();
  const sessionString = Buffer.from(JSON.stringify(session)).toString('base64');

  cookieStore.set('admin_session', sessionString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('admin_session');
    if (!cookie?.value) return null;

    // Handle legacy 'authenticated' string
    if (cookie.value === 'authenticated') {
      return {
        email: process.env.ADMIN_GOOGLE_EMAIL || 'amitdied69@gmail.com',
        accessToken: '',
        expiresAt: Date.now() + 86400000,
        isDevPasswordAuth: true,
      };
    }

    const json = Buffer.from(cookie.value, 'base64').toString('utf8');
    const session: AdminSession = JSON.parse(json);

    // If session has refreshToken and accessToken expired, refresh it
    if (session.refreshToken && session.expiresAt && Date.now() > session.expiresAt - 60000) {
      try {
        const refreshed = await refreshAccessToken(session.refreshToken);
        session.accessToken = refreshed.access_token;
        session.expiresAt = Date.now() + refreshed.expires_in * 1000;
        await setAdminSessionCookie(session);
      } catch (err) {
        console.error('Failed to auto-refresh access token:', err);
      }
    }

    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Returns a valid Google Access Token for API operations:
 * checks active admin session first, then any stored refresh token.
 */
export async function getValidGoogleAccessToken(): Promise<string | null> {
  const session = await getAdminSession();
  if (session?.accessToken) {
    return session.accessToken;
  }
  return null;
}
