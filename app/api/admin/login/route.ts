import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { signSessionPayload, SESSION_COOKIE_NAME } from '@/lib/google/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    let isValid = false;
    const adminHashEnv = process.env.ADMIN_PASSWORD_HASH;

    if (adminHashEnv) {
      if (adminHashEnv.startsWith('$2')) {
        isValid = await bcrypt.compare(password, adminHashEnv);
      } else {
        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        isValid = inputHash === adminHashEnv || password === adminHashEnv || password === process.env.ADMIN_PASSWORD;
      }
    } else {
      const inputHash = crypto.createHash('sha256').update(password).digest('hex');
      const defaultHash = crypto.createHash('sha256').update('amitdied123').digest('hex');
      isValid = inputHash === defaultHash || password === 'amitdied123';
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid admin password' }, { status: 401 });
    }

    const sessionPayload = {
      email: 'admin@amitdied.com',
      name: 'AMITDIED',
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

