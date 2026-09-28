<div align="center">
  <h1 align="center">AMITDIED // PRODUCTION BEAT STORE & WORKSPACE BACKEND</h1>
</div>

## Google Workspace Architecture

```
AMITDIED LIVE WEBSITE
        ↓
PRIVATE ADMIN (/admin/beats)
        ↓
GOOGLE OAUTH (ADMIN_GOOGLE_EMAIL)
        ↓
ADMIN BEAT UPLOAD (/api/admin/beats/upload)
        ↓
GOOGLE DRIVE (AMITDIED BEATS/AUDIO & AMITDIED BEATS/COVERS)
        ↓
GOOGLE SHEETS ("BEATS" tab)
        ↓
LIVE BEAT STORE (/api/beats & audio streaming via /api/media/[fileId])
```

- **Audio & Artwork Storage**: Google Drive (`AMITDIED BEATS/AUDIO` & `AMITDIED BEATS/COVERS`).
- **Beat Database**: Google Sheets (`BEATS` worksheet).
- **Admin Authentication**: Google OAuth 2.0 restricted to `ADMIN_GOOGLE_EMAIL` (`amitdied69@gmail.com`).
- **Live Sync**: Adding or editing beats directly updates Google Sheets and Google Drive, reflecting on the live Beat Store without Vercel redeployment.
