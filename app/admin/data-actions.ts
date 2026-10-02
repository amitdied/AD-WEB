"use server";

import fs from "fs";
import path from "path";
import { beats, YOUTUBE_LINKS, INSTAGRAM_TRANSMISSIONS } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { uploadToGoogleDrive, DriveFolderType } from "@/lib/google/drive";
import {
  readBeatsFromSheet,
  writeAllBeatsToSheet,
  readPortfolioFromSheet,
  writeAllPortfolioToSheet,
  readCctvFromSheet,
  writeAllCctvToSheet,
} from "@/lib/google/sheets";
import { getStoredTokens } from "@/lib/google/auth";
import { getAdminSession } from "@/lib/auth";
import { GOOGLE_CONFIG } from "@/lib/google/config";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function formatSafeError(err: any): string {
  const msg = String(err?.message || err || "UNKNOWN_ERROR");

  // Check known clean codes
  if (msg.includes("DRIVE_AUTH_MISSING_REFRESH_TOKEN")) {
    return "DRIVE_AUTH_MISSING_REFRESH_TOKEN";
  }
  if (msg.includes("DRIVE_AUTH_FAILED")) {
    const errorPart = msg.split(":")[1]?.trim() || "unauthorized";
    return `DRIVE_AUTH_FAILED: ${errorPart}`;
  }
  if (msg.includes("DRIVE_UPLOAD_FAILED")) {
    const errorPart = msg.split(":")[1]?.trim() || "upload_failed";
    return `DRIVE_UPLOAD_FAILED: ${errorPart}`;
  }
  if (msg.includes("SHEETS_TAB_NOT_FOUND")) {
    const tab = msg.split(":")[1]?.trim() || "UNKNOWN";
    return `SHEETS_TAB_NOT_FOUND: ${tab}`;
  }
  if (msg.includes("MISSING_ENV:")) {
    const varName = msg.split(":")[1]?.trim() || "CONFIG";
    return `MISSING_ENV: ${varName}`;
  }
  if (msg.includes("FILE_TOO_LARGE")) {
    return msg;
  }

  // Fallbacks for status codes or keywords
  if (msg.includes("403")) return "DRIVE_UPLOAD_FAILED: status_403";
  if (msg.includes("401") || msg.includes("invalid_grant")) return "DRIVE_AUTH_FAILED: invalid_grant";
  if (msg.includes("invalid_client")) return "DRIVE_AUTH_FAILED: invalid_client";
  if (msg.includes("BEATS")) return "SHEETS_TAB_NOT_FOUND: BEATS";
  if (msg.includes("PORTFOLIO")) return "SHEETS_TAB_NOT_FOUND: PORTFOLIO";
  if (msg.includes("CCTV")) return "SHEETS_TAB_NOT_FOUND: CCTV";

  return `ACTION_FAILED: ${msg.replace(/[^a-zA-Z0-9_:-]/g, "_").slice(0, 40)}`;
}

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return {
      beats: [],
      videos: [],
      instagramTransmissions: [],
      deletedIds: [],
      _isInitialized: false,
    };
  }
  const data = fs.readFileSync(DB_PATH, "utf8");
  try {
    const parsed = JSON.parse(data);
    return parsed;
  } catch (e) {
    return {
      beats: [],
      videos: [],
      instagramTransmissions: [],
      deletedIds: [],
      _isInitialized: false,
    };
  }
}

function writeDb(data: any) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write DB:", error);
  }
}

export async function checkDbStatus() {
  const db = readDb();
  return db._isInitialized === true;
}

