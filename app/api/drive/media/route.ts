import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleAccessToken } from '@/lib/google/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
  }

  try {
    const token = await getValidGoogleAccessToken();
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const requestHeaders: Record<string, string> = {};
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      requestHeaders['Range'] = rangeHeader;
    }

    const driveRes = await fetch(driveUrl, {
      headers: requestHeaders,
    });

    if (!driveRes.ok) {
      // Fallback: If not authorized or direct failed, redirect to Googleusercontent direct view
      return NextResponse.redirect(`https://lh3.googleusercontent.com/d/${fileId}`);
    }

    const responseHeaders = new Headers();
    const contentType = driveRes.headers.get('content-type') || 'application/octet-stream';
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    responseHeaders.set('Accept-Ranges', 'bytes');

    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentRange = driveRes.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    return new Response(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Error streaming Drive media:', err);
    return NextResponse.redirect(`https://lh3.googleusercontent.com/d/${fileId}`);
  }
}
