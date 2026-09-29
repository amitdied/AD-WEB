import { NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const beatsRef = collection(db, 'beats');
    const q = query(beatsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const beats = snapshot.docs.map((doc) => {
        const data = doc.data();
        const rawPrice = data.price !== undefined && data.price !== '' ? Number(data.price) : 0;
        const validPrice = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : 0;

        return {
          id: data.id || doc.id,
          title: data.title || '',
          producer: data.producer || 'AMITDIED',
          bpm: data.bpm !== undefined ? Number(data.bpm) : 120,
          key: data.key || '',
          genre: data.genre || '',
          price: validPrice,
          buyLink: data.buyLink || '',
          description: data.description || '',
          coverUrl: data.coverUrl || '',
          audioUrl: data.audioUrl || '',
          moodTags: Array.isArray(data.moodTags) ? data.moodTags : [],
        };
      });
      return NextResponse.json(beats, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    // If Firestore has no beats, return an empty array
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('[BEATS API ERROR] Error reading beats from Firestore:', error);
    return NextResponse.json(
      { error: 'FIRESTORE_FETCH_FAILED', message: error?.message || 'Could not fetch beats from database' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

