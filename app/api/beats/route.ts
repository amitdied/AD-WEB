import { NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { beats as defaultBeats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const beatsRef = collection(db, 'beats');
    const q = query(beatsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const beats = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: data.id || doc.id,
          title: data.title || '',
          producer: data.producer || 'AMITDIED',
          bpm: data.bpm || 120,
          key: data.key || '',
          genre: data.genre || '',
          price: data.price || 0,
          buyLink: data.buyLink || '',
          description: data.description || '',
          coverUrl: data.coverUrl || '',
          audioUrl: data.audioUrl || '',
          audioStoragePath: data.audioStoragePath || '',
          coverStoragePath: data.coverStoragePath || '',
          storageProvider: data.storageProvider || '',
          moodTags: Array.isArray(data.moodTags) ? data.moodTags : [],
        };
      });
      return NextResponse.json(beats, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }
  } catch (error) {
    console.error('Error reading beats from Firestore:', error);
  }

  return NextResponse.json(defaultBeats, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
