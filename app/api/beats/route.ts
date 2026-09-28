import { NextResponse } from 'next/server';
import { getCustomBeats } from '@/app/admin/data-actions';
import { beats as defaultBeats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const beatsList = await getCustomBeats();
    if (Array.isArray(beatsList) && beatsList.length > 0) {
      return NextResponse.json(beatsList);
    }
  } catch (error) {
    console.error('Error in /api/beats:', error);
  }

  return NextResponse.json(defaultBeats);
}
