import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, getValidGoogleAccessToken } from '@/lib/google/auth';
import {
  getTabRows,
  appendTabRow,
  updateTabRow,
  deleteTabRow,
  SHEET_TABS,
  CCTVRow,
} from '@/lib/google/sheets';
import { AMITDIED_INSTAGRAM_POSTS } from '@/components/InstagramTeaser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getValidGoogleAccessToken();
  try {
    const rows = await getTabRows<CCTVRow>(SHEET_TABS.CCTV, token);
    if (rows && rows.length > 0) {
      rows.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      return NextResponse.json(rows);
    }
  } catch (err) {
    console.error('Error reading CCTV for admin:', err);
  }

  // Fallback to default posts
  const fallbackRows: CCTVRow[] = AMITDIED_INSTAGRAM_POSTS.map((p, idx) => ({
    id: p.id,
    title: p.captionTitle,
    description: p.snippet,
    media_type: 'youtube',
    youtube_url: p.url,
    category: p.location || 'STUDIO',
    sort_order: idx + 1,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

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
    const id = body.id || `cctv-${Date.now()}`;

    const newItem: CCTVRow = {
      id,
      title: body.title || 'CCTV Surveillance Capture',
      description: body.description || '',
      media_type: body.media_type || 'youtube',
      youtube_url: body.youtube_url || '',
      drive_file_id: body.drive_file_id || '',
      thumbnail_file_id: body.thumbnail_file_id || '',
      category: body.category || 'BTS',
      sort_order: Number(body.sort_order) || 1,
      is_published: body.is_published !== undefined ? body.is_published : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await appendTabRow(SHEET_TABS.CCTV, newItem, token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error adding CCTV item:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add CCTV item to Google Sheet' },
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
      return NextResponse.json({ error: 'CCTV item ID is required' }, { status: 400 });
    }

    const result = await updateTabRow(SHEET_TABS.CCTV, body.id, body, token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error updating CCTV item:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update CCTV item in Google Sheet' },
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
    return NextResponse.json({ error: 'CCTV ID is required' }, { status: 400 });
  }

  try {
    const success = await deleteTabRow(SHEET_TABS.CCTV, id, token);
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error('Error deleting CCTV item:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete CCTV item from Google Sheet' },
      { status: 500 }
    );
  }
}
