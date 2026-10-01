import { NextResponse } from 'next/server';
import { getCustomVideos } from '@/app/admin/data-actions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const videos = await getCustomVideos(false); // Only visible videos
    if (Array.isArray(videos) && videos.length > 0) {
      return NextResponse.json(videos, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching public portfolio videos:', error);
  }

  return NextResponse.json([], {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
