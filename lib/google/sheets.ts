import { getGoogleConfig } from './config';

export const SHEET_TABS = {
  BEATS: 'BEATS',
  PORTFOLIO: 'PORTFOLIO',
  CCTV: 'CCTV',
} as const;

export const SHEET_COLUMNS = {
  BEATS: [
    'id',
    'title',
    'slug',
    'bpm',
    'genre',
    'mood',
    'price',
    'currency',
    'description',
    'tags',
    'audio_file_id',
    'cover_file_id',
    'is_published',
    'is_featured',
    'created_at',
    'updated_at',
  ],
  PORTFOLIO: [
    'id',
    'title',
    'youtube_url',
    'youtube_id',
    'thumbnail_url',
    'description',
    'category',
    'sort_order',
    'is_published',
    'created_at',
    'updated_at',
  ],
  CCTV: [
    'id',
    'title',
    'description',
    'media_type',
    'youtube_url',
    'drive_file_id',
    'thumbnail_file_id',
    'category',
    'sort_order',
    'is_published',
    'created_at',
    'updated_at',
  ],
} as const;

export type BeatRow = {
  id: string;
  title: string;
  slug?: string;
  bpm: number | string;
  genre: string;
  mood?: string;
  price: number | string;
  currency?: string;
  description?: string;
  tags?: string;
  audio_file_id?: string;
  cover_file_id?: string;
  is_published: boolean | string;
  is_featured: boolean | string;
  created_at?: string;
  updated_at?: string;
};

export type PortfolioRow = {
  id: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail_url?: string;
  description?: string;
  category?: string;
  sort_order: number | string;
  is_published: boolean | string;
  created_at?: string;
  updated_at?: string;
};

export type CCTVRow = {
  id: string;
  title: string;
  description?: string;
  media_type: 'youtube' | 'drive_video' | 'image' | string;
  youtube_url?: string;
  drive_file_id?: string;
  thumbnail_file_id?: string;
  category?: string;
  sort_order: number | string;
  is_published: boolean | string;
  created_at?: string;
  updated_at?: string;
};

/**
 * Reads tab metadata and list of sheet titles
 */
