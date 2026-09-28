import { google } from "googleapis";
import { cookies } from "next/headers";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const OAUTH_COOKIE_NAME = "google_oauth_tokens";
const ADMIN_SESSION_COOKIE = "admin_session";

export function getOAuth2Client(redirectUriOverride?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const defaultRedirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    (process.env.APP_URL ? `${process.env.APP_URL}/api/admin/auth/google/callback` : "http://localhost:3000/api/admin/auth/google/callback");

  const redirectUri = redirectUriOverride || defaultRedirectUri;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(redirectUriOverride?: string): string | null {
  const oauth2Client = getOAuth2Client(redirectUriOverride);
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });
}

export async function getAuthenticatedOAuth2Client() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(OAUTH_COOKIE_NAME);

  if (!tokenCookie?.value) {
    return null;
  }

  try {
    const tokens = JSON.parse(tokenCookie.value);
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return null;

    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  } catch (err) {
    console.error("Failed to parse stored Google OAuth tokens:", err);
    return null;
  }
}

/**
 * Verify if the current user session is an authorized admin
 */
export async function verifyGoogleAdmin() {
  const cookieStore = await cookies();
  const allowedAdminEmail = (process.env.ADMIN_GOOGLE_EMAIL || "amitdied69@gmail.com").toLowerCase().trim();

  // 1. Check Google OAuth session
  const oauthClient = await getAuthenticatedOAuth2Client();
  if (oauthClient) {
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
      const { data } = await oauth2.userinfo.get();
      const userEmail = data.email?.toLowerCase().trim();

      if (userEmail && userEmail === allowedAdminEmail) {
        return {
          authenticated: true,
          email: userEmail,
          name: data.name || "Admin",
          picture: data.picture || null,
          method: "google_oauth" as const,
        };
      } else if (userEmail) {
        throw new Error(`Access Denied: Google Account "${userEmail}" is not authorized. Allowed admin email is "${allowedAdminEmail}".`);
      }
    } catch (err: any) {
      if (err.message.startsWith("Access Denied")) {
        throw err;
      }
      console.warn("Google OAuth token verification failed:", err?.message);
    }
  }

  // 2. Fallback to password session cookie if configured
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);
  if (sessionCookie && sessionCookie.value === "authenticated") {
    return {
      authenticated: true,
      email: allowedAdminEmail,
      name: "AMITDIED Admin",
      picture: null,
      method: "password_session" as const,
    };
  }

  throw new Error("Unauthorized: Administrator Google OAuth login required");
}
