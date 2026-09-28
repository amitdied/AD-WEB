import crypto from 'crypto';
import { cookies } from 'next/headers';
import { GOOGLE_CONFIG } from './config';

const SESSION_SECRET = process.env.SESSION_SECRET || GOOGLE_CONFIG.CLIENT_SECRET || 'amitdied-secure-oauth-secret-key';
export const SESSION_COOKIE_NAME = 'admin_session';
export const STATE_COOKIE_NAME = 'google_oauth_state';

// In-memory access token cache (never written to or read from disk)
let memoryAccessToken: string | null = null;
let memoryTokenExpiry: number = 0;

export interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
  user?: {
    email: string;
    name?: string;
    picture?: string;
  };
  updated_at?: string;
}

export interface AdminSession {
  isAuthenticated: boolean;
  email: string;
  name?: string;
  picture?: string;
  hasGoogleTokens: boolean;
}

// In-memory token representations (never touches disk)
export function getStoredTokens(): StoredTokens | null {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || GOOGLE_CONFIG.REFRESH_TOKEN;
  if (!refreshToken && !memoryAccessToken) return null;
  return {
    access_token: memoryAccessToken || '',
    refresh_token: refreshToken || '',
    user: {
      email: GOOGLE_CONFIG.ADMIN_EMAIL,
      name: 'AMITDIED',
    },
    updated_at: new Date().toISOString(),
  };
}

export function saveStoredTokens(newTokens: Partial<StoredTokens>): StoredTokens {
  if (newTokens.access_token) {
    memoryAccessToken = newTokens.access_token;
    memoryTokenExpiry = newTokens.expiry_date || Date.now() + 3600 * 1000;
  }
  return {
    access_token: memoryAccessToken || '',
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN || GOOGLE_CONFIG.REFRESH_TOKEN || '',
    updated_at: new Date().toISOString(),
  };
}

// Generate random secure token for CSRF state
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create HMAC signature for session token
export function signSessionPayload(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

// Verify HMAC session token
export function verifySessionToken(token: string): any | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(data)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string, redirectUri?: string) {
  const targetRedirectUri = redirectUri || GOOGLE_CONFIG.REDIRECT_URI;

  if (!GOOGLE_CONFIG.CLIENT_ID) {
    throw new Error('MISSING_ENV: GOOGLE_CLIENT_ID');
  }
  if (!GOOGLE_CONFIG.CLIENT_SECRET) {
    throw new Error('MISSING_ENV: GOOGLE_CLIENT_SECRET');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
      redirect_uri: targetRedirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange OAuth code');
  }

  const expiryDate = data.expires_in
    ? Date.now() + data.expires_in * 1000
    : undefined;

  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string | undefined,
    scope: data.scope as string | undefined,
    token_type: data.token_type as string | undefined,
    expiry_date: expiryDate,
  };
}

// Fetch Google User Profile
export async function fetchGoogleUserInfo(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user profile from Google');
  }

  return await res.json();
}

/**
 * Gets an active access token ONLY from the environment variable GOOGLE_REFRESH_TOKEN.
 * Never reads or writes files on disk. Refreshes in memory when needed.
 */
export async function getValidAccessToken(): Promise<string> {
  // Check in-memory cache (with 60-second buffer)
  if (memoryAccessToken && Date.now() < memoryTokenExpiry - 60 * 1000) {
    return memoryAccessToken;
  }

  if (!GOOGLE_CONFIG.CLIENT_ID) {
    console.error('[AUTH ERROR] Missing GOOGLE_CLIENT_ID in environment variables');
    throw new Error('MISSING_ENV: GOOGLE_CLIENT_ID');
  }
  if (!GOOGLE_CONFIG.CLIENT_SECRET) {
    console.error('[AUTH ERROR] Missing GOOGLE_CLIENT_SECRET in environment variables');
    throw new Error('MISSING_ENV: GOOGLE_CLIENT_SECRET');
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || GOOGLE_CONFIG.REFRESH_TOKEN;
  if (!refreshToken) {
    console.error('[AUTH ERROR] GOOGLE_REFRESH_TOKEN is not set in environment variables');
    throw new Error('DRIVE_AUTH_MISSING_REFRESH_TOKEN');
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      const errorName = data.error || 'token_refresh_failed';
      console.error('[AUTH ERROR] Google rejected refresh token:', errorName);
      throw new Error(`DRIVE_AUTH_FAILED: ${errorName}`);
    }

    memoryAccessToken = String(data.access_token);
    const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
    memoryTokenExpiry = Date.now() + expiresIn * 1000;

    return memoryAccessToken;
  } catch (err: any) {
    if (err?.message?.startsWith('DRIVE_AUTH_') || err?.message?.startsWith('MISSING_ENV:')) {
      throw err;
    }
    console.error('[AUTH ERROR] Refresh token network request error:', err?.message || err);
    throw new Error('DRIVE_AUTH_FAILED: network_error');
  }
}

// Check admin session from Next.js server components or actions
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const payload = verifySessionToken(sessionCookie.value);
  if (!payload || !payload.email) {
    return null;
  }

  const normalizedEmail = String(payload.email).toLowerCase().trim();
  const allowedEmail = GOOGLE_CONFIG.ADMIN_EMAIL.toLowerCase().trim();

  // Strict check: ONLY AMITDIED69@gmail.com
  if (normalizedEmail !== allowedEmail) {
    return null;
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || GOOGLE_CONFIG.REFRESH_TOKEN;

  return {
    isAuthenticated: true,
    email: payload.email,
    name: payload.name || 'AMITDIED',
    picture: payload.picture || '',
    hasGoogleTokens: Boolean(refreshToken || memoryAccessToken),
  };
}