export async function getSpreadsheetDetails(token?: string | null): Promise<{
  title: string;
  sheets: { sheetId: number; title: string }[];
}> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}`,
    { headers }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch spreadsheet details: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title,
  }));

  return {
    title: data.properties?.title || 'AMITDIED Sheet',
    sheets,
  };
}

/**
 * Initializes the 3 required tabs with their header rows
 */
export async function initializeSheetTabs(token: string): Promise<{
  success: boolean;
  createdTabs: string[];
}> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  const details = await getSpreadsheetDetails(token);
  const existingSheetTitles = details.sheets.map((s) => s.title);
  const createdTabs: string[] = [];

  const requiredTabs = [
    { title: SHEET_TABS.BEATS, columns: SHEET_COLUMNS.BEATS },
    { title: SHEET_TABS.PORTFOLIO, columns: SHEET_COLUMNS.PORTFOLIO },
    { title: SHEET_TABS.CCTV, columns: SHEET_COLUMNS.CCTV },
  ];

  // 1. Add any missing tabs
  const requests: any[] = [];
  for (const tab of requiredTabs) {
    if (!existingSheetTitles.includes(tab.title)) {
      requests.push({
        addSheet: {
          properties: {
            title: tab.title,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      });
      createdTabs.push(tab.title);
    }
  }

  if (requests.length > 0) {
    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!batchRes.ok) {
      const err = await batchRes.text();
      throw new Error(`Failed to create tabs: ${batchRes.status} - ${err}`);
    }
  }

  // 2. Set headers on tabs
  for (const tab of requiredTabs) {
    // Check if tab already has headers
    try {
      const headerRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}/values/${encodeURIComponent(tab.title)}!1:1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (headerRes.ok) {
        const headerData = await headerRes.json();
        if (!headerData.values || headerData.values.length === 0) {
          // Add headers
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}/values/${encodeURIComponent(tab.title)}!1:1?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                values: [tab.columns],
              }),
            }
          );
        }
      }
    } catch (e) {
      console.error(`Error setting header for ${tab.title}:`, e);
    }
  }

  return { success: true, createdTabs };
}

/**
 * Reads all rows from a given sheet tab as an array of key-value objects
 */
export async function getTabRows<T = Record<string, any>>(
  tabName: keyof typeof SHEET_COLUMNS,
  token?: string | null
): Promise<T[]> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_SHEET_ID) {
    return [];
  }

  // 1. Try Google Sheets REST API with token if available
  if (token) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}/values/${encodeURIComponent(tabName)}?valueRenderOption=UNFORMATTED_VALUE`,
        {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 15 },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rows: any[][] = data.values || [];
        if (rows.length <= 1) return [];

        const headers = rows[0].map((h: any) => String(h || '').trim());
        const items: any[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0]) continue;
          const item: Record<string, any> = { _rowIndex: i + 1 };
          headers.forEach((h: string, colIdx: number) => {
            item[h] = row[colIdx] !== undefined ? row[colIdx] : '';
          });
          items.push(item);
        }

        return items as T[];
      }
    } catch (err) {
      console.warn(`REST API read for ${tabName} failed:`, err);
    }
  }

  // 2. Fallback to public gviz query (works if sheet is shared with "anyone with link")
  try {
    const url = `https://docs.google.com/spreadsheets/d/${config.GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (res.ok) {
      const text = await res.text();
      // Google outputs /*O_o*/\ngoogle.visualization.Query.setResponse({...});
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
      if (match && match[1]) {
        const json = JSON.parse(match[1]);
        const cols = (json.table?.cols || []).map((c: any) => c?.label || '');
        const rows = json.table?.rows || [];
        const items: any[] = [];

        rows.forEach((r: any, idx: number) => {
          const item: Record<string, any> = { _rowIndex: idx + 2 };
          cols.forEach((colName: string, cIdx: number) => {
            const cellVal = r.c?.[cIdx]?.v;
            item[colName] = cellVal !== undefined ? cellVal : '';
          });
          if (item.id || item.title) {
            items.push(item);
          }
        });

        if (items.length > 0) {
          return items as T[];
        }
      }
    }
  } catch (err) {
    console.warn(`Public gviz read for ${tabName} failed:`, err);
  }

  return [];
}

/**
 * Appends a new row to a tab
 */
export async function appendTabRow(
  tabName: keyof typeof SHEET_COLUMNS,
  rowData: Record<string, any>,
  token: string
): Promise<any> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  const columns = SHEET_COLUMNS[tabName] as readonly string[];
  const now = new Date().toISOString();
  const dataWithTimestamps: Record<string, any> = {
    ...rowData,
    created_at: rowData.created_at || now,
    updated_at: now,
  };

  const rowValues = columns.map((col) => {
    const val = dataWithTimestamps[col];
    if (val === undefined || val === null) return '';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return String(val);
  });

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}/values/${encodeURIComponent(tabName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to append row to ${tabName}: ${res.status} - ${err}`);
  }

  return dataWithTimestamps;
}

/**
 * Updates a row by ID in a tab
 */
export async function updateTabRow(
  tabName: keyof typeof SHEET_COLUMNS,
  id: string,
  updatedData: Record<string, any>,
  token: string
): Promise<any> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  const existingRows = await getTabRows<any>(tabName, token);
  const target = existingRows.find((r) => String(r.id) === String(id));
  if (!target || !target._rowIndex) {
    throw new Error(`Row with id ${id} not found in ${tabName}`);
  }

  const columns = SHEET_COLUMNS[tabName] as readonly string[];
  const merged: Record<string, any> = {
    ...target,
    ...updatedData,
    updated_at: new Date().toISOString(),
  };

  const rowValues = columns.map((col) => {
    const val = merged[col];
    if (val === undefined || val === null) return '';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return String(val);
  });

  const range = `${encodeURIComponent(tabName)}!A${target._rowIndex}:${String.fromCharCode(65 + columns.length - 1)}${target._rowIndex}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update row in ${tabName}: ${res.status} - ${err}`);
  }

  return merged;
}

/**
 * Deletes a row by ID from a tab
 */
export async function deleteTabRow(
  tabName: keyof typeof SHEET_COLUMNS,
  id: string,
  token: string
): Promise<boolean> {
  const config = getGoogleConfig();
  if (!config.GOOGLE_SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  const details = await getSpreadsheetDetails(token);
  const sheetObj = details.sheets.find((s) => s.title === tabName);
  if (!sheetObj) {
    throw new Error(`Sheet tab ${tabName} not found`);
  }

  const existingRows = await getTabRows<any>(tabName, token);
  const target = existingRows.find((r) => String(r.id) === String(id));
  if (!target || !target._rowIndex) {
    throw new Error(`Row with id ${id} not found in ${tabName}`);
  }

  const rowIndex = target._rowIndex; // 1-based row index

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.GOOGLE_SHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetObj.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-based
                endIndex: rowIndex,
              },
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete row in ${tabName}: ${res.status} - ${err}`);
  }

  return true;
}
