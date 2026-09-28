import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { beats as defaultBeats } from '@/lib/data';
import { getAllBeatsFromSheet, BeatRecord } from '@/lib/google-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // 1. Fetch published beats dynamically from Google Sheets
  try {
    const sheetBeats = await getAllBeatsFromSheet({ onlyPublished: true });

    if (Array.isArray(sheetBeats) && sheetBeats.length > 0) {
      const beats = sheetBeats.map((b: BeatRecord) => {
        // Construct controlled streaming / preview URLs
        const audioUrl = b.audioFileId
          ? `/api/media/${b.audioFileId}`
          : '';

        const coverUrl = b.coverFileId
          ? `/api/media/${b.coverFileId}`
          : '/placeholder-cover.png';

        return {
          id: b.id,
          title: b.title,
          slug: b.slug,
          bpm: b.bpm || 120,
          genre: b.genre || 'Trap',
          mood: b.mood || 'Dark',
          moodTags: Array.isArray(b.tags) && b.tags.length > 0 ? b.tags : [b.mood || 'Dark'],
          tags: b.tags || [],
          price: Number(b.price) || 29.99,
          currency: b.currency || 'INR',
          coverUrl,
          audioUrl,
          audioFileId: b.audioFileId,
          coverFileId: b.coverFileId,
          description: b.description || '',
          isFeatured: Boolean(b.isFeatured),
          isPublished: Boolean(b.isPublished),
          createdAt: b.createdAt,
        };
      });

      return NextResponse.json(beats);
    }
  } catch (err) {
    console.warn('Google Sheets read error in /api/beats:', err);
  }

  // 2. Fallback to local db.json if present
  try {
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.beats) && parsed.beats.length > 0) {
        const active = parsed.beats.filter((b: any) => b.isPublished !== false);
        if (active.length > 0) {
          return NextResponse.json(active);
        }
      }
    }
  } catch (error) {
    console.error('Error reading beats DB:', error);
  }

  // 3. Fallback to default catalog beats
  return NextResponse.json(defaultBeats);
}
