/**
 * AMITDIED WORLD — Spatial Layout, Interactables & Collectible Registry
 * Phase 3: Connected 5-Room Underground Music Facility
 */

export type InteractableType =
  | "vinyl"
  | "cassette"
  | "cd"
  | "terminal"
  | "projector"
  | "door"
  | "screen"
  | "console";

export interface WorldInteractable {
  id: string;
  type: InteractableType;
  name: string;
  label: string;
  actionText: string;
  message: string;
  room: "MAIN STUDIO" | "BEAT ROOM" | "CCTV ROOM" | "CINEMA" | "ARCHIVE" | "OUTSIDE";
  position: [number, number, number];
  radius: number;
  isCollectible?: boolean;
}

// 8 Collectible Music Artifacts across Beat Room & Facility
export const WORLD_COLLECTIBLES: WorldInteractable[] = [
  {
    id: "VINYL_001",
    type: "vinyl",
    name: "VINYL // ETERNAL DISTORTION",
    label: "VINYL 001",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // UNRELEASED 001 — HEAVY 808 MASTER CUT ON 12\" WAX",
    room: "BEAT ROOM",
    position: [-12.5, 0.95, -3.2],
    radius: 1.8,
    isCollectible: true,
  },
  {
    id: "VINYL_002",
    type: "vinyl",
    name: "VINYL // UNDERGROUND DRIFT",
    label: "VINYL 002",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // UNRELEASED 002 — RAW 140 BPM TRAP STEMS [45 RPM]",
    room: "BEAT ROOM",
    position: [-15.8, 0.95, -3.2],
    radius: 1.8,
    isCollectible: true,
  },
  {
    id: "VINYL_003",
    type: "vinyl",
    name: "VINYL // SUB BASS CHRONICLES",
    label: "VINYL 003",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // UNRELEASED 003 — HAND-CUT TEST PRESSING #07",
    room: "BEAT ROOM",
    position: [-17.2, 0.85, 1.8],
    radius: 1.8,
    isCollectible: true,
  },
  {
    id: "TAPE_001",
    type: "cassette",
    name: "CASSETTE // DEMO 2024",
    label: "CASSETTE 001",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // TAPE 01 — UNPROCESSED UNDERGROUND VOCALS",
    room: "BEAT ROOM",
    position: [-10.8, 0.9, -1.8],
    radius: 1.6,
    isCollectible: true,
  },
  {
    id: "TAPE_002",
    type: "cassette",
    name: "CASSETTE // CHOPPED STEMS",
    label: "CASSETTE 002",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // TAPE 02 — WARPED ANALOG SAMPLER SESSION",
    room: "BEAT ROOM",
    position: [-13.6, 0.9, 3.2],
    radius: 1.6,
    isCollectible: true,
  },
  {
    id: "TAPE_003",
    type: "cassette",
    name: "CASSETTE // NIGHT DRIVE 808s",
    label: "CASSETTE 003",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // TAPE 03 — CASSETTE SATURATOR BOUNCE [TYPE IV METAL]",
    room: "BEAT ROOM",
    position: [-15.8, 0.9, 3.2],
    radius: 1.6,
    isCollectible: true,
  },
  {
    id: "CD_001",
    type: "cd",
    name: "CD-R // STUDIO BACKUP 03:47",
    label: "CD 001",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // CD 01 — MULTITRACK SESSIONS DATED 03:47 AM",
    room: "BEAT ROOM",
    position: [-11.2, 0.85, 2.4],
    radius: 1.6,
    isCollectible: true,
  },
  {
    id: "CD_002",
    type: "cd",
    name: "CD-R // UNRELEASED TRAP ALBUM",
    label: "CD 002",
    actionText: "EXAMINE",
    message: "ARCHIVE OBJECT // CD 02 — UNRELEASED 12-TRACK ALBUM MASTER",
    room: "BEAT ROOM",
    position: [-14.2, 0.9, -0.6],
    radius: 1.6,
    isCollectible: true,
  },
];

