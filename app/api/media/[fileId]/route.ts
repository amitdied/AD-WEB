import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxy streaming endpoint for Google Drive audio & image files
 * Streams directly using Drive's export/download endpoint with Range header support
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId || fileId.length < 5) {
    return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  // Build target URL
  // If an API key is available, use Google Drive API files.get with alt=media
  // Otherwise, use the standard Google Drive direct stream URL
  const targetUrl = apiKey
    ? `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`
    : `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    const rangeHeader = request.headers.get("range");
    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const driveRes = await fetch(targetUrl, {
      headers,
      cache: "force-cache",
    });

    if (!driveRes.ok && driveRes.status !== 206) {
      // Fallback: try alternate direct webview/content url
      const altUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      const altRes = await fetch(altUrl, { headers });
      if (altRes.ok || altRes.status === 206) {
        return new NextResponse(altRes.body as any, {
          status: altRes.status,
          headers: {
            "Content-Type": altRes.headers.get("Content-Type") || "application/octet-stream",
            "Content-Length": altRes.headers.get("Content-Length") || "",
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }

      return NextResponse.json(
        { error: "Could not stream file from Google Drive", status: driveRes.status },
        { status: driveRes.status }
      );
    }

    return new NextResponse(driveRes.body as any, {
      status: driveRes.status,
      headers: {
        "Content-Type": driveRes.headers.get("Content-Type") || "application/octet-stream",
        "Content-Length": driveRes.headers.get("Content-Length") || "",
        "Content-Range": driveRes.headers.get("Content-Range") || "",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    console.error("Drive stream proxy error:", err);
    return NextResponse.json(
      { error: "Internal streaming error", details: err?.message },
      { status: 500 }
    );
  }
}
