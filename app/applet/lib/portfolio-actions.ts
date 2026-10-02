"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { YOUTUBE_LINKS } from "@/lib/data";

export type PortfolioActionResponse<T = any> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export interface PortfolioVideoItem {
  id: string;
  type: "youtube";
  youtubeId: string;
  youtubeUrl: string;
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(clean)) return clean;
  return null;
}

export async function getCustomVideos(includeHidden = true): Promise<PortfolioVideoItem[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .order("order_index", { ascending: true });

    if (!error && Array.isArray(data)) {
      const mapped: PortfolioVideoItem[] = data.map((row: any) => {
        const yId = extractYouTubeId(row.url) || row.id;
        const standardUrl = row.url || `https://www.youtube.com/watch?v=${yId}`;
        return {
          id: row.id,
          type: "youtube",
          youtubeId: yId,
          youtubeUrl: standardUrl,
          url: standardUrl,
          title: row.title || "Archive Video",
          description: row.description || "",
          thumbnail: `https://img.youtube.com/vi/${yId}/hqdefault.jpg`,
          visible: row.visible !== false,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.created_at || new Date().toISOString(),
        };
      });
      return includeHidden ? mapped : mapped.filter((v) => v.visible);
    }
  } catch (e) {
    console.warn("Could not read portfolio from Supabase, using static fallback:", e);
  }

  const fallback: PortfolioVideoItem[] = (YOUTUBE_LINKS || []).map((link: any, idx: number) => {
    const rawUrl = typeof link === "string" ? link : link.url;
    const yId = extractYouTubeId(rawUrl) || `fallback-${idx}`;
    return {
      id: typeof link === "object" && link.id ? link.id : yId,
      type: "youtube",
      youtubeId: yId,
      youtubeUrl: rawUrl,
      url: rawUrl,
      title: typeof link === "object" && link.title ? link.title : "Archive Video",
      description: typeof link === "object" && link.description ? link.description : "",
      thumbnail: `https://img.youtube.com/vi/${yId}/hqdefault.jpg`,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
  return includeHidden ? fallback : fallback.filter((v) => v.visible);
}

export async function addVideo(videoData: { url: string; title?: string; description?: string }): Promise<PortfolioActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const rawUrl = videoData.url?.trim();
    const ytId = extractYouTubeId(rawUrl || "");
    if (!ytId) {
      return {
        ok: false,
        error: "INVALID_URL: Please enter a valid YouTube URL (e.g. youtube.com/watch?v=..., youtu.be/..., or youtube.com/shorts/...)",
      };
    }

    const supabase = getSupabaseAdmin();

    const { data: existingRows } = await supabase
      .from("portfolio_items")
      .select("id, url")
      .or(`id.eq.${ytId},url.ilike.%${ytId}%`);

    if (existingRows && existingRows.length > 0) {
      return {
        ok: false,
        error: "DUPLICATE_VIDEO: This YouTube video is already in your portfolio.",
      };
    }

    const { count } = await supabase
      .from("portfolio_items")
      .select("*", { count: "exact", head: true });

    const standardUrl = `https://www.youtube.com/watch?v=${ytId}`;
    const insertRow = {
      id: ytId,
      title: videoData.title?.trim() || "Archive Video",
      url: standardUrl,
      description: videoData.description?.trim() || "",
      visible: true,
      order_index: typeof count === "number" ? count + 1 : 0,
    };

    const { error } = await supabase.from("portfolio_items").insert(insertRow);
    if (error) {
      return { ok: false, error: "SUPABASE_WRITE_FAILED: " + error.message };
    }

    const newVideo: PortfolioVideoItem = {
      id: ytId,
      type: "youtube",
      youtubeId: ytId,
      youtubeUrl: standardUrl,
      url: standardUrl,
      title: insertRow.title,
      description: insertRow.description,
      thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: newVideo };
  } catch (e: any) {
    console.error("[ADD VIDEO ERROR]", e?.message);
    return { ok: false, error: "SUPABASE_WRITE_FAILED: " + (e?.message || "unknown") };
  }
}

export async function updateVideo(
  id: string,
  updatedData: { url?: string; title?: string; description?: string; visible?: boolean; orderIndex?: number }
): Promise<PortfolioActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const supabase = getSupabaseAdmin();

    const updatePayload: any = {};
    if (updatedData.title !== undefined) updatePayload.title = updatedData.title.trim();
    if (updatedData.description !== undefined) updatePayload.description = updatedData.description.trim();
    if (updatedData.visible !== undefined) updatePayload.visible = updatedData.visible;
    if (updatedData.orderIndex !== undefined) updatePayload.order_index = updatedData.orderIndex;

    if (updatedData.url && updatedData.url.trim() !== "") {
      const parsedId = extractYouTubeId(updatedData.url);
      if (!parsedId) {
        return {
          ok: false,
          error: "INVALID_URL: Please enter a valid YouTube URL (e.g. youtube.com/watch?v=..., youtu.be/..., or youtube.com/shorts/...)",
        };
      }
      updatePayload.url = `https://www.youtube.com/watch?v=${parsedId}`;
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: data ? "SUPABASE_WRITE_FAILED: " + error?.message : "VIDEO_NOT_FOUND: Video ID not found",
      };
    }

    const yId = extractYouTubeId(data.url) || data.id;
    const updatedVideo: PortfolioVideoItem = {
      id: data.id,
      type: "youtube",
      youtubeId: yId,
      youtubeUrl: data.url,
      url: data.url,
      title: data.title || "Archive Video",
      description: data.description || "",
      thumbnail: `https://img.youtube.com/vi/${yId}/hqdefault.jpg`,
      visible: data.visible !== false,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: updatedVideo };
  } catch (e: any) {
    console.error("[UPDATE VIDEO ERROR]", e?.message);
    return { ok: false, error: "SUPABASE_WRITE_FAILED: " + (e?.message || "unknown") };
  }
}

export async function toggleVideoVisibility(id: string, visible: boolean): Promise<PortfolioActionResponse> {
  return updateVideo(id, { visible });
}

export async function deleteVideo(id: string): Promise<PortfolioActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);

    if (error) {
      return { ok: false, error: "SUPABASE_WRITE_FAILED: " + error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: id };
  } catch (e: any) {
    console.error("[DELETE VIDEO ERROR]", e?.message);
    return { ok: false, error: "SUPABASE_WRITE_FAILED: " + (e?.message || "unknown") };
  }
}
