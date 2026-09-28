import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { YOUTUBE_LINKS } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.videos) && parsed.videos.length > 0) {
        return NextResponse.json(parsed.videos, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error reading videos DB:', error);
  }

  return NextResponse.json(YOUTUBE_LINKS, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
