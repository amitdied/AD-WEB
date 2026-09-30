import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { beats as defaultBeats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('beats')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const beats = data.map((row: any) => ({
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

      return NextResponse.json(beats, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }
  } catch (error) {
    console.error('Error reading beats from Supabase:', error);
  }

  return NextResponse.json(defaultBeats, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
