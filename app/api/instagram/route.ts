import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INSTAGRAM_TRANSMISSIONS } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.instagramTransmissions) && parsed.instagramTransmissions.length > 0) {
        return NextResponse.json(parsed.instagramTransmissions);
      }
    }
  } catch (error) {
    console.error('Error reading Instagram transmissions from DB:', error);
  }

  return NextResponse.json(INSTAGRAM_TRANSMISSIONS);
}
