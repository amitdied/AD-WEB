import { NextResponse } from 'next/server';
import { getCustomTransmissions } from '@/app/admin/data-actions';
import { INSTAGRAM_TRANSMISSIONS } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await getCustomTransmissions();
    if (Array.isArray(list) && list.length > 0) {
      return NextResponse.json(list);
    }
  } catch (error) {
    console.error('Error reading Instagram transmissions:', error);
  }

  return NextResponse.json(INSTAGRAM_TRANSMISSIONS);
}
