import fs from 'fs';
import path from 'path';
import { GOOGLE_CONFIG } from './config';
import { getValidAccessToken } from './auth';

export type DriveFolderType = 'audio' | 'covers' | 'media';

export interface DriveUploadResult {
  fileId?: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  isDrive: boolean;
  folderId?: string;
}

export function getFolderIdForType(folderType: DriveFolderType): string {
  switch (folderType) {
    case 'audio':
      return GOOGLE_CONFIG.DRIVE_AUDIO_FOLDER_ID;
    case 'covers':
      return GOOGLE_CONFIG.DRIVE_COVERS_FOLDER_ID;
    case 'media':
      return GOOGLE_CONFIG.DRIVE_MEDIA_FOLDER_ID;
    default:
      return GOOGLE_CONFIG.DRIVE_MEDIA_FOLDER_ID;
  }
}

/**
 * Upload a file directly to the appropriate Google Drive folder.
 * Falls back to local storage if Google OAuth is not yet authenticated.
 */
export async function uploadToGoogleDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderType: DriveFolderType
): Promise<DriveUploadResult> {
  const folderId = getFolderIdForType(folderType);
  const accessToken = await getValidAccessToken();

  // If no Google access token is available, save to local uploads directory as fallback
  if (!accessToken) {
    console.warn(`[DRIVE] No Google access token available. Saving ${fileName} locally.`);
    return saveLocally(buffer, fileName, mimeType, folderType);
  }

  try {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const metadataHeader =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n`;

    const multipartBody = Buffer.concat([
      Buffer.from(metadataHeader, 'utf8'),
      buffer,
      Buffer.from(closeDelimiter, 'utf8'),
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webContentLink,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartBody.length.toString(),
        },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('[DRIVE] Upload failed with status', uploadRes.status, errText);
      throw new Error(`Google Drive upload failed: ${uploadRes.statusText}`);
    }

    const fileData = await uploadRes.json();
    const fileId = fileData.id;

    // Grant read permission to anyone with link so audio and images can be streamed/displayed
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (permErr) {
      console.warn('[DRIVE] Could not set public permission on file', fileId, permErr);
    }

    // Streamable URL: routed via our streaming proxy `/api/drive/media?id=fileId`
    // which handles range requests (essential for HTML5 <audio> scrubber)
    const streamUrl = `/api/drive/media?id=${fileId}`;

    return {
      fileId,
      url: streamUrl,
      name: fileData.name || fileName,
      size: Number(fileData.size) || buffer.length,
      mimeType: fileData.mimeType || mimeType,
      isDrive: true,
      folderId,
    };
  } catch (error: any) {
    console.error('[DRIVE] Error uploading to Google Drive:', error);
    console.warn('[DRIVE] Falling back to local storage for:', fileName);
    return saveLocally(buffer, fileName, mimeType, folderType);
  }
}

function saveLocally(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderType: DriveFolderType
): DriveUploadResult {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const uniqueName = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadDir, uniqueName);

  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${uniqueName}`,
    name: uniqueName,
    size: buffer.length,
    mimeType,
    isDrive: false,
    folderId: getFolderIdForType(folderType),
  };
}
