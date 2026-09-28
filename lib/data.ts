export interface Beat {
  id: string;
  title: string;
  bpm: number;
  key: string;
  genre: 'Dark Trap' | 'Rage' | 'Melodic Drill' | 'Ambient Phonk' | 'Cinematic Trap' | 'Cyberpunk';
  tags: string[];
  price: number; // base MP3 lease price
  coverUrl: string;
  audioUrl?: string; // audio preview url
  synthPreset: 'dark_808' | 'bell_rage' | 'drill_piano' | 'ambient_synth' | 'cyber_bass';
  duration: number; // in seconds
  releaseDate: string;
  plays: number;
  featured?: boolean;
}

export interface LicenseTier {
  id: string;
  name: string;
  price: number;
  fileTypes: string[];
  streamsLimit: string;
  musicVideos: string;
  radioBroadcasting: string;
  forProfitLivePerformances: boolean;
  contractType: string;
  features: string[];
  recommended?: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  artist: string;
  role: string;
  streams: string;
  year: string;
  coverUrl: string;
  platform: 'Spotify' | 'Apple Music' | 'YouTube' | 'SoundCloud';
  link: string;
}

export const INITIAL_BEATS: Beat[] = [
  {
    id: 'beat-1',
    title: 'VALKYRIE PROTOCOL',
    bpm: 144,
    key: 'C# Minor',
    genre: 'Dark Trap',
    tags: ['Travis Scott', 'Dark 808', 'Distorted Synth', 'Hard'],
    price: 34.99,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'dark_808',
    duration: 165,
    releaseDate: '2026-03-15',
    plays: 14820,
    featured: true,
  },
  {
    id: 'beat-2',
    title: 'NEON RESURRECTION',
    bpm: 152,
    key: 'F Minor',
    genre: 'Rage',
    tags: ['Yeat', 'Carti', 'Lead Synth', 'Energetic'],
    price: 39.99,
    coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'bell_rage',
    duration: 148,
    releaseDate: '2026-03-10',
    plays: 28450,
    featured: true,
  },
  {
    id: 'beat-3',
    title: 'GHOST SHELL MEMORIES',
    bpm: 140,
    key: 'G# Minor',
    genre: 'Melodic Drill',
    tags: ['Central Cee', 'Sad Piano', 'Vocal Chops', 'Sliding 808'],
    price: 34.99,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'drill_piano',
    duration: 172,
    releaseDate: '2026-03-02',
    plays: 9340,
  },
  {
    id: 'beat-4',
    title: 'BLOODLINE OVERDRIVE',
    bpm: 160,
    key: 'D Minor',
    genre: 'Ambient Phonk',
    tags: ['Drift Phonk', 'Cowbell', 'Heavy Distortion', 'Night Drive'],
    price: 29.99,
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'cyber_bass',
    duration: 135,
    releaseDate: '2026-02-28',
    plays: 35120,
    featured: true,
  },
  {
    id: 'beat-5',
    title: 'LUCID GRAVEYARD',
    bpm: 130,
    key: 'A Minor',
    genre: 'Cinematic Trap',
    tags: ['Metro Boomin', '21 Savage', 'Strings', 'Dark Brass'],
    price: 34.99,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'ambient_synth',
    duration: 180,
    releaseDate: '2026-02-20',
    plays: 12400,
  },
  {
    id: 'beat-6',
    title: 'CYBERPSYCHO V2',
    bpm: 156,
    key: 'E Minor',
    genre: 'Cyberpunk',
    tags: ['Industrial', 'Synthwave', 'Heavy Glitch', 'Aggressive'],
    price: 39.99,
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'cyber_bass',
    duration: 154,
    releaseDate: '2026-02-12',
    plays: 18760,
  },
  {
    id: 'beat-7',
    title: 'ABYSSAL ECHOES',
    bpm: 138,
    key: 'B Minor',
    genre: 'Dark Trap',
    tags: ['Future', '808 Mafia', 'Bell Melody', 'Space'],
    price: 34.99,
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'dark_808',
    duration: 162,
    releaseDate: '2026-02-01',
    plays: 8200,
  },
  {
    id: 'beat-8',
    title: 'ETERNAL DYNASTY',
    bpm: 145,
    key: 'F# Minor',
    genre: 'Melodic Drill',
    tags: ['Pop Smoke', 'Violin', 'Fast Hi-Hats', 'Club'],
    price: 34.99,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    synthPreset: 'drill_piano',
    duration: 170,
    releaseDate: '2026-01-25',
    plays: 16300,
  }
];

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: 'mp3',
    name: 'Standard MP3 Lease',
    price: 34.99,
    fileTypes: ['Untagged High-Quality MP3 (320kbps)'],
    streamsLimit: 'Up to 100,000 Audio Streams',
    musicVideos: '1 Non-Monetized Video',
    radioBroadcasting: '2 Radio Stations',
    forProfitLivePerformances: false,
    contractType: 'Non-Exclusive License',
    features: [
      'Instant digital download',
      'Tagged vocal watermarks removed',
      'Distribute on Spotify & Apple Music',
      'Keeps 100% royalty on first 100k streams',
      'Official license agreement PDF'
    ]
  },
  {
    id: 'wav',
    name: 'Premium WAV Lease',
    price: 59.99,
    fileTypes: ['Mastered 24-Bit WAV', 'High-Quality MP3'],
    streamsLimit: 'Up to 500,000 Audio Streams',
    musicVideos: '2 Monetized Videos',
    radioBroadcasting: 'Up to 10 Radio Stations',
    forProfitLivePerformances: true,
    contractType: 'Non-Exclusive License',
    recommended: true,
    features: [
      'Lossless uncompressed audio for studio recording',
      'Instant digital delivery',
      'Commercial live performance rights',
      'Sync license for YouTube monetization',
      'Full metadata & cue sheet'
    ]
  },
  {
    id: 'trackout',
    name: 'Unlimited Trackout (Stems)',
    price: 119.99,
    fileTypes: ['Full WAV Trackout Stems', 'Mastered WAV', 'MP3'],
    streamsLimit: 'Unlimited Audio Streams',
    musicVideos: 'Unlimited Music Videos',
    radioBroadcasting: 'Unlimited Broadcasting',
    forProfitLivePerformances: true,
    contractType: 'Non-Exclusive Unlimited',
    features: [
      'Individual stems (Kicks, 808s, Melodies, FX)',
      'Total mixing & vocal arrangement freedom',
      'Zero streaming caps or renewal fees',
      'Paid sync licensing permitted',
      'Priority engineer support'
    ]
  },
  {
    id: 'exclusive',
    name: 'Exclusive Ownership',
    price: 499.00,
    fileTypes: ['Full Stems', 'WAV', 'MP3', 'Session Project Files'],
    streamsLimit: 'Unlimited Streams & Sales',
    musicVideos: 'Unlimited Commercial Exploitation',
    radioBroadcasting: 'Worldwide Full Broadcast',
    forProfitLivePerformances: true,
    contractType: 'Full Ownership Transfer',
    features: [
      'Beat removed permanently from store',
      '100% master and sync publishing ownership',
      'Full legal assignment contract',
      'Custom arrangement & mix tweaks included',
      'Direct 1-on-1 session with AMITDIED'
    ]
  }
];

