import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, getValidGoogleAccessToken } from '@/lib/google/auth';
import {
  getTabRows,
  appendTabRow,
  updateTabRow,
  deleteTabRow,
  SHEET_TABS,
  PortfolioRow,
} from '@/lib/google/sheets';
import { YOUTUBE_LINKS } from '@/lib/data';

export const dynamic = 'force-dynamic';

import { extractYouTubeId } from '@/lib/youtube';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getValidGoogleAccessToken();
  try {
    const rows = await getTabRows<PortfolioRow>(SHEET_TABS.PORTFOLIO, token);
    if (rows && rows.length > 0) {
      // Sort by sort_order
      rows.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      return NextResponse.json(rows);
    }
  } catch (err) {
    console.error('Error reading portfolio for admin:', err);
  }

  // Fallback to default YOUTUBE_LINKS
  const fallbackRows: PortfolioRow[] = YOUTUBE_LINKS.map((url, idx) => {
    const ytId = extractYouTubeId(url);
    return {
      id: `yt-${ytId || idx}`,
      title: `ARCHIVE_${String(idx + 1).padStart(2, '0')}`,
      youtube_url: url,
      youtube_id: ytId,
      thumbnail_url: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '',
      description: 'Official YouTube Visual & Audio Archive',
      category: 'Production',
      sort_order: idx + 1,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  return NextResponse.json(fallbackRows);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getValidGoogleAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: 'Google authentication required to write to Google Sheets.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const url = body.youtube_url || '';
    const youtubeId = body.youtube_id || extractYouTubeId(url);
    const id = body.id || `yt-${youtubeId || Date.now()}`;
    const thumbnailUrl =
      body.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '');

    const newVideo: PortfolioRow = {
      id,
      title: body.title || 'Untitled Video',
      youtube_url: url,
      youtube_id: youtubeId,
      thumbnail_url: thumbnailUrl,
      description: body.description || '',
      category: body.category || 'Production',
      sort_order: Number(body.sort_order) || 1,
      is_published: body.is_published !== undefined ? body.is_published : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await appendTabRow(SHEET_TABS.PORTFOLIO, newVideo, token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error adding portfolio video:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add video to Google Sheet' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getValidGoogleAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: 'Google authentication required to update Google Sheets.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    if (body.youtube_url && !body.youtube_id) {
      body.youtube_id = extractYouTubeId(body.youtube_url);
    }
    if (body.youtube_id && !body.thumbnail_url) {
      body.thumbnail_url = `https://img.youtube.com/vi/${body.youtube_id}/hqdefault.jpg`;
    }

    const result = await updateTabRow(SHEET_TABS.PORTFOLIO, body.id, body, token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error updating video:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update video in Google Sheet' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getValidGoogleAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: 'Google authentication required to delete from Google Sheets.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    const success = await deleteTabRow(SHEET_TABS.PORTFOLIO, id, token);
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error('Error deleting video:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete video from Google Sheet' },
      { status: 500 }
    );
  }
}
