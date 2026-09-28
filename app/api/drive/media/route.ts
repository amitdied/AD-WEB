import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/google/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file id parameter' }, { status: 400 });
  }

  try {
    const accessToken = await getValidAccessToken();
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const driveRes = await fetch(driveUrl, { headers });

    if (!driveRes.ok) {
      console.warn(`[DRIVE MEDIA] Drive responded with ${driveRes.status} for file ${fileId}`);
      // If unauthorized or not found, try redirecting to Google thumbnail/direct URL as fallback
      if (driveRes.status === 404 || driveRes.status === 403) {
        return NextResponse.redirect(`https://lh3.googleusercontent.com/d/${fileId}`);
      }
      return NextResponse.json({ error: 'Failed to fetch media from Drive' }, { status: driveRes.status });
    }

    const contentType = driveRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = driveRes.headers.get('content-length');
    const contentRange = driveRes.headers.get('content-range');
    const status = driveRes.status; // might be 200 or 206 Partial Content

    const resHeaders = new Headers();
    resHeaders.set('Content-Type', contentType);
    resHeaders.set('Accept-Ranges', 'bytes');
    resHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    if (contentLength) resHeaders.set('Content-Length', contentLength);
    if (contentRange) resHeaders.set('Content-Range', contentRange);

    return new NextResponse(driveRes.body, {
      status,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error('[DRIVE MEDIA] Error streaming file:', error);
    return NextResponse.json({ error: 'Internal streaming error' }, { status: 500 });
  }
}
