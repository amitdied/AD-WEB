export const beats = [
  {
    "id": "1",
    "title": "GOTHAM",
    "bpm": 140,
    "genre": "Rage",
    "moodTags": [
      "Dark",
      "Energetic",
      "Aggressive"
    ],
    "price": 29.99,
    "coverUrl": "https://picsum.photos/seed/gotham/400/400",
    "audioUrl": ""
  },
  {
    "id": "4",
    "title": "CATACOMBS",
    "bpm": 120,
    "genre": "Experimental",
    "moodTags": [
      "Eerie",
      "Industrial",
      "Heavy"
    ],
    "price": 24.99,
    "coverUrl": "https://picsum.photos/seed/catacombs/400/400",
    "audioUrl": ""
  },
  {
    "id": "6",
    "title": "SOLITUDE",
    "bpm": 110,
    "genre": "Emotional",
    "moodTags": [
      "Sad",
      "Reflective",
      "Chill"
    ],
    "price": 24.99,
    "coverUrl": "https://picsum.photos/seed/solitude/400/400",
    "audioUrl": ""
  }
];


export const portfolioMembers = [
  {
    id: '1',
    title: 'ASTROWORLD (REMIX)',
    type: 'Remix',
    year: '2025',
    image: 'https://picsum.photos/seed/astro/600/600',
  },
  {
    id: '2',
    title: 'UNDERGROUND VOL 1',
    type: 'EP',
    year: '2024',
    image: 'https://picsum.photos/seed/underground/600/600',
  },
  {
    id: '3',
    title: 'VAMPIRE AESTHETICS',
    type: 'Single',
    year: '2024',
    image: 'https://picsum.photos/seed/vampire/600/600',
  }
];

export const YOUTUBE_LINKS = [
  "https://www.youtube.com/watch?v=pYR7unUKdKY",
  "https://www.youtube.com/watch?v=5kZc7-9Anhw",
  "https://www.youtube.com/watch?v=A589IGQGvY8",
  "https://www.youtube.com/watch?v=V7v7NNF_0fA",
  "https://www.youtube.com/watch?v=S1EN7-z2EEw",
  "https://www.youtube.com/watch?v=N0UfKREgBGk",
  "https://www.youtube.com/watch?v=kQ4vdLGK-OE",
  "https://www.youtube.com/watch?v=VXc6GPVYySQ",
  "https://www.youtube.com/watch?v=UX06SubfGeI",
  "https://www.youtube.com/watch?v=G9ZP70GjmHQ",
];

export interface CCTVFeedItem {
  id: string;
  url: string;
  label: string;
  location: string;
  captionTitle: string;
  snippet: string;
  status: string;
  date: string;
  type: "instagram" | "video";
  visible?: boolean;
}

export const DEFAULT_CCTV_POSTS: CCTVFeedItem[] = [
  {
    id: "reel-tu-harak",
    url: "https://www.instagram.com/amitdied/reel/DcHBlPJTFBB/",
    label: "CAM_01",
    location: "STUDIO_UNDERGROUND",
    captionTitle: "TU HARAK",
    snippet: "New transmission from @amitdied.",
    status: "ONLINE",
    date: "LATEST",
    type: "instagram",
    visible: true,
  },
  {
    id: "post-1",
    url: "https://www.instagram.com/p/DF7n4yqT3lE/",
    label: "CAM_02",
    location: "STUDIO_UNDERGROUND",
    captionTitle: "AMITDIED // LATE_NIGHT_SESSION",
    snippet: "Analog pedals and 808 saturation test straight from the rack console.",
    status: "ONLINE",
    date: "ARCHIVE",
    type: "instagram",
    visible: true,
  },
  {
    id: "post-2",
    url: "https://www.instagram.com/p/DFzL12oSo7G/",
    label: "CAM_03",
    location: "MASTERING_LAB",
    captionTitle: "OFFICIAL_PLACEMENT_RELEASE",
    snippet: "New production landed worldwide.",
    status: "TRANSMITTING",
    date: "RECENT",
    type: "instagram",
    visible: true,
  },
];

export interface InstagramTransmission {
  id: string;
  camCode: string;
  category: 'cookup' | 'placement' | 'lore' | 'session';
  caption: string;
  timestamp: string;
  likes: number;
  comments: number;
  postUrl: string;
  imageUrl: string;
  videoSnippetTitle?: string;
  tags: string[];
}

export const AMITDIED_IG_PROFILE = {
  username: "amitdied",
  displayName: "AMIT // 100K PRODUCER",
  bio: "Music Producer & Sound Designer 🩸 Dark Trap / Rage / Cinematic 808s. Placements & Inquiries via DM. Streaming everywhere.",
  profileUrl: "https://www.instagram.com/amitdied/",
  avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
  followersCount: "14.2K",
  followingCount: "482",
  postsCount: "128",
  verified: true,
};

