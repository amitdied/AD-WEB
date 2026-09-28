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
 * Uses access token refreshed in memory from GOOGLE_REFRESH_TOKEN.
 * Never writes or reads files on disk.
 */
export async function uploadToGoogleDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderType: DriveFolderType
): Promise<DriveUploadResult> {
  const folderId = getFolderIdForType(folderType);
  if (!folderId) {
    console.error(`[DRIVE ERROR] Missing folder ID for ${folderType}`);
    throw new Error(`MISSING_ENV: GOOGLE_DRIVE_${folderType.toUpperCase()}_FOLDER_ID`);
  }

  // Obtain access token from memory / GOOGLE_REFRESH_TOKEN (throws clean safe error if missing/rejected)
  const accessToken = await getValidAccessToken();

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
      console.error('[DRIVE ERROR] Google Drive upload failed:', uploadRes.status, errText);
      throw new Error(`DRIVE_UPLOAD_FAILED: status_${uploadRes.status}`);
    }

    const fileData = await uploadRes.json();
    const fileId = fileData.id;

    // Grant public read permission so asset can be streamed via /api/drive/media
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
    } catch (permErr: any) {
      console.warn('[DRIVE] Could not set public permission on file', fileId);
    }

    // Streamable proxy URL
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
    if (error?.message?.startsWith('DRIVE_') || error?.message?.startsWith('MISSING_ENV:')) {
      throw error;
    }
    console.error('[DRIVE ERROR] Error uploading to Google Drive:', error?.message || error);
    throw new Error('DRIVE_UPLOAD_FAILED: network_error');
  }
}