export async function initializeDb() {
  const session = await getAdminSession();
  if (!session || !session.isAuthenticated) {
    throw new Error("UNAUTHORIZED: Admin session required");
  }

  let db = readDb();
  if (!fs.existsSync(DB_PATH)) {
    db = {
      beats: [],
      videos: [],
      instagramTransmissions: [],
      deletedIds: [],
      _isInitialized: true,
    };
  }

  db._isInitialized = true;
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.beats) db.beats = [];
  if (!db.videos) db.videos = [];
  if (!db.instagramTransmissions) db.instagramTransmissions = [];

  // Seed missing beats
  for (const b of beats) {
    if (
      !db.beats.find((x: any) => x.id === b.id) &&
      !db.deletedIds.includes(b.id)
    ) {
      db.beats.push(b);
    }
  }

  // Seed missing videos
  for (const url of YOUTUBE_LINKS) {
    const videoId = url.split("v=")[1]?.split("&")[0] || url;
    if (
      !db.videos.find((x: any) => x.id === videoId || x.url === url) &&
      !db.deletedIds.includes(videoId)
    ) {
      db.videos.push({ id: videoId, url, title: "Archive Video" });
    }
  }

  // Seed missing transmissions
  for (const tx of INSTAGRAM_TRANSMISSIONS) {
    if (
      !db.instagramTransmissions.find((x: any) => x.id === tx.id) &&
      !db.deletedIds.includes(tx.id)
    ) {
      db.instagramTransmissions.push(tx);
    }
  }

  writeDb(db);

  // Attempt initial sync to Google Sheet if Google OAuth is ready
  try {
    const tokens = getStoredTokens();
    if (tokens?.access_token) {
      await writeAllBeatsToSheet(db.beats);
      await writeAllPortfolioToSheet(db.videos);
      await writeAllCctvToSheet(db.instagramTransmissions);
    }
  } catch (err) {
    console.warn("Could not sync to Google Sheet during initializeDb:", err);
  }

  return db;
}

export type UploadResponse =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload a file to Google Drive with automatic folder routing.
 * Returns { ok: true, url } or { ok: false, error: "SHORT_SAFE_CODE: detail" }
 */
export async function uploadFile(
  formData: FormData,
  folderTypeOverride?: DriveFolderType
): Promise<UploadResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { ok: false, error: "MISSING_FILE: No file provided" };
    }

    // Limit check (e.g. 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = Math.round(file.size / (1024 * 1024));
      console.error(`[UPLOAD ERROR] File too large: ${file.name} (${sizeMb}MB)`);
      return { ok: false, error: `FILE_TOO_LARGE: ${sizeMb}MB exceeds limit` };
    }

    const explicitType = (formData.get("folderType") as DriveFolderType) || folderTypeOverride;

    let folderType: DriveFolderType = "covers";
    if (explicitType) {
      folderType = explicitType;
    } else if (
      file.type.startsWith("audio/") ||
      file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)
    ) {
      folderType = "audio";
    } else if (
      file.type.startsWith("video/") ||
      file.name.match(/\.(mp4|mov|webm|avi)$/i)
    ) {
      folderType = "media";
    } else {
      folderType = "covers";
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadToGoogleDrive(
      buffer,
      file.name,
      file.type || "application/octet-stream",
      folderType
    );

    return { ok: true, url: result.url };
  } catch (err: any) {
    const safeError = formatSafeError(err);
    console.error("[UPLOAD ACTION ERROR]", safeError, err?.message);
    return { ok: false, error: safeError };
  }
}

// ==========================================
// GOOGLE WORKSPACE STATUS & SYNC ACTIONS
// ==========================================

export async function getGoogleStatus() {
  const session = await getAdminSession();
  const tokens = getStoredTokens();

  return {
    isAuthenticated: Boolean(session?.isAuthenticated),
    adminEmail: GOOGLE_CONFIG.ADMIN_EMAIL,
    currentEmail: session?.email || null,
    hasGoogleTokens: Boolean(tokens?.access_token),
    hasRefreshToken: Boolean(tokens?.refresh_token),
    sheetId: GOOGLE_CONFIG.SHEET_ID,
    driveAudioFolderId: GOOGLE_CONFIG.DRIVE_AUDIO_FOLDER_ID,
    driveCoversFolderId: GOOGLE_CONFIG.DRIVE_COVERS_FOLDER_ID,
    driveMediaFolderId: GOOGLE_CONFIG.DRIVE_MEDIA_FOLDER_ID,
    redirectUri: GOOGLE_CONFIG.REDIRECT_URI,
    lastTokenUpdate: tokens?.updated_at || null,
  };
}

export type SyncResponse =
  | { ok: true; message: string; beatsCount: number; videosCount: number; cctvCount: number }
  | { ok: false; error: string };

