import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters: bucket and path' },
        { status: 400 }
      );
    }

    if (bucket !== 'audio' && bucket !== 'covers' && bucket !== 'cctv') {
      return NextResponse.json(
        { error: 'Invalid bucket. Only audio, covers, and cctv are allowed.' },
        { status: 400 }
      );
    }

    const decodedPath = decodeURIComponent(path).replace(/^\/+/, '');
    if (decodedPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not initialized or configuration missing' },
        { status: 500 }
      );
    }

    if (bucket === 'audio' || bucket === 'cctv') {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(decodedPath, 3600);

      if (!signedError && signedData?.signedUrl) {
        return NextResponse.redirect(signedData.signedUrl, { status: 307 });
      }
    }

    const { data: blobData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(decodedPath);

    if (downloadError || !blobData) {
      console.error('[SUPABASE MEDIA ERROR]', downloadError?.message || 'File not found');
      return NextResponse.json(
        { error: downloadError?.message || 'Media file not found' },
        { status: 404 }
      );
    }

    const lowerPath = decodedPath.toLowerCase();
    const contentType =
      blobData.type ||
      (bucket === 'audio'
        ? lowerPath.endsWith('.wav')
          ? 'audio/wav'
          : 'audio/mpeg'
        : bucket === 'cctv'
          ? lowerPath.endsWith('.webm')
            ? 'video/webm'
            : lowerPath.endsWith('.mov')
              ? 'video/quicktime'
              : 'video/mp4'
        : lowerPath.endsWith('.png')
          ? 'image/png'
          : lowerPath.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg');

    const totalSize = blobData.size;
    const rangeHeader = req.headers.get('range');

    if (rangeHeader && totalSize > 0) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
        const safeEnd = Math.min(end, totalSize - 1);
        const chunk = blobData.slice(start, safeEnd + 1);

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Range', `bytes ${start}-${safeEnd}/${totalSize}`);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Content-Length', String(chunk.size));
        headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

        return new NextResponse(chunk, {
          status: 206,
          headers,
        });
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', String(totalSize));
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    return new NextResponse(blobData, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[SUPABASE MEDIA ROUTE ERROR]', error);
    return NextResponse.json(
      { error: error?.message || 'Internal media serving error' },
      { status: 500 }
    );
  }
}
