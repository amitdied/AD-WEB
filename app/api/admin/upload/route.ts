import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/google/auth';
import fs from 'fs';
import path from 'path';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin session security
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED: Admin session required to upload files' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderType = (formData.get('folderType') as string) || 'covers';

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FILE: No file provided' },
        { status: 400 }
      );
    }

    // Limit check (e.g. 100MB for audio/stems)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = Math.round(file.size / (1024 * 1024));
      return NextResponse.json(
        { ok: false, error: `FILE_TOO_LARGE: ${sizeMb}MB exceeds maximum limit of 100MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `beats/${folderType}/${Date.now()}_${cleanFileName}`;

    // 2. Try Firebase Storage first
    try {
      if (storage) {
        const fileRef = ref(storage, storagePath);
        const metadata = {
          contentType: file.type || (folderType === 'audio' ? 'audio/mpeg' : 'image/jpeg'),
        };
        const uploadResult = await uploadBytes(fileRef, buffer, metadata);
        const downloadUrl = await getDownloadURL(uploadResult.ref);

        if (downloadUrl) {
          return NextResponse.json({
            ok: true,
            url: downloadUrl,
            storageType: 'firebase_storage',
            name: file.name,
            size: file.size,
          });
        }
      }
    } catch (storageErr: any) {
      console.warn(
        '[FIREBASE STORAGE] Bucket upload unavailable (' +
          (storageErr?.message || storageErr?.code || '404') +
          '), falling back to secure server storage'
      );
    }

    // 3. Secure local storage fallback (so uploads never fail or freeze)
    const subFolder = folderType === 'audio' ? 'audio' : 'covers';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const localFileName = `${Date.now()}-${cleanFileName}`;
    const filePath = path.join(uploadDir, localFileName);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${subFolder}/${localFileName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      storageType: 'server_uploads',
      name: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error('[ADMIN UPLOAD ERROR]', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Upload processing error' },
      { status: 500 }
    );
  }
}
