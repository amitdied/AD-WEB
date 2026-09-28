import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error || "No authorization code provided")}`, request.url)
    );
  }

  try {
    const redirectUri = `${url.origin}/api/admin/auth/google/callback`;
    const oauth2Client = getOAuth2Client(redirectUri);

    if (!oauth2Client) {
      return NextResponse.redirect(
        new URL("/admin/login?error=Google OAuth client not configured", request.url)
      );
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify user email against allowed admin email
    const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
    const { data: userInfo } = await oauth2.userinfo.get();
    const userEmail = userInfo.email?.toLowerCase().trim();
    const allowedEmail = (process.env.ADMIN_GOOGLE_EMAIL || "amitdied69@gmail.com").toLowerCase().trim();

    if (userEmail !== allowedEmail) {
      return NextResponse.redirect(
        new URL(
          `/admin/login?error=${encodeURIComponent(
            `Access Denied: Google Account "${userEmail}" is not authorized. Only "${allowedEmail}" may access the beat store backend.`
          )}`,
          request.url
        )
      );
    }

    // Success: store tokens in secure HTTP-only cookie and redirect to /admin/beats
    const response = NextResponse.redirect(new URL("/admin/beats", request.url));

    response.cookies.set("google_oauth_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    response.cookies.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Google OAuth token exchange failed:", err);
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(err?.message || "OAuth exchange failed")}`, request.url)
    );
  }
}
