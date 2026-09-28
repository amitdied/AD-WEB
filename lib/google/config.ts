export interface GoogleEnvConfig {
  ADMIN_GOOGLE_EMAIL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  GOOGLE_DRIVE_AUDIO_FOLDER_ID: string;
  GOOGLE_DRIVE_COVERS_FOLDER_ID: string;
  GOOGLE_DRIVE_MEDIA_FOLDER_ID: string;
  GOOGLE_SHEET_ID: string;
  GOOGLE_SHEET_NAME: string;
}

export interface ConfigCheckItem {
  key: keyof GoogleEnvConfig;
  label: string;
  isConfigured: boolean;
  helpText: string;
  valueMasked?: string;
}

export function getGoogleConfig(): GoogleEnvConfig {
  return {
    ADMIN_GOOGLE_EMAIL: process.env.ADMIN_GOOGLE_EMAIL || 'amitdied69@gmail.com',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_REDIRECT_URI:
      process.env.GOOGLE_REDIRECT_URI ||
      (process.env.APP_URL ? `${process.env.APP_URL}/api/auth/google/callback` : ''),
    GOOGLE_DRIVE_AUDIO_FOLDER_ID: process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID || '',
    GOOGLE_DRIVE_COVERS_FOLDER_ID: process.env.GOOGLE_DRIVE_COVERS_FOLDER_ID || '',
    GOOGLE_DRIVE_MEDIA_FOLDER_ID: process.env.GOOGLE_DRIVE_MEDIA_FOLDER_ID || '',
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
    GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME || 'AMITDIED_DATABASE',
  };
}

export function checkConfiguration(): {
  allConfigured: boolean;
  isOAuthConfigured: boolean;
  isDriveConfigured: boolean;
  isSheetsConfigured: boolean;
  items: ConfigCheckItem[];
} {
  const config = getGoogleConfig();

  const items: ConfigCheckItem[] = [
    {
      key: 'ADMIN_GOOGLE_EMAIL',
      label: 'Admin Google Account',
      isConfigured: Boolean(config.ADMIN_GOOGLE_EMAIL),
      helpText: 'Set your Google Account email (e.g. amitdied69@gmail.com) authorized to access the control panel.',
      valueMasked: config.ADMIN_GOOGLE_EMAIL || undefined,
    },
    {
      key: 'GOOGLE_CLIENT_ID',
      label: 'Google OAuth Client ID',
      isConfigured: Boolean(config.GOOGLE_CLIENT_ID),
      helpText: 'Create an OAuth 2.0 Web Client ID in Google Cloud Console and paste the Client ID.',
      valueMasked: config.GOOGLE_CLIENT_ID
        ? `${config.GOOGLE_CLIENT_ID.slice(0, 12)}...`
        : undefined,
    },
    {
      key: 'GOOGLE_CLIENT_SECRET',
      label: 'Google OAuth Client Secret',
      isConfigured: Boolean(config.GOOGLE_CLIENT_SECRET),
      helpText: 'Paste the Client Secret from your Google Cloud OAuth 2.0 Web Client credentials.',
      valueMasked: config.GOOGLE_CLIENT_SECRET ? '••••••••••••••••' : undefined,
    },
    {
      key: 'GOOGLE_REDIRECT_URI',
      label: 'OAuth Redirect URI',
      isConfigured: Boolean(config.GOOGLE_REDIRECT_URI),
      helpText: 'Set the authorized callback URL (e.g. https://yourdomain.com/api/auth/google/callback).',
      valueMasked: config.GOOGLE_REDIRECT_URI || undefined,
    },
    {
      key: 'GOOGLE_SHEET_ID',
      label: 'Google Sheet Database ID',
      isConfigured: Boolean(config.GOOGLE_SHEET_ID),
      helpText: 'Copy the spreadsheet ID from your Google Sheet URL (the string between /d/ and /edit).',
      valueMasked: config.GOOGLE_SHEET_ID
        ? `${config.GOOGLE_SHEET_ID.slice(0, 8)}...`
        : undefined,
    },
    {
      key: 'GOOGLE_DRIVE_AUDIO_FOLDER_ID',
      label: 'Drive Audio Folder (AMITDIED BEATS/AUDIO)',
      isConfigured: Boolean(config.GOOGLE_DRIVE_AUDIO_FOLDER_ID),
      helpText: 'Create a folder named AUDIO in Google Drive, copy its folder ID from the URL, and paste it here.',
      valueMasked: config.GOOGLE_DRIVE_AUDIO_FOLDER_ID
        ? `${config.GOOGLE_DRIVE_AUDIO_FOLDER_ID.slice(0, 8)}...`
        : undefined,
    },
    {
      key: 'GOOGLE_DRIVE_COVERS_FOLDER_ID',
      label: 'Drive Covers Folder (AMITDIED BEATS/COVERS)',
      isConfigured: Boolean(config.GOOGLE_DRIVE_COVERS_FOLDER_ID),
      helpText: 'Create a folder named COVERS in Google Drive, copy its folder ID from the URL, and paste it here.',
      valueMasked: config.GOOGLE_DRIVE_COVERS_FOLDER_ID
        ? `${config.GOOGLE_DRIVE_COVERS_FOLDER_ID.slice(0, 8)}...`
        : undefined,
    },
    {
      key: 'GOOGLE_DRIVE_MEDIA_FOLDER_ID',
      label: 'Drive Media Folder (AMITDIED MEDIA/CCTV)',
      isConfigured: Boolean(config.GOOGLE_DRIVE_MEDIA_FOLDER_ID),
      helpText: 'Create a folder named CCTV in Google Drive, copy its folder ID from the URL, and paste it here.',
      valueMasked: config.GOOGLE_DRIVE_MEDIA_FOLDER_ID
        ? `${config.GOOGLE_DRIVE_MEDIA_FOLDER_ID.slice(0, 8)}...`
        : undefined,
    },
  ];

  const isOAuthConfigured = Boolean(
    config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.ADMIN_GOOGLE_EMAIL
  );
  const isSheetsConfigured = Boolean(config.GOOGLE_SHEET_ID);
  const isDriveConfigured = Boolean(
    config.GOOGLE_DRIVE_AUDIO_FOLDER_ID &&
    config.GOOGLE_DRIVE_COVERS_FOLDER_ID &&
    config.GOOGLE_DRIVE_MEDIA_FOLDER_ID
  );
  const allConfigured = items.every((i) => i.isConfigured);

  return {
    allConfigured,
    isOAuthConfigured,
    isDriveConfigured,
    isSheetsConfigured,
    items,
  };
}
