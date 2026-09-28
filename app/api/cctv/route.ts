import { NextResponse } from 'next/server';
import { getTabRows, SHEET_TABS, CCTVRow } from '@/lib/google/sheets';
import { getValidGoogleAccessToken } from '@/lib/google/auth';
import { AMITDIED_INSTAGRAM_POSTS } from '@/components/InstagramTeaser';

export const dynamic = 'force-dynamic';

function resolveMediaUrl(fileIdOrUrl: string): string {
  if (!fileIdOrUrl || typeof fileIdOrUrl !== 'string') return '';
  const clean = fileIdOrUrl.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
    return clean;
  }
  return `/api/drive/media?fileId=${clean}`;
}

export async function GET() {
  try {
    const token = await getValidGoogleAccessToken();
    const rows = await getTabRows<CCTVRow>(SHEET_TABS.CCTV, token);

    if (Array.isArray(rows) && rows.length > 0) {
      const published = rows.filter((r) => {
        const p = String(r.is_published).toLowerCase();
        return p === 'true' || p === '1' || p === 'yes';
      });

      if (published.length > 0) {
        published.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

        const formattedItems = published.map((r, idx) => {
          const mediaType = r.media_type || 'youtube';
          const youtubeUrl = r.youtube_url || '';

          return {
            id: String(r.id || `cctv-${idx}`),
            title: r.title || `TRANSMISSION_0${idx + 1}`,
            description: r.description || '',
            mediaType,
            youtubeUrl,
            driveVideoUrl: r.drive_file_id ? resolveMediaUrl(r.drive_file_id) : '',
            thumbnailUrl: r.thumbnail_file_id
              ? resolveMediaUrl(r.thumbnail_file_id)
              : '',
            category: r.category || 'BTS',
            sortOrder: Number(r.sort_order) || idx + 1,
            label: `CAM_${String(idx + 1).padStart(2, '0')}`,
            location: r.category ? `${r.category.toUpperCase()}_NET` : 'STUDIO_NODE',
            status: 'SIGNAL_ACTIVE',
            date: 'LIVE FEED',
          };
        });

        return NextResponse.json(formattedItems);
      }
    }
  } catch (error) {
    console.warn('Google Sheets CCTV read notice (using fallback):', error);
  }

  return NextResponse.json(AMITDIED_INSTAGRAM_POSTS);
}
