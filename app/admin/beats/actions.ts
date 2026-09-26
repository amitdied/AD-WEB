"use server";

import fs from "fs";
import path from "path";
import { beats as defaultBeats } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { cookies } from "next/headers";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Helper to verify admin authentication
async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "authenticated") {
    throw new Error("Unauthorized: Admin authentication required");
  }
}

// Local JSON DB helpers
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

export async function checkSupabaseConnection() {
  await verifyAdminAuth();
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return {
      connected: false,
      message: "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or ANON_KEY) are not set. Running in resilient local storage mode.",
    };
  }
  try {
    const { error } = await supabaseAdmin.from("beats").select("id").limit(1);
    if (error) {
      return {
        connected: false,
        message: `Connected to Supabase URL, but database table 'beats' returned: ${error.message}. Please run the schema SQL.`,
      };
    }
    return {
      connected: true,
      message: "Supabase database and storage connected successfully!",
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to query Supabase: ${err?.message || "Unknown error"}`,
    };
  }
}

export async function uploadBeatMedia(formData: FormData) {
  await verifyAdminAuth();
  const file = formData.get("file") as File;
  const type = (formData.get("type") as string) || "audio"; // "audio" or "cover"

  if (!file) throw new Error("No file uploaded");

  // Validate file types and size
  if (type === "audio") {
    const validAudioExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];
    const ext = path.extname(file.name).toLowerCase();
    if (!validAudioExtensions.includes(ext) && !file.type.startsWith("audio/")) {
      throw new Error(`Invalid audio format: ${file.name}. Allowed: MP3, WAV, M4A, FLAC`);
    }
    const maxAudioBytes = 150 * 1024 * 1024; // 150MB
    if (file.size > maxAudioBytes) {
      throw new Error("Audio file exceeds maximum allowed size (150MB)");
    }
  } else if (type === "cover") {
    const validImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = path.extname(file.name).toLowerCase();
    if (!validImageExtensions.includes(ext) && !file.type.startsWith("image/")) {
      throw new Error(`Invalid image format: ${file.name}. Allowed: JPG, PNG, WEBP`);
    }
    const maxImageBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxImageBytes) {
      throw new Error("Cover image exceeds maximum allowed size (25MB)");
    }
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uniqueFileName = `${Date.now()}-${safeName}`;

  // 1. Try Supabase Storage if configured
  if (isSupabaseConfigured && supabaseAdmin) {
    const bucketName = type === "audio" ? "audio-files" : "cover-images";
    try {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(uniqueFileName, buffer, {
          contentType: file.type || (type === "audio" ? "audio/mpeg" : "image/jpeg"),
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(uniqueFileName);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            storage: "supabase",
            fileName: uniqueFileName,
          };
        }
      } else if (uploadError) {
        console.warn(`Supabase Storage upload to '${bucketName}' failed:`, uploadError.message);
      }
    } catch (sErr) {
      console.warn("Supabase Storage upload threw exception, falling back to local:", sErr);
    }
  }

  // 2. Fallback to local uploads directory in public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, uniqueFileName);
  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${uniqueFileName}`,
    storage: "local",
    fileName: uniqueFileName,
  };
}

// Fetch all beats for the Admin Beats Manager (includes drafts and unpublished)
export async function getAllAdminBeats() {
  await verifyAdminAuth();

  // Try Supabase first
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("beats")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((b: any) => ({
          id: b.id,
          title: b.title,
          producer: b.producer || "AMITDIED",
          bpm: Number(b.bpm) || 120,
          key: b.key || "",
          genre: b.genre || "Trap",
          moodTags: Array.isArray(b.mood_tags)
            ? b.mood_tags
            : (b.moodTags || (b.mood ? [b.mood] : ["Dark"])),
          price: Number(b.price) || 29.99,
          coverUrl: b.cover_url || b.coverUrl || "/placeholder-cover.png",
          audioUrl: b.audio_url || b.audioUrl || "",
          buyLink: b.buy_link || b.buyLink || "",
          description: b.description || "",
          isPublished: b.is_published ?? true,
          isFeatured: b.is_featured ?? false,
          createdAt: b.created_at || new Date().toISOString(),
          updatedAt: b.updated_at,
        }));
      }
    } catch (err) {
      console.warn("Failed to load admin beats from Supabase:", err);
    }
  }

  // Local DB fallback
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

export async function saveBeat(beatData: any) {
  await verifyAdminAuth();

  const id = beatData.id || `beat-${Date.now()}`;
  const record = {
    id,
    title: (beatData.title || "Untitled Beat").trim(),
    producer: (beatData.producer || "AMITDIED").trim(),
    bpm: Number(beatData.bpm) || 120,
    key: (beatData.key || "").trim(),
    genre: (beatData.genre || "Trap").trim(),
    mood_tags: Array.isArray(beatData.moodTags)
      ? beatData.moodTags
      : typeof beatData.moodTags === "string"
      ? beatData.moodTags.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["Dark"],
    price: Number(beatData.price) || 29.99,
    cover_url: beatData.coverUrl || "/placeholder-cover.png",
    audio_url: beatData.audioUrl || "",
    buy_link: beatData.buyLink || "",
    description: beatData.description || "",
    is_published: beatData.isPublished !== false,
    is_featured: Boolean(beatData.isFeatured),
    updated_at: new Date().toISOString(),
  };

  let savedInSupabase = false;

  // 1. Try Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from("beats")
        .upsert(
          {
            ...record,
            created_at: beatData.createdAt || new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (!error) {
        savedInSupabase = true;
      } else {
        console.warn("Supabase upsert returned error:", error.message);
      }
    } catch (sErr) {
      console.warn("Supabase upsert threw error:", sErr);
    }
  }

  // 2. Also keep local data/db.json in sync so both environments never lose beats
  const db = readDb();
  if (!db.beats) db.beats = [];
  const existingIdx = db.beats.findIndex((b: any) => b.id === id);

  const localFormat = {
    id,
    title: record.title,
    producer: record.producer,
    bpm: record.bpm,
    key: record.key,
    genre: record.genre,
    moodTags: record.mood_tags,
    price: record.price,
    coverUrl: record.cover_url,
    audioUrl: record.audio_url,
    buyLink: record.buy_link,
    description: record.description,
    isPublished: record.is_published,
    isFeatured: record.is_featured,
    createdAt: beatData.createdAt || new Date().toISOString(),
    updatedAt: record.updated_at,
  };

  if (existingIdx >= 0) {
    db.beats[existingIdx] = { ...db.beats[existingIdx], ...localFormat };
  } else {
    db.beats.unshift(localFormat);
  }

  writeDb(db);
  revalidatePath("/");
  revalidatePath("/admin/beats");
  revalidatePath("/api/beats");

  return {
    success: true,
    beat: localFormat,
    savedInSupabase,
  };
}

export async function togglePublishBeat(id: string, isPublished: boolean) {
  await verifyAdminAuth();

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin
        .from("beats")
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (e) {
      console.warn("Failed to toggle publish in Supabase:", e);
    }
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
  await verifyAdminAuth();

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin
        .from("beats")
        .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (e) {
      console.warn("Failed to toggle featured in Supabase:", e);
    }
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
  await verifyAdminAuth();

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin.from("beats").delete().eq("id", id);
    } catch (e) {
      console.warn("Failed to delete beat from Supabase:", e);
    }
  }

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
