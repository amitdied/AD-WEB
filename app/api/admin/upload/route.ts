import { NextRequest, NextResponse } from "next/server";
import { uploadToGoogleDrive, DriveFolderType } from "@/lib/google/drive";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !session.isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED: Admin session required" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "NO_FILE_PROVIDED" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = Math.round(file.size / (1024 * 1024));
      return NextResponse.json(
        { ok: false, error: `FILE_TOO_LARGE: ${sizeMb}MB exceeds 50MB limit` },
        { status: 400 }
      );
    }

    const explicitType = formData.get("folderType") as DriveFolderType | null;

    let folderType: DriveFolderType = "covers";
    if (explicitType && ["audio", "covers", "media"].includes(explicitType)) {
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

    return NextResponse.json({
      ok: true,
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    });
  } catch (error: any) {
    console.error("[API UPLOAD ERROR]", error?.message || error);
    const msg = error?.message || "UPLOAD_FAILED";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
