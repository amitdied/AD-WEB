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
  doc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    const beatsRef = collection(db, "beats");
    const q = query(beatsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id || docSnap.id,
          title: data.title || "",
          producer: data.producer || "AMITDIED",
          bpm: data.bpm || 120,
          key: data.key || "",
          genre: data.genre || "",
          price: typeof data.price === "number" ? data.price : (parseFloat(String(data.price)) || 0),
          buyLink: data.buyLink || "",
          description: data.description || "",
          coverUrl: data.coverUrl || "",
          audioUrl: data.audioUrl || "",
          audioStoragePath: data.audioStoragePath || "",
          coverStoragePath: data.coverStoragePath || "",
          storageProvider: data.storageProvider || "drive",
          moodTags: Array.isArray(data.moodTags) ? data.moodTags : [],
        };
      });
    }
  } catch (e) {
    console.warn("Could not read beats from Firestore, using local DB:", e);
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

    const newBeat: any = {
      id: "custom-" + Date.now().toString(),
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
      moodTags:
        typeof beat.moodTags === "string"
          ? beat.moodTags.split(",").map((t: string) => t.trim())
          : Array.isArray(beat.moodTags)
            ? beat.moodTags.map(String)
            : [],
    };

    if (beat.audioStoragePath) newBeat.audioStoragePath = String(beat.audioStoragePath);
    if (beat.coverStoragePath) newBeat.coverStoragePath = String(beat.coverStoragePath);
    if (beat.storageProvider) newBeat.storageProvider = String(beat.storageProvider);
    if (beat.supabaseAudioBucket) newBeat.supabaseAudioBucket = String(beat.supabaseAudioBucket);
    if (beat.supabaseCoversBucket) newBeat.supabaseCoversBucket = String(beat.supabaseCoversBucket);

    const beatsRef = collection(db, "beats");
    await addDoc(beatsRef, {
      ...newBeat,
      createdAt: serverTimestamp(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: newBeat };
  } catch (error: any) {
    console.error("[ADD BEAT ERROR]", error);
    return {
      ok: false,
      error: "FIRESTORE_WRITE_FAILED: " + (error?.message || "unknown"),
    };
  }
}

export async function updateBeat(id: string, updatedData: any): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const beatsRef = collection(db, "beats");
    const q = query(beatsRef, where("id", "==", id));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { ok: false, error: "BEAT_NOT_FOUND" };
    }

    const docSnap = snapshot.docs[0];
    const currentBeat = docSnap.data();

    const safeCoverUrl =
      typeof updatedData.coverUrl === "string" && updatedData.coverUrl.trim() !== ""
        ? updatedData.coverUrl
        : currentBeat.coverUrl || "/placeholder-cover.png";
    const safeAudioUrl =
      typeof updatedData.audioUrl === "string"
        ? updatedData.audioUrl
        : currentBeat.audioUrl || "";

    const exactUpdatedPrice =
      updatedData.price !== undefined
        ? (typeof updatedData.price === "number" ? updatedData.price : (parseFloat(String(updatedData.price)) || 0))
        : (currentBeat.price || 0);

    const updatedBeat: any = {
      ...currentBeat,
      id: currentBeat.id || id,
      title: updatedData.title !== undefined ? String(updatedData.title) : (currentBeat.title || "Untitled"),
      producer: updatedData.producer !== undefined ? String(updatedData.producer) : (currentBeat.producer || "AMITDIED"),
      bpm: updatedData.bpm !== undefined ? Number(updatedData.bpm) : (currentBeat.bpm || 120),
      key: updatedData.key !== undefined ? String(updatedData.key) : (currentBeat.key || ""),
      genre: updatedData.genre !== undefined ? String(updatedData.genre) : (currentBeat.genre || ""),
      price: exactUpdatedPrice,
      buyLink: updatedData.buyLink !== undefined ? String(updatedData.buyLink) : (currentBeat.buyLink || ""),
      description: updatedData.description !== undefined ? String(updatedData.description) : (currentBeat.description || ""),
      coverUrl: safeCoverUrl,
      audioUrl: safeAudioUrl,
      audioStoragePath: updatedData.audioStoragePath || currentBeat.audioStoragePath || "",
      coverStoragePath: updatedData.coverStoragePath || currentBeat.coverStoragePath || "",
      storageProvider: updatedData.storageProvider || currentBeat.storageProvider || "drive",
      moodTags:
        typeof updatedData.moodTags === "string"
          ? updatedData.moodTags.split(",").map((t: string) => t.trim())
          : Array.isArray(updatedData.moodTags)
            ? updatedData.moodTags.map(String)
            : currentBeat.moodTags || [],
    };

    const { createdAt, ...fieldsToUpdate } = updatedBeat as any;
    await updateDoc(docSnap.ref, fieldsToUpdate);

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: updatedBeat };
  } catch (error: any) {
    console.error("[UPDATE BEAT ERROR]", error);
    return {
      ok: false,
      error: "FIRESTORE_WRITE_FAILED: " + (error?.message || "unknown"),
    };
  }
}