export const PORTFOLIO_RELEASES: PortfolioItem[] = [
  {
    id: 'rel-1',
    title: 'RED SHADOWS EP',
    artist: 'VEXX & AMITDIED',
    role: 'Executive Producer / Mixed & Mastered',
    streams: '2.4M Streams',
    year: '2025',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    platform: 'Spotify',
    link: 'https://open.spotify.com'
  },
  {
    id: 'rel-2',
    title: 'TOKYO UNDERGROUND DRIFT',
    artist: 'KAIZEN X AMIT',
    role: 'Co-Producer / Sound Design',
    streams: '5.1M Streams',
    year: '2025',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    platform: 'Apple Music',
    link: 'https://music.apple.com'
  },
  {
    id: 'rel-3',
    title: 'NEO-NOIR SESSIONS',
    artist: 'BLVCK SKY',
    role: 'Composer / Beatmaker',
    streams: '1.8M Streams',
    year: '2024',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    platform: 'YouTube',
    link: 'https://youtube.com'
  },
  {
    id: 'rel-4',
    title: 'CHRONICLES OF RAGE',
    artist: 'SYNDICATE 09',
    role: 'Music Producer',
    streams: '890K Streams',
    year: '2024',
    coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80',
    platform: 'SoundCloud',
    link: 'https://soundcloud.com'
  }
];

export const INSTAGRAM_POSTS = [
  {
    id: 'ig-1',
    caption: 'Cooked this dark melodic trap loop at 4 AM. Synth layers running through analog distortion pedals 🩸',
    likes: '1,420',
    date: '2d ago',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
    link: 'https://instagram.com'
  },
  {
    id: 'ig-2',
    caption: 'Testing the analog modular rig for the upcoming VALKYRIE collection. 808s hitting sub-30Hz.',
    likes: '2,890',
    date: '5d ago',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    link: 'https://instagram.com'
  },
  {
    id: 'ig-3',
    caption: 'Studio session in Berlin with underground vocalists. New placements coming this summer.',
    likes: '3,105',
    date: '1w ago',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    link: 'https://instagram.com'
  },
  {
    id: 'ig-4',
    caption: 'Vault sample clearance complete. 10 fresh exclusives loaded into the catalogue.',
    likes: '1,980',
    date: '2w ago',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    link: 'https://instagram.com'
  }
];