export async function syncWithGoogleSheet(): Promise<SyncResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const db = readDb();
    let syncedFromSheet = false;

    // 1. Try reading from Google Sheet
    const sheetBeats = await readBeatsFromSheet();
    const sheetVideos = await readPortfolioFromSheet();
    const sheetCctv = await readCctvFromSheet();

    let updated = false;

    if (Array.isArray(sheetBeats) && sheetBeats.length > 0) {
      db.beats = sheetBeats;
      updated = true;
      syncedFromSheet = true;
    } else if (Array.isArray(db.beats) && db.beats.length > 0) {
      await writeAllBeatsToSheet(db.beats);
    }

    if (Array.isArray(sheetVideos) && sheetVideos.length > 0) {
      db.videos = sheetVideos;
      updated = true;
      syncedFromSheet = true;
    } else if (Array.isArray(db.videos) && db.videos.length > 0) {
      await writeAllPortfolioToSheet(db.videos);
    }

    if (Array.isArray(sheetCctv) && sheetCctv.length > 0) {
      db.instagramTransmissions = sheetCctv;
      updated = true;
      syncedFromSheet = true;
    } else if (Array.isArray(db.instagramTransmissions) && db.instagramTransmissions.length > 0) {
      await writeAllCctvToSheet(db.instagramTransmissions);
    }

    if (updated) {
      writeDb(db);
    }

    revalidatePath("/");
    revalidatePath("/admin");

    return {
      ok: true,
      message: syncedFromSheet
        ? "Successfully synced latest data from Google Sheet!"
        : "Google Sheet was empty; successfully pushed current data to Google Sheet!",
      beatsCount: db.beats.length,
      videosCount: db.videos.length,
      cctvCount: (db.instagramTransmissions || []).length,
    };
  } catch (error: any) {
    const safeError = formatSafeError(error);
    console.error("[SYNC SHEET ERROR]", safeError, error?.message);
    return { ok: false, error: safeError };
  }
}

// ==========================================
// BEATS MANAGEMENT
// ==========================================

export async function getCustomBeats() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("beats")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id || '',
        title: row.title || '',
        producer: row.producer || 'AMITDIED',
        bpm: typeof row.bpm === 'number' ? row.bpm : (parseFloat(String(row.bpm)) || 120),
        key: row.key || '',
        genre: row.genre || '',
        price: typeof row.price === 'number' ? row.price : (parseFloat(String(row.price)) || 0),
        buyLink: row.buy_link || row.buyLink || '',
        description: row.description || '',
        coverUrl: row.cover_url || row.coverUrl || '',
        audioUrl: row.audio_url || row.audioUrl || '',
        audioStoragePath: row.audio_storage_path || row.audioStoragePath || '',
        coverStoragePath: row.cover_storage_path || row.coverStoragePath || '',
        storageProvider: row.storage_provider || row.storageProvider || 'drive',
        moodTags: Array.isArray(row.mood_tags) ? row.mood_tags : (Array.isArray(row.moodTags) ? row.moodTags : []),
      }));
    }
  } catch (e) {
    console.warn("Could not read beats from Supabase, using local DB:", e);
  }

  const localDb = readDb();
  return localDb.beats || [];
}

export type ActionResponse<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function addBeat(beat: any): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const safeCoverUrl =
      typeof beat.coverUrl === "string" && beat.coverUrl.trim() !== ""
        ? beat.coverUrl
        : "/placeholder-cover.png";
    const safeAudioUrl = typeof beat.audioUrl === "string" ? beat.audioUrl : "";

    const exactPrice =
      typeof beat.price === "number"
        ? beat.price
        : !isNaN(parseFloat(String(beat.price)))
          ? parseFloat(String(beat.price))
          : 0;

    const newBeatId = "custom-" + Date.now().toString();
    const moodTags =
      typeof beat.moodTags === "string"
        ? beat.moodTags.split(",").map((t: string) => t.trim())
        : Array.isArray(beat.moodTags)
          ? beat.moodTags.map(String)
          : [];

    const newBeat: any = {
      id: newBeatId,
      title: String(beat.title || "Untitled"),
      producer: String(beat.producer || "AMITDIED"),
      bpm: Number(beat.bpm) || 120,
      key: String(beat.key || ""),
      genre: String(beat.genre || ""),
      price: exactPrice,
      buyLink: String(beat.buyLink || ""),
      description: String(beat.description || ""),
      coverUrl: safeCoverUrl,
      audioUrl: safeAudioUrl,
      moodTags,
      audioStoragePath: beat.audioStoragePath ? String(beat.audioStoragePath) : "",
      coverStoragePath: beat.coverStoragePath ? String(beat.coverStoragePath) : "",
      storageProvider: beat.storageProvider ? String(beat.storageProvider) : "drive",
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("beats").insert({
      id: newBeat.id,
      title: newBeat.title,
      producer: newBeat.producer,
      bpm: newBeat.bpm,
      key: newBeat.key,
      genre: newBeat.genre,
      price: newBeat.price,
      buy_link: newBeat.buyLink,
      description: newBeat.description,
      cover_url: newBeat.coverUrl,
      audio_url: newBeat.audioUrl,
      mood_tags: newBeat.moodTags,
      audio_storage_path: newBeat.audioStoragePath,
      cover_storage_path: newBeat.coverStoragePath,
      storage_provider: newBeat.storageProvider,
      created_at: newBeat.createdAt,
    });

    if (error) {
      return { ok: false, error: "SUPABASE_WRITE_FAILED: " + error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: newBeat };
  } catch (error: any) {
    console.error("[ADD BEAT ERROR]", error);
    return {
      ok: false,
      error: "SUPABASE_WRITE_FAILED: " + (error?.message || "unknown"),
    };
  }
}