export async function deleteBeat(id: string): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const beatsRef = collection(db, "beats");
    const q = query(beatsRef, where("id", "==", id));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: id };
  } catch (error: any) {
    console.error("[DELETE BEAT ERROR]", error);
    return {
      ok: false,
      error: "FIRESTORE_WRITE_FAILED: " + (error?.message || "unknown"),
    };
  }
}

// ==========================================
// PORTFOLIO / VIDEOS MANAGEMENT
// ==========================================

export async function getCustomVideos() {
  const db = readDb();

  try {
    const tokens = getStoredTokens();
    if (tokens?.access_token) {
      const sheetVideos = await readPortfolioFromSheet();
      if (Array.isArray(sheetVideos) && sheetVideos.length > 0) {
        db.videos = sheetVideos;
        writeDb(db);
        return sheetVideos;
      }
    }
  } catch (e) {
    console.warn("Could not read videos from Google Sheet, using local DB:", e);
  }

  return db.videos || [];
}

export async function addVideo(videoData: any): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const db = readDb();
    const newVideo = {
      id: "custom-video-" + Date.now().toString(),
      title: String(videoData.title || ""),
      url: String(videoData.url || ""),
      description: String(videoData.description || ""),
    };
    db.videos.push(newVideo);
    writeDb(db);

    // Sync to Google Sheet PORTFOLIO tab
    await writeAllPortfolioToSheet(db.videos);

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: newVideo };
  } catch (e: any) {
    const safeError = formatSafeError(e);
    console.error("[ADD VIDEO ERROR]", safeError, e?.message);
    return { ok: false, error: safeError };
  }
}

export async function updateVideo(id: string, updatedData: any): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const db = readDb();
    const index = (db.videos || []).findIndex((v: any) => v.id === id);
    if (index === -1) {
      return { ok: false, error: "VIDEO_NOT_FOUND: Video ID not found" };
    }

    const currentVideo = db.videos[index];
    const updatedVideo = {
      ...currentVideo,
      title: updatedData.title !== undefined ? String(updatedData.title) : currentVideo.title,
      url: updatedData.url !== undefined ? String(updatedData.url) : currentVideo.url,
      description: updatedData.description !== undefined ? String(updatedData.description) : currentVideo.description,
    };

    db.videos[index] = updatedVideo;
    writeDb(db);

    // Sync to Google Sheet PORTFOLIO tab
    await writeAllPortfolioToSheet(db.videos);

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: updatedVideo };
  } catch (e: any) {
    const safeError = formatSafeError(e);
    console.error("[UPDATE VIDEO ERROR]", safeError, e?.message);
    return { ok: false, error: safeError };
  }
}

export async function deleteVideo(id: string): Promise<ActionResponse> {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return { ok: false, error: "UNAUTHORIZED: Admin session required" };
    }

    const db = readDb();
    db.videos = db.videos.filter((v: any) => v.id !== id);
    if (!db.deletedIds) db.deletedIds = [];
    if (!db.deletedIds.includes(id)) db.deletedIds.push(id);
    writeDb(db);

    // Sync to Google Sheet PORTFOLIO tab
    await writeAllPortfolioToSheet(db.videos);

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
