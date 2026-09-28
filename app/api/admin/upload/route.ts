import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, getValidGoogleAccessToken } from '@/lib/google/auth';
import {
  uploadToDriveResumable,
  uploadToDriveSimple,
  getFolderIdForType,
} from '@/lib/google/drive';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getValidGoogleAccessToken();
  if (!token) {
    return NextResponse.json(
      {
        error:
          'Google OAuth access token missing. Please sign in with your authorized admin Google account to upload files to Google Drive.',
      },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderType = (formData.get('folderType') as string) || 'audio'; // 'audio' | 'covers' | 'cctv'
    const customFolderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const targetFolderId = customFolderId || getFolderIdForType(folderType);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

    let uploadResult;
    // Resumable upload for audio/video or files over 4MB
    if (
      buffer.length > 4 * 1024 * 1024 ||
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('video/')
    ) {
      uploadResult = await uploadToDriveResumable(
        buffer,
        fileName,
        mimeType,
        targetFolderId,
        token
      );
    } else {
      uploadResult = await uploadToDriveSimple(
        buffer,
        fileName,
        mimeType,
        targetFolderId,
        token
      );
    }

    return NextResponse.json(uploadResult);
  } catch (err: any) {
    console.error('File upload to Drive error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload file to Google Drive' },
      { status: 500 }
    );
  }
}