export const INSTAGRAM_TRANSMISSIONS: InstagramTransmission[] = [
  {
    id: 'ig-tx-01',
    camCode: 'CAM-01 // STUDIO_REDLINE',
    category: 'cookup',
    caption: '“Late night in the lab. Testing out analog distortion with custom 808 glides. When the sub rattles the camera you know the mix is sitting right.” @amitdied',
    timestamp: 'JUST NOW',
    likes: 1840,
    comments: 112,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'ANALOG_TAPE_808_GLIDE.MOV',
    tags: ['#amitdied', '#darktrap', '#producerlife', '#808mafia', '#flstudio'],
  },
  {
    id: 'ig-tx-02',
    camCode: 'CAM-02 // MAJOR_PLACEMENT',
    category: 'placement',
    caption: 'Official placement alert! Honored to produce this track. Thank you to everyone streaming and bumping the sound globally. WAV leases and exclusives available in the store link.',
    timestamp: '1 DAY AGO',
    likes: 3890,
    comments: 294,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'OFFICIAL_RELEASE_PLACEMENT',
    tags: ['#amitdied', '#producerplacement', '#billboard', '#darktrap', '#sounddesign'],
  },
  {
    id: 'ig-tx-03',
    camCode: 'CAM-03 // BOOTH_INTERCEPT',
    category: 'session',
    caption: 'Tracking underground vocal takes through vintage tube preamps. The saturation adds that gritty industrial texture you cannot fake digitally.',
    timestamp: '3 DAYS AGO',
    likes: 1420,
    comments: 67,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'VOCAL_MIC_PREAMP_SATURATION',
    tags: ['#recordingstudio', '#tubepreamp', '#undergroundartist', '#amitdied'],
  },
  {
    id: 'ig-tx-04',
    camCode: 'CAM-04 // HARDWARE_RACK',
    category: 'cookup',
    caption: 'Prophet 6 + Moog Sub 37 sound design reel. Patching custom eerie arpeggiated synths for the upcoming beat collection. What artist would slide on this?',
    timestamp: '5 DAYS AGO',
    likes: 2750,
    comments: 188,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'SYNTH_PATCH_DESIGN_SESSION',
    tags: ['#moog', '#prophet6', '#synthesizers', '#sounddesigner', '#amitdied'],
  },
  {
    id: 'ig-tx-05',
    camCode: 'CAM-05 // NIGHT_AESTHETIC',
    category: 'lore',
    caption: 'Tokyo midnight surveillance aesthetic. Absorbing ambient sounds, neon reflections, and low frequencies. The atmosphere always inspires the melody selection.',
    timestamp: '1 WEEK AGO',
    likes: 2190,
    comments: 94,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'NIGHT_ATMOSPHERE_FIELD_AUDIO',
    tags: ['#cyberpunk', '#darkaesthetic', '#soundscape', '#amitdied', '#ambient'],
  },
  {
    id: 'ig-tx-06',
    camCode: 'CAM-06 // MASTER_TAPE_DECK',
    category: 'cookup',
    caption: 'Running the master track through reel-to-reel tape. Pushing the headroom until the drums compress with natural analog punch. Tap link in bio or DM to license.',
    timestamp: '2 WEEKS AGO',
    likes: 4620,
    comments: 341,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'MASTER_ANALOG_REEL_CRUNCH',
    tags: ['#reeltoreel', '#mastering', '#tapecompression', '#amitdied', '#beatsforsale'],
  },
  {
    id: 'ig-tx-07',
    camCode: 'CAM-07 // DRUM_PROGRAMMING',
    category: 'cookup',
    caption: 'Layering crunchy hi-hat rolls and polyrhythmic percussion on the MPC. Every bounce has to hit with relentless rhythm. DM @amitdied to lock in custom work.',
    timestamp: '3 WEEKS AGO',
    likes: 1980,
    comments: 86,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'MPC_DRUM_CHOP_SESSION',
    tags: ['#mpc', '#drums', '#trapbeats', '#flstudio', '#amitdied'],
  },
  {
    id: 'ig-tx-08',
    camCode: 'CAM-08 // STUDIO_HEADQUARTERS',
    category: 'lore',
    caption: 'Behind the mixing desk. The sanctuary where every rage synth and 808 earthquake is crafted. Always working, never sleeping.',
    timestamp: '1 MONTH AGO',
    likes: 3120,
    comments: 155,
    postUrl: 'https://www.instagram.com/amitdied/',
    imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1200&auto=format&fit=crop',
    videoSnippetTitle: 'HEADQUARTERS_LIGHTS_OUT',
    tags: ['#studiolife', '#producergrid', '#audiophile', '#amitdied'],
  },
];