export async function updateBeat(id: string, updatedData: any): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const supabase = getSupabaseAdmin();
    const { data: existingRows, error: fetchError } = await supabase
      .from("beats")
      .select("*")
      .eq("id", id);

    if (fetchError || !existingRows || existingRows.length === 0) {
      return { ok: false, error: "BEAT_NOT_FOUND" };
    }

    const currentBeat = existingRows[0];
    const currentCoverUrl = currentBeat.cover_url || currentBeat.coverUrl || "/placeholder-cover.png";
    const currentAudioUrl = currentBeat.audio_url || currentBeat.audioUrl || "";
    const currentPrice = currentBeat.price || 0;

    const safeCoverUrl =
      typeof updatedData.coverUrl === "string" && updatedData.coverUrl.trim() !== ""
        ? updatedData.coverUrl
        : currentCoverUrl;
    const safeAudioUrl =
      typeof updatedData.audioUrl === "string"
        ? updatedData.audioUrl
        : currentAudioUrl;

    const exactUpdatedPrice =
      updatedData.price !== undefined
        ? (typeof updatedData.price === "number" ? updatedData.price : (parseFloat(String(updatedData.price)) || 0))
        : currentPrice;

    const updatedMoodTags =
      typeof updatedData.moodTags === "string"
        ? updatedData.moodTags.split(",").map((t: string) => t.trim())
        : Array.isArray(updatedData.moodTags)
          ? updatedData.moodTags.map(String)
          : (currentBeat.mood_tags || currentBeat.moodTags || []);

    const updatedBeat: any = {
      id: id,
      title: updatedData.title !== undefined ? String(updatedData.title) : (currentBeat.title || "Untitled"),
      producer: updatedData.producer !== undefined ? String(updatedData.producer) : (currentBeat.producer || "AMITDIED"),
      bpm: updatedData.bpm !== undefined ? Number(updatedData.bpm) : (currentBeat.bpm || 120),
      key: updatedData.key !== undefined ? String(updatedData.key) : (currentBeat.key || ""),
      genre: updatedData.genre !== undefined ? String(updatedData.genre) : (currentBeat.genre || ""),
      price: exactUpdatedPrice,
      buyLink: updatedData.buyLink !== undefined ? String(updatedData.buyLink) : (currentBeat.buy_link || currentBeat.buyLink || ""),
      description: updatedData.description !== undefined ? String(updatedData.description) : (currentBeat.description || ""),
      coverUrl: safeCoverUrl,
      audioUrl: safeAudioUrl,
      audioStoragePath: updatedData.audioStoragePath || currentBeat.audio_storage_path || currentBeat.audioStoragePath || "",
      coverStoragePath: updatedData.coverStoragePath || currentBeat.cover_storage_path || currentBeat.coverStoragePath || "",
      storageProvider: updatedData.storageProvider || currentBeat.storage_provider || currentBeat.storageProvider || "drive",
      moodTags: updatedMoodTags,
    };

    const { error: updateError } = await supabase
      .from("beats")
      .update({
        title: updatedBeat.title,
        producer: updatedBeat.producer,
        bpm: updatedBeat.bpm,
        key: updatedBeat.key,
        genre: updatedBeat.genre,
        price: updatedBeat.price,
        buy_link: updatedBeat.buyLink,
        description: updatedBeat.description,
        cover_url: updatedBeat.coverUrl,
        audio_url: updatedBeat.audioUrl,
        mood_tags: updatedBeat.moodTags,
        audio_storage_path: updatedBeat.audioStoragePath,
        cover_storage_path: updatedBeat.coverStoragePath,
        storage_provider: updatedBeat.storageProvider,
      })
      .eq("id", id);

    if (updateError) {
      return { ok: false, error: "SUPABASE_WRITE_FAILED: " + updateError.message };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: updatedBeat };
  } catch (error: any) {
    console.error("[UPDATE BEAT ERROR]", error);
    return {
      ok: false,
      error: "SUPABASE_WRITE_FAILED: " + (error?.message || "unknown"),
    };
  }
}

