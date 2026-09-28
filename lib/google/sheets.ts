import { GOOGLE_CONFIG } from './config';
import { getValidAccessToken } from './auth';

const SHEET_ID = GOOGLE_CONFIG.SHEET_ID;
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

export const BEAT_HEADERS = [
  'id',
  'title',
  'producer',
  'bpm',
  'key',
  'genre',
  'price',
  'coverUrl',
  'audioUrl',
  'buyLink',
  'description',
  'moodTags',
  'updatedAt',
];

export const PORTFOLIO_HEADERS = [
  'id',
  'title',
  'url',
  'description',
  'updatedAt',
];

export const CCTV_HEADERS = [
  'id',
  'camCode',
  'category',
  'caption',
  'videoSnippetTitle',
  'imageUrl',
  'postUrl',
  'likes',
  'comments',
  'tags',
  'timestamp',
  'updatedAt',
];

async function callSheetsApi(endpoint: string, options: RequestInit = {}) {
  const token = await getValidAccessToken();
  if (!token) {
    return null;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.warn(`[SHEETS API] Error on ${endpoint} (${res.status}):`, errorText);
    return null;
  }

  return await res.json();
}

/**
 * Verifies or initializes the 3 required tabs: BEATS, PORTFOLIO, CCTV
 */
export async function ensureSheetTabsExist(): Promise<boolean> {
  const meta = await callSheetsApi('');
  if (!meta || !Array.isArray(meta.sheets)) {
    return false;
  }

  const existingSheetTitles = meta.sheets.map(
    (s: any) => s.properties?.title
  ) as string[];

  const requiredSheets = ['BEATS', 'PORTFOLIO', 'CCTV'];
  const missingSheets = requiredSheets.filter(
    (name) => !existingSheetTitles.includes(name)
  );

  if (missingSheets.length > 0) {
    console.log(`[SHEETS] Adding missing sheets: ${missingSheets.join(', ')}`);
    const requests = missingSheets.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { rowCount: 200, columnCount: 20 },
        },
      },
    }));

    await callSheetsApi(':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });

    // Write header rows for the newly added sheets
    for (const title of missingSheets) {
      let headers: string[] = [];
      if (title === 'BEATS') headers = BEAT_HEADERS;
      else if (title === 'PORTFOLIO') headers = PORTFOLIO_HEADERS;
      else if (title === 'CCTV') headers = CCTV_HEADERS;

      if (headers.length > 0) {
        await callSheetsApi(`/values/${title}!A1:Z1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ values: [headers] }),
        });
      }
    }
  }

  return true;
}

// ==========================================
// BEATS OPERATIONS
// ==========================================

export async function readBeatsFromSheet(): Promise<any[] | null> {
  const data = await callSheetsApi('/values/BEATS!A1:M1000');
  if (!data || !Array.isArray(data.values) || data.values.length <= 1) {
    return null; // Empty or headers only
  }

  const rows = data.values.slice(1);
  return rows.map((row: any[]) => {
    const [
      id,
      title,
      producer,
      bpm,
      key,
      genre,
      price,
      coverUrl,
      audioUrl,
      buyLink,
      description,
      moodTags,
    ] = row;

    let parsedTags: string[] = [];
    if (typeof moodTags === 'string') {
      try {
        if (moodTags.startsWith('[')) {
          parsedTags = JSON.parse(moodTags);
        } else {
          parsedTags = moodTags.split(',').map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        parsedTags = moodTags.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    return {
      id: String(id || `beat-${Date.now()}`),
      title: String(title || 'Untitled Beat'),
      producer: String(producer || 'AMITDIED'),
      bpm: Number(bpm) || 120,
      key: String(key || ''),
      genre: String(genre || 'Trap'),
      price: Number(price) || 29.99,
      coverUrl: String(coverUrl || '/placeholder-cover.png'),
      audioUrl: String(audioUrl || ''),
      buyLink: String(buyLink || ''),
      description: String(description || ''),
      moodTags: parsedTags,
    };
  });
}

export async function writeAllBeatsToSheet(beatsList: any[]) {
  await ensureSheetTabsExist();
  const rows = beatsList.map((b) => [
    b.id || '',
    b.title || '',
    b.producer || '',
    b.bpm || '',
    b.key || '',
    b.genre || '',
    b.price || '',
    b.coverUrl || '',
    b.audioUrl || '',
    b.buyLink || '',
    b.description || '',
    Array.isArray(b.moodTags) ? b.moodTags.join(', ') : b.moodTags || '',
    new Date().toISOString(),
  ]);

  // Clear existing content and rewrite with headers
  await callSheetsApi('/values/BEATS!A1:M1000:clear', { method: 'POST' });
  await callSheetsApi('/values/BEATS!A1:M?valueInputOption=USER_ENTERED', {
    method: 'PUT',
    body: JSON.stringify({
      values: [BEAT_HEADERS, ...rows],
    }),
  });
}

// ==========================================
// PORTFOLIO / VIDEOS OPERATIONS
// ==========================================

export async function readPortfolioFromSheet(): Promise<any[] | null> {
  const data = await callSheetsApi('/values/PORTFOLIO!A1:E500');
  if (!data || !Array.isArray(data.values) || data.values.length <= 1) {
    return null;
  }

  const rows = data.values.slice(1);
  return rows.map((row: any[]) => {
    const [id, title, url, description] = row;
    return {
      id: String(id || `video-${Date.now()}`),
      title: String(title || 'Untitled Video'),
      url: String(url || ''),
      description: String(description || ''),
    };
  });
}

export async function writeAllPortfolioToSheet(videosList: any[]) {
  await ensureSheetTabsExist();
  const rows = videosList.map((v) => [
    v.id || '',
    v.title || '',
    v.url || '',
    v.description || '',
    new Date().toISOString(),
  ]);

  await callSheetsApi('/values/PORTFOLIO!A1:E500:clear', { method: 'POST' });
  await callSheetsApi('/values/PORTFOLIO!A1:E?valueInputOption=USER_ENTERED', {
    method: 'PUT',
    body: JSON.stringify({
      values: [PORTFOLIO_HEADERS, ...rows],
    }),
  });
}

// ==========================================
// CCTV / INSTAGRAM TRANSMISSIONS OPERATIONS
// ==========================================

export async function readCctvFromSheet(): Promise<any[] | null> {
  const data = await callSheetsApi('/values/CCTV!A1:L500');
  if (!data || !Array.isArray(data.values) || data.values.length <= 1) {
    return null;
  }

  const rows = data.values.slice(1);
  return rows.map((row: any[]) => {
    const [
      id,
      camCode,
      category,
      caption,
      videoSnippetTitle,
      imageUrl,
      postUrl,
      likes,
      comments,
      tags,
      timestamp,
    ] = row;

    let parsedTags: string[] = ['#amitdied', '#darktrap'];
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((s) => s.trim()).filter(Boolean);
    }

    return {
      id: String(id || `cctv-${Date.now()}`),
      camCode: String(camCode || 'CAM-01 // FEED'),
      category: String(category || 'cookup'),
      caption: String(caption || ''),
      videoSnippetTitle: String(videoSnippetTitle || 'TRANSMISSION_RAW.WAV'),
      imageUrl: String(imageUrl || ''),
      postUrl: String(postUrl || 'https://www.instagram.com/amitdied/'),
      likes: Number(likes) || 120,
      comments: Number(comments) || 14,
      tags: parsedTags,
      timestamp: String(timestamp || 'LIVE FEED'),
    };
  });
}

export async function writeAllCctvToSheet(cctvList: any[]) {
  await ensureSheetTabsExist();
  const rows = cctvList.map((t) => [
    t.id || '',
    t.camCode || '',
    t.category || '',
    t.caption || '',
    t.videoSnippetTitle || '',
    t.imageUrl || '',
    t.postUrl || '',
    t.likes || 0,
    t.comments || 0,
    Array.isArray(t.tags) ? t.tags.join(', ') : t.tags || '',
    t.timestamp || '',
    new Date().toISOString(),
  ]);

  await callSheetsApi('/values/CCTV!A1:L500:clear', { method: 'POST' });
  await callSheetsApi('/values/CCTV!A1:L?valueInputOption=USER_ENTERED', {
    method: 'PUT',
    body: JSON.stringify({
      values: [CCTV_HEADERS, ...rows],
    }),
  });
}
