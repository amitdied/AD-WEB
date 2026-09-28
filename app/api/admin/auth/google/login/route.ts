import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/admin/auth/google/callback`;

  const authUrl = getGoogleAuthUrl(redirectUri);

  if (!authUrl) {
    return NextResponse.json(
      {
        error: "Google OAuth credentials not configured.",
        hint: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(authUrl);
}
