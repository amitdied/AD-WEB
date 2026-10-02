import { NextResponse } from "next/server";
import { getCustomTransmissions } from "@/app/admin/data-actions";
import { DEFAULT_CCTV_POSTS } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getCustomTransmissions(false);

    if (Array.isArray(list) && list.length > 0) {
      const normalized = list
        .filter((item) => item && item.visible !== false && item.url)
        .map((item, idx) => ({
          id: String(item.id || `cctv-${idx}`),
          url: item.url,
          captionTitle: item.title || "TRANSMISSION",
          title: item.title || "TRANSMISSION",
          type: item.type === "video" ? "video" : "instagram",
          snippet: item.snippet || "",
          label: item.label || `CAM_${String(idx + 1).padStart(2, "0")}`,
          location: item.location || "STUDIO_UNDERGROUND",
          status: item.status || "ONLINE",
          visible: item.visible !== false,
          date: item.created_at || "LIVE",
          order_index: typeof item.order_index === "number" ? item.order_index : idx,
        }));

      if (normalized.length > 0) {
        return NextResponse.json(normalized, {
          headers: { "Cache-Control": "no-store, max-age=0" },
        });
      }
    }
  } catch (error) {
    console.error("Error reading CCTV feeds:", error);
  }

  // Fallback when Supabase has no usable CCTV records or error occurs
  return NextResponse.json(DEFAULT_CCTV_POSTS, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}