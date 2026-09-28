import { getGoogleConfig } from './config';

export interface DriveUploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  directMediaUrl: string;
}

/**
 * Sets public read permission on a Drive file so it can be streamed/viewed
 */
export async function makeFilePublic(fileId: string, token: string): Promise<void> {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (err) {
    console.warn(`Failed to set public permission on file ${fileId}:`, err);
  }
}

/**
 * Uploads a file to Google Drive using Resumable Upload (ideal for audio MP3/WAV and videos)
 */
export async function uploadToDriveResumable(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string,
  token: string
): Promise<DriveUploadResult> {
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    mimeType: mimeType || 'application/octet-stream',
  };

  // 1. Initiate Resumable Upload Session
  const initRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType || 'application/octet-stream',
        'X-Upload-Content-Length': buffer.length.toString(),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const errorText = await initRes.text();
    throw new Error(`Failed to initiate resumable upload: ${initRes.status} - ${errorText}`);
  }

  const uploadLocation = initRes.headers.get('Location');
  if (!uploadLocation) {
    throw new Error('Google Drive did not return a resumable upload location URL.');
  }

  // 2. Upload file binary data
  const uploadRes = await fetch(uploadLocation, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Length': buffer.length.toString(),
    },
    body: new Uint8Array(buffer),
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Drive file upload failed: ${uploadRes.status} - ${errorText}`);
  }

  const result = await uploadRes.json();
  const fileId = result.id;

  // Make file publicly readable
  await makeFilePublic(fileId, token);

  return {
    fileId,
    name: result.name,
    mimeType: result.mimeType,
    webViewLink: result.webViewLink,
    webContentLink: result.webContentLink,
    directMediaUrl: `/api/drive/media?fileId=${fileId}`,
  };
}

/**
 * Standard upload for smaller assets like cover images
 */
export async function uploadToDriveSimple(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string,
  token: string
): Promise<DriveUploadResult> {
  // If file is larger than 4MB, use resumable upload
  if (buffer.length > 4 * 1024 * 1024) {
    return uploadToDriveResumable(buffer, fileName, mimeType, folderId, token);
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    mimeType: mimeType || 'application/octet-stream',
  };

  const multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`
    ),
    buffer,
    Buffer.from(closeDelimiter),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': multipartBody.length.toString(),
      },
      body: new Uint8Array(multipartBody),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload file to Drive: ${res.status} - ${errorText}`);
  }

  const result = await res.json();
  const fileId = result.id;

  // Make file publicly readable
  await makeFilePublic(fileId, token);

  return {
    fileId,
    name: result.name,
    mimeType: result.mimeType,
    webViewLink: result.webViewLink,
    webContentLink: result.webContentLink,
    directMediaUrl: `/api/drive/media?fileId=${fileId}`,
  };
}

/**
 * Resolves the appropriate folder ID based on folder type: 'audio' | 'covers' | 'cctv'
 */
export function getFolderIdForType(folderType: 'audio' | 'covers' | 'cctv' | string): string {
  const config = getGoogleConfig();
  switch (folderType) {
    case 'audio':
      return config.GOOGLE_DRIVE_AUDIO_FOLDER_ID;
    case 'covers':
      return config.GOOGLE_DRIVE_COVERS_FOLDER_ID;
    case 'cctv':
    case 'media':
      return config.GOOGLE_DRIVE_MEDIA_FOLDER_ID;
    default:
      return '';
  }
}
