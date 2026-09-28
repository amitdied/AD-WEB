import { NextResponse } from 'next/server';
import { getTabRows, SHEET_TABS, PortfolioRow } from '@/lib/google/sheets';
import { getValidGoogleAccessToken } from '@/lib/google/auth';
import { YOUTUBE_LINKS } from '@/lib/data';

export const dynamic = 'force-dynamic';

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match) return match[1];
  const vParam = url.split('v=')[1]?.split('&')[0];
  if (vParam && vParam.length === 11) return vParam;
  return url.trim();
}

export async function GET() {
  try {
    const token = await getValidGoogleAccessToken();
    const rows = await getTabRows<PortfolioRow>(SHEET_TABS.PORTFOLIO, token);

    if (Array.isArray(rows) && rows.length > 0) {
      const published = rows.filter((r) => {
        const p = String(r.is_published).toLowerCase();
        return p === 'true' || p === '1' || p === 'yes';
      });

      if (published.length > 0) {
        // Sort by sort_order
        published.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

        const formattedVideos = published.map((r, idx) => {
          const ytId = r.youtube_id || extractYouTubeId(r.youtube_url || '');
          const thumb =
            r.thumbnail_url ||
            (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');

          return {
            id: String(r.id || `yt-${ytId || idx}`),
            videoId: ytId,
            url: r.youtube_url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : ''),
            title: r.title || `ARCHIVE_0${idx + 1}`,
            thumbnail: thumb,
            author: 'AMITDIED',
            description: r.description || '',
            category: r.category || 'Production',
            isCorrupted: false,
          };
        });

        return NextResponse.json(formattedVideos);
      }
    }
  } catch (error) {
    console.warn('Google Sheets portfolio read notice (using fallback):', error);
  }

  return NextResponse.json(YOUTUBE_LINKS);
}