// Room Equipment, Terminals & Architectural Interactables
export const WORLD_EQUIPMENT_INTERACTABLES: WorldInteractable[] = [
  // 1. MAIN STUDIO
  {
    id: "STUDIO_CRT",
    type: "terminal",
    name: "CRT TERMINAL",
    label: "SYSTEM CONSOLE",
    actionText: "ACCESS",
    message: "SIGNAL FOUND — SURVEILLANCE INTERCEPT RUNNING AT 108.4 MHZ",
    room: "MAIN STUDIO",
    position: [0, 0.95, -2.8],
    radius: 1.8,
  },
  {
    id: "STUDIO_MIXER",
    type: "console",
    name: "MIXING CONSOLE",
    label: "AUDIO DESK",
    actionText: "EXAMINE",
    message: "ANALOG 808 BUS ARMED — MASTER COMPRESSOR AND LIMITER ONLINE",
    room: "MAIN STUDIO",
    position: [0, 0.82, -2.0],
    radius: 1.7,
  },

  // 2. BEAT ROOM
  {
    id: "BEAT_ARCHIVE_TERMINAL",
    type: "terminal",
    name: "BEAT ARCHIVE TERMINAL",
    label: "BEAT ARCHIVE",
    actionText: "ACCESS BEAT ARCHIVE",
    message: "CONNECTING TO AMITDIED BEAT STORE MAINFRAME...",
    room: "BEAT ROOM",
    position: [-14.0, 0.95, 0.2],
    radius: 2.2,
  },

  // 3. CCTV SURVEILLANCE ROOM
  {
    id: "CCTV_TERMINAL",
    type: "terminal",
    name: "SURVEILLANCE TERMINAL",
    label: "SURVEILLANCE",
    actionText: "ACCESS CCTV",
    message: "CONNECTING TO AMITDIED SURVEILLANCE MAINFRAME...",
    room: "CCTV ROOM",
    position: [14.0, 0.9, 0.0],
    radius: 2.2,
  },
  {
    id: "CCTV_MONITOR_BANK",
    type: "screen",
    name: "CCTV MONITOR BANK",
    label: "WALL SCREENS",
    actionText: "INSPECT",
    message: "CAM 01: ONLINE | CAM 02: NO SIGNAL | CAM 04: OFFLINE",
    room: "CCTV ROOM",
    position: [18.2, 1.8, 0.0],
    radius: 2.5,
  },

  // 4. CINEMA / PROJECTION ROOM
  {
    id: "CINEMA_TERMINAL",
    type: "terminal",
    name: "CINEMA PROJECTION SYSTEM",
    label: "PROJECTION",
    actionText: "ENTER CINEMA",
    message: "CONNECTING TO 35MM OPTICAL PROJECTION SYSTEM...",
    room: "CINEMA",
    position: [0, 1.1, -12.5],
    radius: 2.5,
  },
  {
    id: "CINEMA_SCREEN",
    type: "screen",
    name: "PROJECTION SCREEN",
    label: "CINEMA SCREEN",
    actionText: "EXAMINE",
    message: "PROJECTION SCREEN — OPTICAL BEAM ALIGNED WITH ARCHIVAL FILM",
    room: "CINEMA",
    position: [0, 2.2, -20.6],
    radius: 2.8,
  },

  // 5. ARCHIVE / UNKNOWN AREA
  {
    id: "NODE_04_DOOR",
    type: "door",
    name: "BLAST DOOR // NODE 04",
    label: "NODE 04 DOOR",
    actionText: "ACCESS",
    message: "ACCESS RESTRICTED — LEVEL 04 CLEARANCE REQUIRED",
    room: "ARCHIVE",
    position: [0, 1.4, -34.2],
    radius: 2.2,
  },
  {
    id: "ARCHIVE_CRATE",
    type: "terminal",
    name: "DAMAGED STORAGE CONTAINER",
    label: "CONTAINER 88",
    actionText: "EXAMINE",
    message: "PROPERTY OF AMITDIED // 03:47 — UNCATALOGUED HARD DISK DRIVES",
    room: "ARCHIVE",
    position: [-2.6, 0.6, -28.0],
    radius: 1.8,
  },
  // 6. NODE 04 SECRET VAULT CHAMBER
  {
    id: "NODE_04_TERMINAL",
    type: "terminal",
    name: "NODE 04 MAINFRAME TERMINAL",
    label: "NODE 04",
    actionText: "ACCESS NODE 04",
    message: "ARCHIVAL VAULT RECORD // CIPHER LEVEL 04 UNLOCKED",
    room: "ARCHIVE",
    position: [0, 1.0, -39.0],
    radius: 2.4,
  },

  // 7. FACILITY EXIT TO SURFACE (SOUTH CORRIDOR)
  {
    id: "FACILITY_EXIT",
    type: "door",
    name: "SURFACE EXIT // PORTAL",
    label: "EXIT // OUTSIDE",
    actionText: "GO OUTSIDE",
    message: "SURFACE ACCESS PORTAL // ASCENDING TO AMITDIED OUTDOOR DISTRICT...",
    room: "MAIN STUDIO",
    position: [0, 1.4, 8.4],
    radius: 2.5,
  },

  // 8. OUTDOOR WORLD ENTRANCE (BUNKER)
  {
    id: "FACILITY_ENTRANCE",
    type: "door",
    name: "FACILITY ENTRANCE // BUNKER",
    label: "ENTER // FACILITY",
    actionText: "ENTER FACILITY",
    message: "SECURITY AIRLOCK // DESCENDING TO UNDERGROUND FACILITY LEVEL -2...",
    room: "OUTSIDE",
    position: [0, 1.4, 23.5],
    radius: 2.5,
  },

  // 9. OUTDOOR CENTRAL PARK MONUMENT
  {
    id: "sound_monument",
    type: "terminal",
    name: "CENTRAL SOUND MONUMENT",
    label: "SOUND MONUMENT",
    actionText: "EXAMINE SOUND MONUMENT",
    message: "ACOUSTIC MONOLITH // RESONATING WITH MASTER BASS FREQUENCIES ACROSS CENTRAL PARK",
    room: "OUTSIDE",
    position: [0, 1.6, 55.0],
    radius: 3.2,
  },

  // 10. OUTDOOR PARK BENCH
  {
    id: "OUTDOOR_BENCH",
    type: "console",
    name: "PARK OVERLOOK BENCH",
    label: "WOODEN BENCH",
    actionText: "REST",
    message: "CENTRAL PARK // BIRDS CHIRPING UNDER THE AMITDIED SKY",
    room: "OUTSIDE",
    position: [-10.5, 0.7, 52.0],
    radius: 2.0,
  },

  // 11. AMITDIED AUDIO LABS
  {
    id: "audio_labs_exterior",
    type: "terminal",
    name: "AMITDIED AUDIO LABS",
    label: "AUDIO LABS",
    actionText: "ACCESS AUDIO LABS",
    message: "AMITDIED AUDIO LABS // RECORDING, MIXING & MASTERING HEADQUARTERS",
    room: "OUTSIDE",
    position: [40.0, 1.6, 47.0],
    radius: 3.5,
  },

  // 12. 35MM CINEMA LOUNGE & CAFE
  {
    id: "cinema_lounge_exterior",
    type: "terminal",
    name: "35MM CINEMA LOUNGE & CAFE",
    label: "35MM CINEMA",
    actionText: "ACCESS CINEMA LOUNGE",
    message: "35MM CINEMA LOUNGE & CAFE // ARCHIVE SCREENINGS & VINYL LOUNGE",
    room: "OUTSIDE",
    position: [40.0, 1.6, 67.0],
    radius: 3.5,
  },

  // 13. NORTHERN SCENIC OVERLOOK TELESCOPE
  {
    id: "scenic_telescope",
    type: "terminal",
    name: "OBSERVATION TELESCOPE",
    label: "TELESCOPE",
    actionText: "LOOK THROUGH TELESCOPE",
    message: "OBSERVATION TELESCOPE // PANORAMIC VIEW OF THE AMITDIED SKYLINE & VALLEY",
    room: "OUTSIDE",
    position: [0, 1.6, 102.0],
    radius: 2.8,
  },

  // 14. RESIDENTIAL BEAT CAVE
  {
    id: "residential_beat_cave",
    type: "terminal",
    name: "THE BEAT CAVE Loft",
    label: "BEAT CAVE",
    actionText: "EXAMINE BEAT CAVE",
    message: "BEAT CAVE STUDIO LOFT // ANALOG 808 SAMPLER SESSION IN PROGRESS",
    room: "OUTSIDE",
    position: [-40.0, 1.6, 43.0],
    radius: 3.2,
  },

  // 15. RESIDENTIAL VINYL ARCHIVE
  {
    id: "residential_vinyl_archive",
    type: "terminal",
    name: "VINYL ARCHIVE STOREFRONT",
    label: "VINYL ARCHIVE",
    actionText: "EXAMINE VINYL ARCHIVE",
    message: "VINYL ARCHIVE // RARE TEST PRESSINGS & UNDERGROUND WAX VAULT",
    room: "OUTSIDE",
    position: [-40.0, 1.6, 57.0],
    radius: 3.2,
  },
];

