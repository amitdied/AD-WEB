import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { signSessionPayload, SESSION_COOKIE_NAME, getSessionSecret } from '@/lib/google/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    // Verify SESSION_SECRET is configured
    try {
      getSessionSecret();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: SESSION_SECRET is missing.' },
        { status: 500 }
      );
    }

    // Verify ADMIN_PASSWORD_HASH is configured
    const adminHashEnv = process.env.ADMIN_PASSWORD_HASH;
    if (!adminHashEnv || !adminHashEnv.trim()) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: ADMIN_PASSWORD_HASH is missing.' },
        { status: 500 }
      );
    }

    const cleanHash = adminHashEnv.trim();
    let isValid = false;

    if (cleanHash.startsWith('$2')) {
      isValid = await bcrypt.compare(password, cleanHash);
    } else {
      // Fallback comparison if not bcrypt
      isValid = password === cleanHash;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid admin password' }, { status: 401 });
    }

    const sessionPayload = {
      authenticated: true,
      email: 'admin@amitdied.com',
      name: 'AMITDIED',
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const token = signSessionPayload(sessionPayload);
    const cookieStore = await cookies();

    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN LOGIN ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
