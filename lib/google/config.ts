export const GOOGLE_CONFIG = {
  ADMIN_EMAIL: (process.env.ADMIN_GOOGLE_EMAIL || 'AMITDIED69@gmail.com').toLowerCase().trim(),
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '430007121717-bcqp8gia0osgt4c9njgq1q544d13pmse.apps.googleusercontent.com',
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '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',
  SHEET_ID: process.env.GOOGLE_SHEET_ID || '1gnlLIweCywZ_5V__OLqGPNfDLjqKCB7Y1PHBQnfDBLA',
  DRIVE_AUDIO_FOLDER_ID: process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID || '1E3no0R-HSGpK_ihIaDMzLutTs3HwD02s',
  DRIVE_COVERS_FOLDER_ID: process.env.GOOGLE_DRIVE_COVERS_FOLDER_ID || '1b1T6joDt1c9wxhexUc31n1YI_DdebzOm',
  DRIVE_MEDIA_FOLDER_ID: process.env.GOOGLE_DRIVE_MEDIA_FOLDER_ID || '1kaDYyeycE7jQkOjIV9xHQJaTCLWpXzqT',
  REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'https://amitdied.vercel.app/api/auth/google/callback',
  SCOPES: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
};