export async function deleteBeat(id: string): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("beats")
      .delete()
      .eq("id", id);

    if (error) {
      return { ok: false, error: "SUPABASE_WRITE_FAILED: " + error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: id };
  } catch (error: any) {
    console.error("[DELETE BEAT ERROR]", error);
    return {
      ok: false,
      error: "SUPABASE_WRITE_FAILED: " + (error?.message || "unknown"),
    };
  }
}

// ==========================================
// PORTFOLIO / VIDEOS MANAGEMENT (SUPABASE portfolio_items)
// ==========================================

function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  const match = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (match?.[1]) return match[1];
  if (/^[\w-]{11}$/.test(clean)) return clean;
  return null;
}

export interface PortfolioVideoItem {
  id: string;
  title: string;
  url: string;
  description: string;
  order_index: number;
  visible: boolean;
  created_at?: string;
  // helpers for UI
  youtubeId?: string;
  youtubeUrl?: string;
  thumbnail?: string;
}

function mapRow(row: any): PortfolioVideoItem {
  const ytId = extractYouTubeId(row.url) || row.id;
  return {
    id: row.id,
    title: row.title || "",
    url: row.url || "",
    description: row.description || "",
    order_index: typeof row.order_index === "number" ? row.order_index : 0,
    visible: row.visible !== false,
    created_at: row.created_at || undefined,
    youtubeId: ytId,
    youtubeUrl: row.url || `https://www.youtube.com/watch?v=${ytId}`,
    thumbnail: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
  };
}

export async function getCustomVideos(
  includeHidden = true
): Promise<PortfolioVideoItem[]> {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("portfolio_items")
      .select("*")
      .order("order_index", { ascending: true });

    if (!includeHidden) {
      query = query.eq("visible", true);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[getCustomVideos] Supabase error:", error.message);
      return [];
    }
    return (data || []).map(mapRow);
  } catch (e: any) {
    console.error("[getCustomVideos] Failed:", e?.message || e);
    return [];
  }
}

export async function addVideo(videoData: {
  url: string;
  title?: string;
  description?: string;
}): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const ytId = extractYouTubeId(videoData.url);
    if (!ytId) {
      return {
        ok: false,
        error:
          "INVALID_URL: Please enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)",
      };
    }

    const supabase = getSupabaseAdmin();
    const standardUrl = `https://www.youtube.com/watch?v=${ytId}`;

    // Prevent duplicate URL
    const { data: existing } = await supabase
      .from("portfolio_items")
      .select("id")
      .eq("url", standardUrl)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: "DUPLICATE_VIDEO: This YouTube video is already in your portfolio.",
      };
    }

    // Next yt-N id
    const { data: allRows } = await supabase
      .from("portfolio_items")
      .select("id, order_index");

    let nextNum = 1;
    let maxOrder = 0;
    if (Array.isArray(allRows)) {
      for (const row of allRows) {
        const m = String(row.id).match(/^yt-(\d+)$/);
        if (m) nextNum = Math.max(nextNum, parseInt(m[1], 10) + 1);
        if (typeof row.order_index === "number") {
          maxOrder = Math.max(maxOrder, row.order_index);
        }
      }
    }

    const newId = `yt-${nextNum}`;
    const insertPayload = {
      id: newId,
      title: videoData.title?.trim() || "",
      url: standardUrl,
      description: videoData.description?.trim() || "",
      order_index: maxOrder + 1,
      visible: true,
    };

    const { data, error } = await supabase
      .from("portfolio_items")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return { ok: false, error: `ADD_FAILED: ${error.message}` };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: mapRow(data) };
  } catch (e: any) {
    const safeError = formatSafeError(e);
    console.error("[ADD VIDEO ERROR]", safeError, e?.message);
    return { ok: false, error: safeError };
  }
}

