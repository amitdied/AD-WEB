import { NextResponse } from 'next/server';
import { getTabRows, SHEET_TABS, BeatRow } from '@/lib/google/sheets';
import { getValidGoogleAccessToken } from '@/lib/google/auth';
import { beats as defaultBeats } from '@/lib/data';

export const dynamic = 'force-dynamic';

function resolveMediaUrl(fileIdOrUrl: string, type: 'audio' | 'cover'): string {
  if (!fileIdOrUrl || typeof fileIdOrUrl !== 'string') {
    return type === 'cover' ? '/placeholder-cover.png' : '';
  }
  const clean = fileIdOrUrl.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
    return clean;
  }
  // Drive file ID
  if (type === 'cover') {
    return `https://lh3.googleusercontent.com/d/${clean}`;
  }
  return `/api/drive/media?fileId=${clean}`;
}

export async function GET() {
  try {
    const token = await getValidGoogleAccessToken();
    const rows = await getTabRows<BeatRow>(SHEET_TABS.BEATS, token);

    if (Array.isArray(rows) && rows.length > 0) {
      // Filter published beats
      const published = rows.filter((r) => {
        const p = String(r.is_published).toLowerCase();
        return p === 'true' || p === '1' || p === 'yes';
      });

      if (published.length > 0) {
        const formattedBeats = published.map((r) => {
          const tags = typeof r.tags === 'string' && r.tags
            ? r.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : typeof r.mood === 'string' && r.mood
            ? r.mood.split(',').map((t) => t.trim()).filter(Boolean)
            : ['Dark', 'Exclusive'];

          return {
            id: String(r.id),
            title: String(r.title || 'Untitled Beat'),
            slug: r.slug || String(r.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            bpm: Number(r.bpm) || 120,
            genre: String(r.genre || 'Trap'),
            moodTags: tags,
            price: Number(r.price) || 29.99,
            currency: r.currency || 'USD',
            description: r.description || '',
            coverUrl: resolveMediaUrl(r.cover_file_id || '', 'cover'),
            audioUrl: resolveMediaUrl(r.audio_file_id || '', 'audio'),
            isFeatured: String(r.is_featured).toLowerCase() === 'true' || String(r.is_featured) === '1',
          };
        });

        return NextResponse.json(formattedBeats);
      }
    }
  } catch (error) {
    console.warn('Google Sheets beats read notice (using fallback):', error);
  }

  return NextResponse.json(defaultBeats);
}
