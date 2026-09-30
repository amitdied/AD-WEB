import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'admin_session';

export interface AdminSession {
  isAuthenticated: boolean;
  name: string;
  email?: string;
  authenticatedAt: number;
}

const DEFAULT_SESSION_SECRET = 'amitdied-secure-default-session-secret-2026';

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
}

/**
 * Server-side password verification against ADMIN_PASSWORD_HASH using bcrypt.
 * Never stores or exposes plaintext password.
 */
export async function verifyAdminPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  if (!password || typeof password !== 'string') {
    return { ok: false, error: 'Password is required' };
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!passwordHash) {
    console.error('[AUTH ERROR] ADMIN_PASSWORD_HASH is not defined in environment variables');
    return {
      ok: false,
      error: 'SERVER_MISCONFIGURED: ADMIN_PASSWORD_HASH environment variable is not configured.',
    };
  }

  try {
    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return { ok: false, error: 'INCORRECT_PASSWORD' };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('[AUTH ERROR] Error verifying password with bcrypt:', err?.message || err);
    return { ok: false, error: 'VERIFICATION_FAILED' };
  }
}

/**
 * Signs a session payload using HMAC-SHA256 with SESSION_SECRET.
 */
export function signSessionPayload(payload: object): string {
  const secret = getSessionSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verifies HMAC-SHA256 session token with timing-safe comparison and checks expiration.
 */
export function verifySessionToken(token: string): any | null {
  try {
    const secret = getSessionSecret();
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', secret)
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

/**
 * Creates and attaches an HTTP-only secure session cookie on successful authentication.
 */
export async function createAdminSession(): Promise<string> {
  const sessionToken = signSessionPayload({
    role: 'admin',
    authenticated: true,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return sessionToken;
}

/**
 * Destroys the admin session cookie on logout.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validates the admin session from server components, actions, or route handlers.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const payload = verifySessionToken(sessionCookie.value);
    if (!payload || !payload.authenticated) {
      return null;
    }

    return {
      isAuthenticated: true,
      name: 'AMITDIED',
      authenticatedAt: payload.iat || Date.now(),
    };
  } catch (error) {
    console.error('[AUTH ERROR] Exception verifying session:', error);
    return null;
  }
}
