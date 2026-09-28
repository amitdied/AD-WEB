import { NextResponse } from 'next/server';
import { getCustomVideos } from '@/app/admin/data-actions';
import { YOUTUBE_LINKS } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const videosList = await getCustomVideos();
    if (Array.isArray(videosList) && videosList.length > 0) {
      return NextResponse.json(videosList);
    }
  } catch (error) {
    console.error('Error in /api/videos:', error);
  }

  return NextResponse.json(YOUTUBE_LINKS);
}
