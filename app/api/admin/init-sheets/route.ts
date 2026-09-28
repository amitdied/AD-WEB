import { NextResponse } from 'next/server';
import { getAdminSession, getValidGoogleAccessToken } from '@/lib/google/auth';
import { initializeSheetTabs } from '@/lib/google/sheets';
import { getGoogleConfig } from '@/lib/google/config';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getGoogleConfig();
  if (!config.GOOGLE_SHEET_ID) {
    return NextResponse.json(
      { error: 'GOOGLE_SHEET_ID is missing from environment variables.' },
      { status: 400 }
    );
  }

  const token = await getValidGoogleAccessToken();
  if (!token) {
    return NextResponse.json(
      {
        error:
          'Valid Google OAuth token not available. Please sign in with your admin Google account first.',
      },
      { status: 403 }
    );
  }

  try {
    const result = await initializeSheetTabs(token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Failed to initialize sheet tabs:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize sheet tabs' },
      { status: 500 }
    );
  }
}
