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

    if (bucket !== 'audio' && bucket !== 'covers') {
      return NextResponse.json(
        { error: 'Invalid bucket. Only audio and covers are allowed.' },
        { status: 400 }
      );
    }

    // Sanitize path against directory traversal
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

    // For audio files, generating a signed URL allows standard byte-range requests and audio player seeking
    if (bucket === 'audio') {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(decodedPath, 3600);

      if (!signedError && signedData?.signedUrl) {
        return NextResponse.redirect(signedData.signedUrl, { status: 307 });
      }
    }

    // Direct download/streaming from Supabase Storage (standard for images and audio fallback)
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
        : lowerPath.endsWith('.png')
          ? 'image/png'
          : lowerPath.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
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
