import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { GOOGLE_CONFIG } from './config';

const TOKENS_PATH = path.join(process.cwd(), 'data', 'google-tokens.json');
const SESSION_SECRET = process.env.SESSION_SECRET || GOOGLE_CONFIG.CLIENT_SECRET || 'amitdied-secure-oauth-secret-key';
export const SESSION_COOKIE_NAME = 'admin_session';
export const STATE_COOKIE_NAME = 'google_oauth_state';

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

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(TOKENS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read tokens from disk
export function getStoredTokens(): StoredTokens | null {
  try {
    if (!fs.existsSync(TOKENS_PATH)) return null;
    const content = fs.readFileSync(TOKENS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading stored Google tokens:', e);
    return null;
  }
}

// Save tokens to disk
export function saveStoredTokens(newTokens: Partial<StoredTokens>): StoredTokens {
  ensureDataDir();
  const existing = getStoredTokens() || { access_token: '' };
  const merged: StoredTokens = {
    ...existing,
    ...newTokens,
    // Keep existing refresh_token if Google did not return a new one on this exchange
    refresh_token: newTokens.refresh_token || existing.refresh_token,
    updated_at: new Date().toISOString(),
  };

  fs.writeFileSync(TOKENS_PATH, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
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
    // Check expiry (e.g. 7 days)
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

  // Calculate expiry date
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

// Refresh access token if expired or close to expiry (within 2 minutes)
export async function getValidAccessToken(): Promise<string | null> {
  const stored = getStoredTokens();
  if (!stored || !stored.access_token) {
    return null;
  }

  // If not close to expiry, return existing token
  const twoMinutes = 2 * 60 * 1000;
  if (stored.expiry_date && stored.expiry_date - Date.now() > twoMinutes) {
    return stored.access_token;
  }

  // If expired or about to expire and we have a refresh_token, refresh it
  if (stored.refresh_token) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
          refresh_token: stored.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const data = await res.json();
      if (res.ok && data.access_token) {
        const updated = saveStoredTokens({
          access_token: data.access_token,
          expiry_date: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
          scope: data.scope || stored.scope,
        });
        return updated.access_token;
      } else {
        console.error('Failed to refresh token:', data);
      }
    } catch (e) {
      console.error('Error refreshing Google access token:', e);
    }
  }

  return stored.access_token;
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

  const tokens = getStoredTokens();

  return {
    isAuthenticated: true,
    email: payload.email,
    name: payload.name || 'AMITDIED',
    picture: payload.picture || '',
    hasGoogleTokens: Boolean(tokens?.access_token),
  };
}
