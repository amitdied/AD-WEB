"use server";

import fs from "fs";
import path from "path";
import { beats as defaultBeats } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { verifyGoogleAdmin } from "@/lib/google-auth";
import {
  getAllBeatsFromSheet,
  saveBeatToSheet,
  deleteBeatFromSheet,
  deleteFileFromDrive,
  ensureBeatsSheetInitialized,
  BeatRecord,
} from "@/lib/google-workspace";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { beats: [], videos: [], deletedIds: [], _isInitialized: false };
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch {
    return { beats: [], videos: [], deletedIds: [], _isInitialized: false };
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
    console.error("Failed to write local DB:", error);
  }
}

export async function checkGoogleWorkspaceConnection() {
  try {
    const admin = await verifyGoogleAdmin();
    const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
    const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
    const hasSheetId = Boolean(process.env.GOOGLE_SHEET_ID);
    const hasAudioFolder = Boolean(process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID);
    const hasCoversFolder = Boolean(process.env.GOOGLE_DRIVE_COVERS_FOLDER_ID);

    const missing: string[] = [];
    if (!hasClientId) missing.push("GOOGLE_CLIENT_ID");
    if (!hasClientSecret) missing.push("GOOGLE_CLIENT_SECRET");
    if (!hasSheetId) missing.push("GOOGLE_SHEET_ID");
    if (!hasAudioFolder) missing.push("GOOGLE_DRIVE_AUDIO_FOLDER_ID");
    if (!hasCoversFolder) missing.push("GOOGLE_DRIVE_COVERS_FOLDER_ID");

    let sheetStatus = "Pending setup";
    if (hasSheetId && admin.method === "google_oauth") {
      try {
        await ensureBeatsSheetInitialized();
        sheetStatus = "Connected & Active";
      } catch (sheetErr: any) {
        sheetStatus = `Sheet Error: ${sheetErr.message}`;
      }
    }

    return {
      authenticated: true,
      adminEmail: admin.email,
      adminName: admin.name,
      adminPicture: admin.picture,
      loginMethod: admin.method,
      missingVariables: missing,
      isFullyConfigured: missing.length === 0,
      sheetStatus,
      message:
        missing.length === 0
          ? "Google Drive and Google Sheets backend are fully connected."
          : `Connected via ${admin.method}. Missing variables: [${missing.join(", ")}].`,
    };
  } catch (err: any) {
    return {
      authenticated: false,
      adminEmail: null,
      message: err?.message || "Not authenticated",
      missingVariables: [],
      isFullyConfigured: false,
    };
  }
}

export async function getAllAdminBeats() {
  await verifyGoogleAdmin();

  // Try Google Sheets first
  try {
    const sheetBeats = await getAllBeatsFromSheet();
    if (Array.isArray(sheetBeats) && sheetBeats.length > 0) {
      return sheetBeats.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        bpm: b.bpm,
        genre: b.genre,
        mood: b.mood,
        moodTags: b.tags.length > 0 ? b.tags : [b.mood],
        tags: b.tags,
        price: b.price,
        currency: b.currency,
        coverUrl: b.coverFileId ? `/api/media/${b.coverFileId}` : "/placeholder-cover.png",
        audioUrl: b.audioFileId ? `/api/media/${b.audioFileId}` : "",
        audioFileId: b.audioFileId,
        coverFileId: b.coverFileId,
        description: b.description,
        isPublished: b.isPublished,
        isFeatured: b.isFeatured,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));
    }
  } catch (err) {
    console.warn("Failed to load admin beats from Google Sheets:", err);
  }

  // Local fallback
  const db = readDb();
  if (Array.isArray(db.beats) && db.beats.length > 0) {
    return db.beats.map((b: any) => ({
      ...b,
      isPublished: b.isPublished !== false,
      isFeatured: Boolean(b.isFeatured),
    }));
  }

  return defaultBeats.map((b: any) => ({
    ...b,
    isPublished: true,
    isFeatured: false,
  }));
}

export async function togglePublishBeat(id: string, isPublished: boolean) {
  await verifyGoogleAdmin();

  try {
    const sheetBeats = await getAllBeatsFromSheet();
    const target = sheetBeats.find((b) => b.id === id);
    if (target) {
      target.isPublished = isPublished;
      await saveBeatToSheet(target);
    }
  } catch (err) {
    console.warn("Failed to toggle publish in Sheets:", err);
  }

  const db = readDb();
  if (db.beats) {
    const item = db.beats.find((b: any) => b.id === id);
    if (item) {
      item.isPublished = isPublished;
      writeDb(db);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/beats");
  revalidatePath("/api/beats");
  return { success: true };
}

export async function toggleFeaturedBeat(id: string, isFeatured: boolean) {
  await verifyGoogleAdmin();

  try {
    const sheetBeats = await getAllBeatsFromSheet();
    const target = sheetBeats.find((b) => b.id === id);
    if (target) {
      target.isFeatured = isFeatured;
      await saveBeatToSheet(target);
    }
  } catch (err) {
    console.warn("Failed to toggle featured in Sheets:", err);
  }

  const db = readDb();
  if (db.beats) {
    const item = db.beats.find((b: any) => b.id === id);
    if (item) {
      item.isFeatured = isFeatured;
      writeDb(db);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/beats");
  revalidatePath("/api/beats");
  return { success: true };
}

export async function deleteBeat(id: string) {
  await verifyGoogleAdmin();

  // 1. Delete from Google Drive and Google Sheets
  try {
    const sheetBeats = await getAllBeatsFromSheet();
    const target = sheetBeats.find((b) => b.id === id);
    if (target) {
      if (target.audioFileId) {
        await deleteFileFromDrive(target.audioFileId);
      }
      if (target.coverFileId) {
        await deleteFileFromDrive(target.coverFileId);
      }
      await deleteBeatFromSheet(id);
    }
  } catch (err) {
    console.warn("Failed to delete beat from Google Workspace:", err);
  }

  // 2. Also clean local db fallback
  const db = readDb();
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) {
    db.deletedIds.push(id);
  }
  if (db.beats) {
    db.beats = db.beats.filter((b: any) => b.id !== id);
  }
  writeDb(db);

  revalidatePath("/");
  revalidatePath("/admin/beats");
  revalidatePath("/api/beats");
  return { success: true };
}
