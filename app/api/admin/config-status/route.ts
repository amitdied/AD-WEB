import { NextResponse } from 'next/server';
import { checkConfiguration, getGoogleConfig } from '@/lib/google/config';
import { getValidGoogleAccessToken, getAdminSession } from '@/lib/google/auth';
import { getSpreadsheetDetails, SHEET_TABS } from '@/lib/google/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  const config = getGoogleConfig();
  const check = checkConfiguration();

  let sheetConnected = false;
  let detectedTabs: string[] = [];
  let sheetError: string | null = null;

  if (config.GOOGLE_SHEET_ID) {
    try {
      const token = await getValidGoogleAccessToken();
      const details = await getSpreadsheetDetails(token);
      sheetConnected = true;
      detectedTabs = details.sheets.map((s) => s.title);
    } catch (err: any) {
      sheetError = err.message || 'Failed to connect to Google Sheet';
    }
  }

  const hasBeatsTab = detectedTabs.includes(SHEET_TABS.BEATS);
  const hasPortfolioTab = detectedTabs.includes(SHEET_TABS.PORTFOLIO);
  const hasCctvTab = detectedTabs.includes(SHEET_TABS.CCTV);
  const allTabsDetected = hasBeatsTab && hasPortfolioTab && hasCctvTab;

  return NextResponse.json({
    adminSession: session
      ? {
          email: session.email,
          isDevPasswordAuth: Boolean(session.isDevPasswordAuth),
        }
      : null,
    checks: check.items,
    summary: {
      isOAuthConfigured: check.isOAuthConfigured,
      isDriveConfigured: check.isDriveConfigured,
      isSheetsConfigured: check.isSheetsConfigured,
      allConfigured: check.allConfigured,
      sheetConnected,
      sheetError,
      detectedTabs,
      hasBeatsTab,
      hasPortfolioTab,
      hasCctvTab,
      allTabsDetected,
    },
  });
}
