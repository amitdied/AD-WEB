import { google } from "googleapis";
import { getAuthenticatedOAuth2Client } from "./google-auth";
import { Readable } from "stream";

export interface BeatRecord {
  id: string;
  title: string;
  slug: string;
  bpm: number;
  genre: string;
  mood: string;
  price: number;
  currency: string;
  description: string;
  tags: string[];
  audioFileId: string;
  coverFileId: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SHEETS_HEADER = [
  "id",
  "title",
  "slug",
  "bpm",
  "genre",
  "mood",
  "price",
  "currency",
  "description",
  "tags",
  "audio_file_id",
  "cover_file_id",
  "is_published",
  "is_featured",
  "created_at",
  "updated_at",
];

export async function getDriveClient() {
  const auth = await getAuthenticatedOAuth2Client();
  if (!auth) {
    throw new Error("Google OAuth authentication required. Please log in with your Google account.");
  }
  return google.drive({ version: "v3", auth });
}

export async function getSheetsClient() {
  const auth = await getAuthenticatedOAuth2Client();
  if (!auth) {
    throw new Error("Google OAuth authentication required. Please log in with your Google account.");
  }
  return google.sheets({ version: "v4", auth });
}

/**
 * Upload a stream/buffer directly to Google Drive folder with public readable permissions
 */
export async function uploadFileToDrive(params: {
  name: string;
  mimeType: string;
  folderId?: string;
  bodyStream: Readable;
}) {
  const drive = await getDriveClient();

  const fileMetadata: any = {
    name: params.name,
    parents: params.folderId ? [params.folderId] : undefined,
  };

  const media = {
    mimeType: params.mimeType,
    body: params.bodyStream,
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, webContentLink",
  });

  const fileId = file.data.id;
  if (!fileId) {
    throw new Error("Google Drive upload failed: No file ID returned.");
  }

  // Grant "anyone with the link can view" permission so beat previews and covers can stream
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch (permErr) {
    console.warn(`Could not set public permission on Google Drive file ${fileId}:`, permErr);
  }

  return {
    fileId,
    name: file.data.name,
    webViewLink: file.data.webViewLink,
    webContentLink: file.data.webContentLink,
  };
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(fileId: string) {
  try {
    const drive = await getDriveClient();
    await drive.files.delete({ fileId });
    return true;
  } catch (err: any) {
    console.warn(`Failed to delete Google Drive file ${fileId}:`, err?.message);
    return false;
  }
}

/**
 * Ensure the BEATS sheet and columns header row exist
 */
export async function ensureBeatsSheetInitialized() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "BEATS";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is missing.");
  }

  const sheets = await getSheetsClient();

  // Check spreadsheet metadata to verify sheet exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetExists = meta.data.sheets?.some(
    (s) => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
  );

  if (!sheetExists) {
    // Add the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
  }

  // Check if header exists
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:P1`,
  });

  if (!headerRes.data.values || headerRes.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:P1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [SHEETS_HEADER],
      },
    });
  }
}

/**
 * Fetch all beats from Google Sheets
 */
export async function getAllBeatsFromSheet(options?: { onlyPublished?: boolean }): Promise<BeatRecord[]> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "BEATS";

  if (!spreadsheetId) {
    return [];
  }

  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:P`,
    });

    const rows = res.data.values || [];
    const beats: BeatRecord[] = [];

    for (const row of rows) {
      if (!row || !row[0]) continue;

      const isPublished = String(row[12]).toUpperCase() === "TRUE";
      if (options?.onlyPublished && !isPublished) {
        continue;
      }

      const tagsRaw = row[9] || "";
      const tags = typeof tagsRaw === "string"
        ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      beats.push({
        id: String(row[0] || ""),
        title: String(row[1] || ""),
        slug: String(row[2] || ""),
        bpm: Number(row[3]) || 120,
        genre: String(row[4] || "Trap"),
        mood: String(row[5] || "Dark"),
        price: Number(row[6]) || 29.99,
        currency: String(row[7] || "INR"),
        description: String(row[8] || ""),
        tags,
        audioFileId: String(row[10] || ""),
        coverFileId: String(row[11] || ""),
        isPublished,
        isFeatured: String(row[13]).toUpperCase() === "TRUE",
        createdAt: String(row[14] || new Date().toISOString()),
        updatedAt: String(row[15] || new Date().toISOString()),
      });
    }

    // Order by created_at DESC (newest first)
    beats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return beats;
  } catch (err) {
    console.error("Failed to load beats from Google Sheet:", err);
    return [];
  }
}

/**
 * Append or update a beat row in Google Sheet
 */
export async function saveBeatToSheet(beat: BeatRecord): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "BEATS";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is missing.");
  }

  await ensureBeatsSheetInitialized();
  const sheets = await getSheetsClient();

  // Find existing row by ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:P`,
  });

  const rows = res.data.values || [];
  let rowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === beat.id) {
      rowIndex = i + 2; // 1-indexed, skipping header
      break;
    }
  }

  const rowValues = [
    beat.id,
    beat.title,
    beat.slug,
    beat.bpm,
    beat.genre,
    beat.mood,
    beat.price,
    beat.currency,
    beat.description,
    Array.isArray(beat.tags) ? beat.tags.join(", ") : "",
    beat.audioFileId,
    beat.coverFileId,
    beat.isPublished ? "TRUE" : "FALSE",
    beat.isFeatured ? "TRUE" : "FALSE",
    beat.createdAt,
    new Date().toISOString(),
  ];

  if (rowIndex > 0) {
    // Update existing row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:P${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });
  } else {
    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:P`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });
  }
}

/**
 * Delete a beat from Google Sheet
 */
export async function deleteBeatFromSheet(id: string): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "BEATS";

  if (!spreadsheetId) return false;

  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetObj = meta.data.sheets?.find(
    (s) => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
  );

  const sheetNumericId = sheetObj?.properties?.sheetId || 0;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:P`,
  });

  const rows = res.data.values || [];
  let targetRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === id) {
      targetRowIndex = i + 1; // 0-indexed for batchUpdate (row 0 is header, so row 1 is index 0 in A2)
      break;
    }
  }

  if (targetRowIndex < 0) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetNumericId,
              dimension: "ROWS",
              startIndex: targetRowIndex,
              endIndex: targetRowIndex + 1,
            },
          },
        },
      ],
    },
  });

  return true;
}