export async function updateVideo(
  id: string,
  updatedData: {
    url?: string;
    title?: string;
    description?: string;
    visible?: boolean;
    order_index?: number;
  }
): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const supabase = getSupabaseAdmin();
    const patch: Record<string, any> = {};

    if (typeof updatedData.title === "string") patch.title = updatedData.title.trim();
    if (typeof updatedData.description === "string")
      patch.description = updatedData.description.trim();
    if (typeof updatedData.visible === "boolean") patch.visible = updatedData.visible;
    if (typeof updatedData.order_index === "number")
      patch.order_index = updatedData.order_index;

    if (typeof updatedData.url === "string" && updatedData.url.trim()) {
      const ytId = extractYouTubeId(updatedData.url);
      if (!ytId) {
        return { ok: false, error: "INVALID_URL: Invalid YouTube URL" };
      }
      patch.url = `https://www.youtube.com/watch?v=${ytId}`;
    }

    if (Object.keys(patch).length === 0) {
      return { ok: false, error: "NO_CHANGES: Nothing to update" };
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { ok: false, error: `UPDATE_FAILED: ${error.message}` };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: mapRow(data) };
  } catch (e: any) {
    const safeError = formatSafeError(e);
    console.error("[UPDATE VIDEO ERROR]", safeError, e?.message);
    return { ok: false, error: safeError };
  }
}

export async function toggleVideoVisibility(
  id: string,
  visible: boolean
): Promise<ActionResponse> {
  return updateVideo(id, { visible });
}

export async function deleteVideo(id: string): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);

    if (error) {
      return { ok: false, error: `DELETE_FAILED: ${error.message}` };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: id };
  } catch (e: any) {
    const safeError = formatSafeError(e);
    console.error("[DELETE VIDEO ERROR]", safeError, e?.message);
    return { ok: false, error: safeError };
  }
}

// ==========================================
// CCTV / INSTAGRAM TRANSMISSIONS MANAGEMENT
// ==========================================

export async function getCustomTransmissions() {
  const db = readDb();

  try {
    const tokens = getStoredTokens();
    if (tokens?.access_token) {
      const sheetCctv = await readCctvFromSheet();
      if (Array.isArray(sheetCctv) && sheetCctv.length > 0) {
        db.instagramTransmissions = sheetCctv;
        writeDb(db);
        return sheetCctv;
      }
    }
  } catch (e) {
    console.warn("Could not read transmissions from Google Sheet:", e);
  }

  if (Array.isArray(db.instagramTransmissions) && db.instagramTransmissions.length > 0) {
    return db.instagramTransmissions;
  }
  return INSTAGRAM_TRANSMISSIONS;
}

export async function addTransmission(data: any): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const db = readDb();
    if (!Array.isArray(db.instagramTransmissions)) {
      db.instagramTransmissions = [...INSTAGRAM_TRANSMISSIONS];
    }
    const newTx = {
      id: "tx-" + Date.now().toString(),
      camCode: String(data.camCode || "CAM-" + Math.floor(Math.random() * 90 + 10) + " // FEED"),
      category: data.category || "cookup",
      caption: String(data.caption || ""),
      timestamp: "Just now",
      likes: Number(data.likes) || 100,
      comments: Number(data.comments) || 12,
      postUrl: String(data.postUrl || "https://www.instagram.com/amitdied/"),
      imageUrl: String(
        data.imageUrl ||
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop"
      ),
      videoSnippetTitle: data.videoSnippetTitle
        ? String(data.videoSnippetTitle)
        : "TRANSMISSION_RAW.WAV",
      tags: Array.isArray(data.tags) ? data.tags : ["#amitdied", "#darktrap"],
    };
    db.instagramTransmissions.unshift(newTx);
    writeDb(db);

    // Sync to Google Sheet CCTV tab
    await writeAllCctvToSheet(db.instagramTransmissions);

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: newTx };
  } catch (e: any) {
    const safeError = formatSafeError(e);
    console.error("[ADD TRANSMISSION ERROR]", safeError, e?.message);
    return { ok: false, error: safeError };
  }
}

export async function deleteTransmission(id: string): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const db = readDb();
    if (Array.isArray(db.instagramTransmissions)) {
      db.instagramTransmissions = db.instagramTransmissions.filter(
        (t: any) => t.id !== id
      );
      writeDb(db);

      // Sync to Google Sheet CCTV tab
      await writeAllCctvToSheet(db.instagramTransmissions);
    }
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: id };
  } catch (e: any) {
    const safeError = formatSafeError(e);
    console.error("[DELETE TRANSMISSION ERROR]", safeError, e?.message);
    return { ok: false, error: safeError };
  }
}
