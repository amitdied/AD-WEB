import { NextResponse } from 'next/server';
import { getCustomBeats } from '@/app/admin/data-actions';
import { beats as defaultBeats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await getCustomBeats();
    if (Array.isArray(list) && list.length > 0) {
      return NextResponse.json(list, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }
  } catch (error) {
    console.warn('Error reading beats, using defaults:', error);
  }

  return NextResponse.json(defaultBeats, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