// Environmental Secrets Registry (4 hidden discoveries across the facility)
export const WORLD_SECRETS: WorldInteractable[] = [
  {
    id: "SECRET_01_STUDIO",
    type: "terminal",
    name: "HIDDEN PATCH BAY",
    label: "ANOMALY 01",
    actionText: "EXAMINE",
    message: "SIGNAL DETECTED // HIDDEN PATCH BAY: 'NODE 04 CARRIER FREQ 108.4 MHZ'",
    room: "MAIN STUDIO",
    position: [3.8, 0.7, -3.2],
    radius: 1.6,
  },
  {
    id: "SECRET_02_CORRIDOR",
    type: "terminal",
    name: "WALL CIPHER",
    label: "CIPHER 02",
    actionText: "EXAMINE",
    message: "ARCHIVE ANOMALY // WALL CIPHER: 'THE VAULT REMEMBERS WHAT WAS ERASED'",
    room: "MAIN STUDIO",
    position: [-7.0, 1.6, 1.1],
    radius: 1.6,
  },
  {
    id: "SECRET_03_CINEMA",
    type: "terminal",
    name: "CONCEALED OPTICAL BREAKER",
    label: "SWITCH 03",
    actionText: "EXAMINE",
    message: "UNKNOWN NODE // OPTICAL BREAKER: 'PROJECTION BEAM OVERRIDE 03:47'",
    room: "CINEMA",
    position: [-5.6, 1.4, -13.5],
    radius: 1.6,
  },
  {
    id: "SECRET_04_ARCHIVE",
    type: "terminal",
    name: "CONCEALED DATA CANISTER",
    label: "CANISTER 04",
    actionText: "EXAMINE",
    message: "CONCEALED DATA TAPE // ANOMALY: 'NODE 04 WAS NOT BUILT FOR STORAGE'",
    room: "ARCHIVE",
    position: [3.2, 0.7, -31.5],
    radius: 1.6,
  },
];

