import { NextRequest, NextResponse } from "next/server";
import { verifyGoogleAdmin } from "@/lib/google-auth";
import { uploadFileToDrive, saveBeatToSheet } from "@/lib/google-workspace";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

// Support large uploads
export const maxDuration = 120; // 2 minutes

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the admin
    await verifyGoogleAdmin();

    // 2. Parse multipart form data
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const bpm = Number(formData.get("bpm")) || 120;
    const genre = (formData.get("genre") as string) || "Trap";
    const mood = (formData.get("mood") as string) || "Dark";
    const price = Number(formData.get("price")) || 29.99;
    const currency = (formData.get("currency") as string) || "INR";
    const description = (formData.get("description") as string) || "";
    const tagsInput = (formData.get("tags") as string) || "";
    const isPublished = formData.get("isPublished") === "true";
    const isFeatured = formData.get("isFeatured") === "true";

    const audioFile = formData.get("audioFile") as File | null;
    const coverFile = formData.get("coverFile") as File | null;
    const existingAudioFileId = (formData.get("existingAudioFileId") as string) || "";
    const existingCoverFileId = (formData.get("existingCoverFileId") as string) || "";
    const id = (formData.get("id") as string) || crypto.randomUUID();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Beat title is required." }, { status: 400 });
    }

    if (!audioFile && !existingAudioFileId) {
      return NextResponse.json(
        { error: "Audio file (MP3/WAV) is required for new beats." },
        { status: 400 }
      );
    }

    const audioFolderId = process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID;
    const coversFolderId = process.env.GOOGLE_DRIVE_COVERS_FOLDER_ID;

    let audioFileId = existingAudioFileId;
    let coverFileId = existingCoverFileId;

    // 3. Upload Audio File if provided
    if (audioFile && audioFile.size > 0) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const audioStream = Readable.from(audioBuffer);

      const uploadedAudio = await uploadFileToDrive({
        name: `[AUDIO] ${title} - ${id.slice(0, 8)}.${audioFile.name.split(".").pop() || "wav"}`,
        mimeType: audioFile.type || "audio/mpeg",
        folderId: audioFolderId,
        bodyStream: audioStream,
      });

      audioFileId = uploadedAudio.fileId;
    }

    // 4. Upload Cover File if provided
    if (coverFile && coverFile.size > 0) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverStream = Readable.from(coverBuffer);

      const uploadedCover = await uploadFileToDrive({
        name: `[COVER] ${title} - ${id.slice(0, 8)}.${coverFile.name.split(".").pop() || "webp"}`,
        mimeType: coverFile.type || "image/jpeg",
        folderId: coversFolderId,
        bodyStream: coverStream,
      });

      coverFileId = uploadedCover.fileId;
    }

    // 5. Generate Slug
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `beat-${id.slice(0, 8)}`;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // 6. Save beat row to Google Sheets
    const beatRecord = {
      id,
      title: title.trim(),
      slug,
      bpm,
      genre,
      mood,
      price,
      currency,
      description,
      tags,
      audioFileId,
      coverFileId,
      isPublished,
      isFeatured,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveBeatToSheet(beatRecord);

    return NextResponse.json({
      success: true,
      message: `Beat "${title}" successfully saved to Google Drive & Google Sheets!`,
      beat: beatRecord,
    });
  } catch (err: any) {
    console.error("Beat upload error:", err);
    return NextResponse.json(
      {
        error: err?.message || "Failed to process beat upload.",
        details: err?.stack,
      },
      { status: 500 }
    );
  }
}
