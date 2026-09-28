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
import { getAdminSession, getStoredTokens } from "@/lib/google/auth";
import { GOOGLE_CONFIG } from "@/lib/google/config";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

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

/**
 * Upload a file to Google Drive with automatic folder routing:
 * - AUDIO folder (1E3no0R-HSGpK_ihIaDMzLutTs3HwD02s) for audio
 * - COVERS folder (1b1T6joDt1c9wxhexUc31n1YI_DdebzOm) for covers
 * - MEDIA folder (1kaDYyeycE7jQkOjIV9xHQJaTCLWpXzqT) for CCTV/media
 */
export async function uploadFile(
  formData: FormData,
  folderTypeOverride?: DriveFolderType
) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

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

  return result.url;
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

export async function syncWithGoogleSheet() {
  const tokens = getStoredTokens();
  if (!tokens?.access_token) {
    throw new Error("Google OAuth not connected. Please log in with AMITDIED69@gmail.com first.");
  }

  const db = readDb();
  let syncedFromSheet = false;

  try {
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
      // Sheet is empty, push DB beats to sheet
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
      success: true,
      message: syncedFromSheet
        ? "Successfully synced latest data from Google Sheet!"
        : "Google Sheet was empty; successfully pushed current data to Google Sheet!",
      beatsCount: db.beats.length,
      videosCount: db.videos.length,
      cctvCount: (db.instagramTransmissions || []).length,
    };
  } catch (error: any) {
    console.error("Failed to sync with Google Sheet:", error);
    throw new Error(error.message || "Failed to sync with Google Sheet");
  }
}

// ==========================================
// BEATS MANAGEMENT
// ==========================================

export async function getCustomBeats() {
  const db = readDb();

  // If tokens exist, attempt to fetch fresh from Google Sheet in background
  try {
    const tokens = getStoredTokens();
    if (tokens?.access_token) {
      const sheetBeats = await readBeatsFromSheet();
      if (Array.isArray(sheetBeats) && sheetBeats.length > 0) {
        db.beats = sheetBeats;
        writeDb(db);
        return sheetBeats;
      }
    }
  } catch (e) {
    console.warn("Could not read beats from Google Sheet, using local DB:", e);
  }

  return db.beats || [];
}