// Unified list of all interactables
export const ALL_WORLD_INTERACTABLES: WorldInteractable[] = [
  ...WORLD_COLLECTIBLES,
  ...WORLD_EQUIPMENT_INTERACTABLES,
  ...WORLD_SECRETS,
];

// Walkable Room Bounding Boxes (for multi-room collision and navigation)
export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  name: string;
}

export const WALKABLE_BOUNDS: BoundingBox2D[] = [
  // 1. Main Studio (Central Hub)
  { minX: -4.8, maxX: 4.8, minZ: -4.8, maxZ: 4.8, name: "Main Studio" },
  // West Corridor (to Beat Room)
  { minX: -9.5, maxX: -4.5, minZ: -1.2, maxZ: 1.2, name: "West Corridor" },
  // 2. Beat Room
  { minX: -18.6, maxX: -9.0, minZ: -3.8, maxZ: 3.8, name: "Beat Room" },
  // East Corridor (to CCTV Room)
  { minX: 4.5, maxX: 9.5, minZ: -1.2, maxZ: 1.2, name: "East Corridor" },
  // 3. CCTV Room
  { minX: 9.0, maxX: 18.6, minZ: -3.8, maxZ: 3.8, name: "CCTV Room" },
  // North Hallway 1 (Main Studio to Cinema)
  { minX: -1.2, maxX: 1.2, minZ: -11.5, maxZ: -4.5, name: "North Hallway 1" },
  // 4. Cinema / Projection Room
  { minX: -5.8, maxX: 5.8, minZ: -20.6, maxZ: -11.0, name: "Cinema Room" },
  // North Hallway 2 (Cinema to Archive)
  { minX: -1.2, maxX: 1.2, minZ: -25.8, maxZ: -20.2, name: "North Hallway 2" },
  // 5. Archive / Unknown Area
  { minX: -3.8, maxX: 3.8, minZ: -34.0, maxZ: -25.4, name: "Archive Area" },
  // 6. Node 04 Secret Chamber (Unlocked Vault)
  { minX: -3.6, maxX: 3.6, minZ: -41.5, maxZ: -34.0, name: "Node 04 Chamber" },

  // South Exit Corridor (to Outside Portal)
  { minX: -1.8, maxX: 1.8, minZ: 4.8, maxZ: 9.8, name: "Facility Exit Corridor" },

  // --- OUTDOOR WORLD ZONES ---
  // Outdoor Bunker Courtyard & Access Road
  { minX: -24.0, maxX: 24.0, minZ: 21.0, maxZ: 36.0, name: "Facility Entrance" },
  // Central Park & Sculpture Plaza
  { minX: -32.0, maxX: 32.0, minZ: 36.0, maxZ: 78.0, name: "Central Park" },
  // Residential Street & Houses Area (West)
  { minX: -58.0, maxX: -28.0, minZ: 36.0, maxZ: 78.0, name: "Residential District" },
  // Commercial & Sound District (East)
  { minX: 28.0, maxX: 58.0, minZ: 36.0, maxZ: 78.0, name: "Commercial District" },
  // Northern Scenic Overlook & Hillside
  { minX: -58.0, maxX: 58.0, minZ: 78.0, maxZ: 115.0, name: "Scenic Overlook" },
];

