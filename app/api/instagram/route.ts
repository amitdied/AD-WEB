import { NextResponse } from "next/server";
import { getCustomTransmissions } from "@/app/admin/data-actions";
import { INSTAGRAM_TRANSMISSIONS } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Prefer visible-only if your function supports the flag
    const list =
      (await (getCustomTransmissions as any)(false)) ||
      (await getCustomTransmissions());

    if (Array.isArray(list) && list.length > 0) {
      return NextResponse.json(list, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }
  } catch (error) {
    console.error("Error reading CCTV feeds:", error);
  }

  // Fallback so site never breaks
  return NextResponse.json(INSTAGRAM_TRANSMISSIONS, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}