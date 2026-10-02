import { NextResponse } from "next/server";
import { getCustomTransmissions } from "@/app/admin/data-actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getCustomTransmissions(false); // only visible items
    return NextResponse.json(Array.isArray(list) ? list : [], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error reading CCTV feeds:", error);
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}