// Solid Obstacles (Player cannot walk through these)
export const OBSTACLE_BOUNDS: BoundingBox2D[] = [
  // Underground Obstacles
  // Main Studio Mixing Desk
  { minX: -1.8, maxX: 1.8, minZ: -3.4, maxZ: -1.4, name: "Studio Desk" },
  // Beat Room Central Sampler Table
  { minX: -15.0, maxX: -11.5, minZ: -0.8, maxZ: 1.2, name: "Beat Sampler Table" },
  // CCTV Control Console
  { minX: 13.0, maxX: 17.0, minZ: -1.0, maxZ: 1.0, name: "CCTV Console" },
  // Cinema Projector Stand
  { minX: -0.8, maxX: 0.8, minZ: -13.2, maxZ: -11.8, name: "Cinema Projector Stand" },
  // Cinema Seats Row 1
  { minX: -3.5, maxX: 3.5, minZ: -16.2, maxZ: -15.2, name: "Cinema Seats Row" },
  // Archive Storage Crates
  { minX: -3.4, maxX: -1.8, minZ: -29.2, maxZ: -27.0, name: "Archive Storage" },
  // Node 04 Mainframe Desk
  { minX: -1.6, maxX: 1.6, minZ: -40.5, maxZ: -38.5, name: "Node 04 Desk" },

  // --- OUTDOOR SOLID OBSTACLES ---
  // Bunker Left & Right Outer Walls
  { minX: -6.0, maxX: -1.6, minZ: 21.0, maxZ: 25.5, name: "Bunker Left Wing" },
  { minX: 1.6, maxX: 6.0, minZ: 21.0, maxZ: 25.5, name: "Bunker Right Wing" },

  // Residential Houses (West)
  { minX: -54.0, maxX: -38.0, minZ: 38.0, maxZ: 48.0, name: "House 01" },
  { minX: -54.0, maxX: -38.0, minZ: 52.0, maxZ: 62.0, name: "House 02" },
  { minX: -54.0, maxX: -38.0, minZ: 66.0, maxZ: 76.0, name: "House 03" },

  // Commercial Buildings (East)
  { minX: 38.0, maxX: 54.0, minZ: 40.0, maxZ: 54.0, name: "Audio Labs Building" },
  { minX: 38.0, maxX: 54.0, minZ: 60.0, maxZ: 74.0, name: "Cinema Lounge Building" },

  // Central Monument Base
  { minX: -2.4, maxX: 2.4, minZ: 53.5, maxZ: 56.5, name: "Park Monument Base" },
];

