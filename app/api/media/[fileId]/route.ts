import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  if (!fileId) {
    return NextResponse.json({ error: 'Missing file id' }, { status: 400 });
  }

  // Redirect to /api/drive/media?id=fileId
  const url = new URL('/api/drive/media', req.url);
  url.searchParams.set('id', fileId);
  return NextResponse.rewrite(url);
}
