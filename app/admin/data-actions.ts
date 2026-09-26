"use server";
import fs from "fs";
import path from "path";
import { beats, YOUTUBE_LINKS } from "@/lib/data";
import { revalidatePath } from "next/cache";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { beats: [], videos: [], deletedIds: [], _isInitialized: false };
  }
  const data = fs.readFileSync(DB_PATH, "utf8");
  try {
    const parsed = JSON.parse(data);
    return parsed;
  } catch (e) {
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
    db = { beats: [], videos: [], deletedIds: [], _isInitialized: true };
  }

  db._isInitialized = true;
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.beats) db.beats = [];
  if (!db.videos) db.videos = [];

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

  writeDb(db);
  return db;
}

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create a safe, unique file name
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/${fileName}`;
}

// Beats

export async function getCustomBeats() {
  const db = readDb();
  return db.beats || [];
}

export async function addBeat(beat: any) {
  const db = readDb();

  // ensure we only save simple strings/numbers, ignore object references like File, Event, etc.
  const safeCoverUrl =
    typeof beat.coverUrl === "string" && beat.coverUrl.trim() !== ""
      ? beat.coverUrl
      : "/placeholder-cover.png";
  const safeAudioUrl = typeof beat.audioUrl === "string" ? beat.audioUrl : "";

  console.log(
    "Saving beat with coverUrl type:",
    typeof safeCoverUrl,
    typeof beat.coverUrl,
  );
  console.log(
    "Saving beat with audioUrl type:",
    typeof safeAudioUrl,
    typeof beat.audioUrl,
  );

  const newBeat = {
    id: "custom-" + Date.now().toString(),
    title: String(beat.title || "Untitled"),
    producer: String(beat.producer || ""),
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

  try {
    JSON.stringify(newBeat); // verify serializability
  } catch (e) {
    throw new Error("Beat data is not serializable: " + String(e));
  }

  db.beats.push(newBeat);
  writeDb(db);
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
  revalidatePath("/");
  revalidatePath("/admin");
}

// Videos

export async function getCustomVideos() {
  const db = readDb();
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
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function getCustomTransmissions() {
  const db = readDb();
  if (Array.isArray(db.instagramTransmissions) && db.instagramTransmissions.length > 0) {
    return db.instagramTransmissions;
  }
  const { INSTAGRAM_TRANSMISSIONS } = await import("@/lib/data");
  return INSTAGRAM_TRANSMISSIONS;
}

export async function addTransmission(data: any) {
  const db = readDb();
  if (!Array.isArray(db.instagramTransmissions)) {
    const { INSTAGRAM_TRANSMISSIONS } = await import("@/lib/data");
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
    imageUrl: String(data.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop"),
    videoSnippetTitle: data.videoSnippetTitle ? String(data.videoSnippetTitle) : "TRANSMISSION_RAW.WAV",
    tags: Array.isArray(data.tags) ? data.tags : ["#amitdied", "#darktrap"],
  };
  db.instagramTransmissions.unshift(newTx);
  writeDb(db);
  revalidatePath("/transmissions");
  revalidatePath("/admin");
  return newTx;
}

export async function deleteTransmission(id: string) {
  const db = readDb();
  if (Array.isArray(db.instagramTransmissions)) {
    db.instagramTransmissions = db.instagramTransmissions.filter((t: any) => t.id !== id);
    writeDb(db);
  }
  revalidatePath("/transmissions");
  revalidatePath("/admin");
}
