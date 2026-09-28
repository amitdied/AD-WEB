import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, getValidGoogleAccessToken } from '@/lib/google/auth';
import {
  getTabRows,
  appendTabRow,
  updateTabRow,
  deleteTabRow,
  SHEET_TABS,
  BeatRow,
} from '@/lib/google/sheets';
import { beats as defaultBeats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getValidGoogleAccessToken();
  try {
    const rows = await getTabRows<BeatRow>(SHEET_TABS.BEATS, token);
    if (rows && rows.length > 0) {
      return NextResponse.json(rows);
    }
  } catch (err) {
    console.error('Error reading beats for admin:', err);
  }

  // Fallback to default beats formatted as BeatRow
  const fallbackRows: BeatRow[] = defaultBeats.map((b: any) => ({
    id: b.id,
    title: b.title,
    slug: b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    bpm: b.bpm || 120,
    genre: b.genre || 'Trap',
    mood: Array.isArray(b.moodTags) ? b.moodTags.join(', ') : '',
    price: b.price || 29.99,
    currency: 'USD',
    description: b.description || '',
    tags: Array.isArray(b.moodTags) ? b.moodTags.join(', ') : '',
    audio_file_id: b.audioUrl || '',
    cover_file_id: b.coverUrl || '',
    is_published: true,
    is_featured: false,
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
    const id = body.id || `beat-${Date.now()}`;
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newBeat: BeatRow = {
      id,
      title: body.title || 'Untitled Beat',
      slug,
      bpm: Number(body.bpm) || 120,
      genre: body.genre || 'Trap',
      mood: body.mood || '',
      price: Number(body.price) || 29.99,
      currency: body.currency || 'USD',
      description: body.description || '',
      tags: body.tags || '',
      audio_file_id: body.audio_file_id || '',
      cover_file_id: body.cover_file_id || '',
      is_published: body.is_published !== undefined ? body.is_published : true,
      is_featured: body.is_featured !== undefined ? body.is_featured : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await appendTabRow(SHEET_TABS.BEATS, newBeat, token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error adding beat:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add beat to Google Sheet' },
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
      return NextResponse.json({ error: 'Beat ID is required' }, { status: 400 });
    }

    const result = await updateTabRow(SHEET_TABS.BEATS, body.id, body, token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error updating beat:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update beat in Google Sheet' },
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
    return NextResponse.json({ error: 'Beat ID is required' }, { status: 400 });
  }

  try {
    const success = await deleteTabRow(SHEET_TABS.BEATS, id, token);
    return NextResponse.json({ success });
  } catch (err: any) {
    console.error('Error deleting beat:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete beat from Google Sheet' },
      { status: 500 }
    );
  }
}