export async function addBeat(beat: any) {
  const db = readDb();

  const safeCoverUrl =
    typeof beat.coverUrl === "string" && beat.coverUrl.trim() !== ""
      ? beat.coverUrl
      : "/placeholder-cover.png";
  const safeAudioUrl = typeof beat.audioUrl === "string" ? beat.audioUrl : "";

  const newBeat = {
    id: "custom-" + Date.now().toString(),
    title: String(beat.title || "Untitled"),
    producer: String(beat.producer || "AMITDIED"),
    bpm: Number(beat.bpm) || 120,
    key: String(beat.key || ""),
    genre: String(beat.genre || ""),
    price: Number(beat.price) || 0,
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

  db.beats.push(newBeat);
  writeDb(db);

  // Sync with Google Sheet BEATS tab
  try {
    await writeAllBeatsToSheet(db.beats);
  } catch (e: any) {
    console.error("Failed to sync new beat to Google Sheet:", e);
    throw new Error(e?.message || "SHEETS_SYNC_FAILED");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return newBeat;
}

export async function updateBeat(id: string, updatedData: any) {
  const db = readDb();
  const index = (db.beats || []).findIndex((b: any) => b.id === id);
  if (index === -1) {
    throw new Error("Beat not found");
  }

  const currentBeat = db.beats[index];
  const safeCoverUrl =
    typeof updatedData.coverUrl === "string" && updatedData.coverUrl.trim() !== ""
      ? updatedData.coverUrl
      : currentBeat.coverUrl || "/placeholder-cover.png";
  const safeAudioUrl =
    typeof updatedData.audioUrl === "string"
      ? updatedData.audioUrl
      : currentBeat.audioUrl || "";

  const updatedBeat = {
    ...currentBeat,
    title: updatedData.title !== undefined ? String(updatedData.title) : currentBeat.title,
    producer: updatedData.producer !== undefined ? String(updatedData.producer) : currentBeat.producer,
    bpm: updatedData.bpm !== undefined ? Number(updatedData.bpm) : currentBeat.bpm,
    key: updatedData.key !== undefined ? String(updatedData.key) : currentBeat.key,
    genre: updatedData.genre !== undefined ? String(updatedData.genre) : currentBeat.genre,
    price: updatedData.price !== undefined ? Number(updatedData.price) : currentBeat.price,
    buyLink: updatedData.buyLink !== undefined ? String(updatedData.buyLink) : currentBeat.buyLink,
    description: updatedData.description !== undefined ? String(updatedData.description) : currentBeat.description,
    coverUrl: safeCoverUrl,
    audioUrl: safeAudioUrl,
    moodTags:
      typeof updatedData.moodTags === "string"
        ? updatedData.moodTags.split(",").map((t: string) => t.trim())
        : Array.isArray(updatedData.moodTags)
          ? updatedData.moodTags.map(String)
          : currentBeat.moodTags || [],
  };

  db.beats[index] = updatedBeat;
  writeDb(db);

  // Sync to Google Sheet BEATS tab
  try {
    await writeAllBeatsToSheet(db.beats);
  } catch (e: any) {
    console.error("Failed to sync updated beat to Google Sheet:", e);
    throw new Error(e?.message || "SHEETS_SYNC_FAILED");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return updatedBeat;
}

export async function deleteBeat(id: string) {
  const db = readDb();
  db.beats = db.beats.filter((b: any) => b.id !== id);
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) db.deletedIds.push(id);
  writeDb(db);

  // Sync to Google Sheet BEATS tab
  try {
    await writeAllBeatsToSheet(db.beats);
  } catch (e) {
    console.warn("Failed to sync beat deletion to Google Sheet:", e);
  }

  revalidatePath("/");
  revalidatePath("/admin");
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

export async function addVideo(videoData: any) {
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
  try {
    await writeAllPortfolioToSheet(db.videos);
  } catch (e) {
    console.warn("Failed to sync new video to Google Sheet:", e);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return newVideo;
}

export async function updateVideo(id: string, updatedData: any) {
  const db = readDb();
  const index = (db.videos || []).findIndex((v: any) => v.id === id);
  if (index === -1) {
    throw new Error("Video not found");
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
  try {
    await writeAllPortfolioToSheet(db.videos);
  } catch (e) {
    console.warn("Failed to sync updated video to Google Sheet:", e);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return updatedVideo;
}

export async function deleteVideo(id: string) {
  const db = readDb();
  db.videos = db.videos.filter((v: any) => v.id !== id);
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) db.deletedIds.push(id);
  writeDb(db);

  // Sync to Google Sheet PORTFOLIO tab
  try {
    await writeAllPortfolioToSheet(db.videos);
  } catch (e) {
    console.warn("Failed to sync video deletion to Google Sheet:", e);
  }

  revalidatePath("/");
  revalidatePath("/admin");
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

export async function addTransmission(data: any) {
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
  try {
    await writeAllCctvToSheet(db.instagramTransmissions);
  } catch (e) {
    console.warn("Failed to sync new transmission to Google Sheet:", e);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return newTx;
}

export async function deleteTransmission(id: string) {
  const db = readDb();
  if (Array.isArray(db.instagramTransmissions)) {
    db.instagramTransmissions = db.instagramTransmissions.filter(
      (t: any) => t.id !== id
    );
    writeDb(db);

    // Sync to Google Sheet CCTV tab
    try {
      await writeAllCctvToSheet(db.instagramTransmissions);
    } catch (e) {
      console.warn("Failed to sync transmission deletion to Google Sheet:", e);
    }
  }
  revalidatePath("/");
  revalidatePath("/admin");
}