export interface SafeSpawnPoint {
  id: string;
  roomName: string;
  coordinates: [number, number, number];
  description: string;
  requiresNode04?: boolean;
}

export const SAFE_SPAWN_POINTS: SafeSpawnPoint[] = [
  {
    id: "SPAWN_STUDIO",
    roomName: "MAIN STUDIO",
    coordinates: [0, 1.65, 2.5],
    description: "FACILITY LEVEL -2 • CENTRAL PRODUCTION HUB",
  },
  {
    id: "SPAWN_BEAT",
    roomName: "BEAT ROOM",
    coordinates: [-14.0, 1.65, 2.0],
    description: "WEST WING • MUSIC ARCHIVE & ANALOG SAMPLERS",
  },
  {
    id: "SPAWN_CCTV",
    roomName: "CCTV ROOM",
    coordinates: [13.5, 1.65, 2.0],
    description: "EAST WING • SURVEILLANCE & SECURITY GRID",
  },
  {
    id: "SPAWN_CINEMA",
    roomName: "CINEMA",
    coordinates: [0, 1.65, -14.2],
    description: "NORTH WING • 35MM OPTICAL PROJECTION ROOM",
  },
  {
    id: "SPAWN_ARCHIVE",
    roomName: "ARCHIVE",
    coordinates: [0, 1.65, -28.0],
    description: "DEEP NORTH • RESTRICTED STORAGE AREA",
    requiresNode04: false,
  },
  {
    id: "SPAWN_NODE04",
    roomName: "NODE 04 VAULT",
    coordinates: [0, 1.65, -38.0],
    description: "CLASSIFIED • SECRET ARCHIVAL VAULT",
    requiresNode04: true,
  },
  {
    id: "SPAWN_OUTSIDE",
    roomName: "OUTDOOR PARK",
    coordinates: [0, 1.65, 36.0],
    description: "SURFACE LEVEL • CENTRAL PARK & OUTDOOR DISTRICT",
  },
];

// Phase B: Safe Outdoor Vehicle Reset Coordinates
export const SAFE_VEHICLE_SPAWNS: [number, number, number][] = [
  [0, 0.45, 30.0],     // Bunker Courtyard Road
  [0, 0.45, 48.0],     // Central Park Boulevard
  [-32.0, 0.45, 55.0],  // Residential Cross Avenue
  [32.0, 0.45, 55.0],   // Commercial Audio Labs Drive
  [0, 0.45, 90.0],     // Scenic Overlook Highway
];

