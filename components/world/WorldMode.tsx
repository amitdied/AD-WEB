"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Terminal, Radio, Disc, Disc3 } from "lucide-react";
import type { WorldInteractable } from "./worldData";
import { WORLD_COLLECTIBLES } from "./worldData";
import { BeatArchiveTerminal } from "./BeatArchiveTerminal";
import { CCTVTerminal } from "./CCTVTerminal";
import { CinemaTerminal, type PortfolioVideo } from "./CinemaTerminal";
import { Node04Terminal } from "./Node04Terminal";
import { WorldMinimap } from "./WorldMinimap";
import { FriendNPCData } from "./NPCSystem";
import {
  ARTIFACT_MESSAGES,
  SECRET_MESSAGES,
  checkNode04Unlocked,
  getProgressionMilestoneMessage,
  REQUIRED_ARTIFACTS_COUNT,
  TOTAL_SECRETS_COUNT,
} from "./worldProgression";

// Client-only dynamic import of the 3D Multi-Room World Scene
const WorldScene = dynamic(
  () => import("./WorldScene").then((mod) => mod.WorldScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-black font-mono text-xs text-zinc-500 tracking-[0.3em] uppercase">
        LOADING 3D UNDERGROUND FACILITY...
      </div>
    ),
  }
);

interface WorldModeProps {
  stage: "entering" | "open" | "exiting";
  onExit: () => void;
  onEntered: () => void;
  onExited: () => void;
}

export interface LandmarkOverlayData {
  title: string;
  tag: string;
  subhead: string;
  accessLevel: string;
  description: string;
  stats: string[];
  accentColor: "red" | "purple" | "amber" | "cyan" | "sky" | "orange";
}

export function WorldMode({
  stage,
  onExit,
  onEntered,
  onExited,
}: WorldModeProps) {
  const [worldStatus, setWorldStatus] = useState<"initializing" | "online">(
    "initializing"
  );
  const [hoveredItem, setHoveredItem] = useState<WorldInteractable | null>(null);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [discoveredArtifactIds, setDiscoveredArtifactIds] = useState<string[]>([]);
  const [discoveredSecretIds, setDiscoveredSecretIds] = useState<string[]>([]);
  const [isNode04DoorOpen, setIsNode04DoorOpen] = useState(false);
  const [isNode04TerminalOpen, setIsNode04TerminalOpen] = useState(false);
  const [projectorActive, setProjectorActive] = useState(false);
  const [isBeatArchiveOpen, setIsBeatArchiveOpen] = useState(false);
  const [isCctvTerminalOpen, setIsCctvTerminalOpen] = useState(false);
  const [isCinemaTerminalOpen, setIsCinemaTerminalOpen] = useState(false);
  const [selectedCinemaProject, setSelectedCinemaProject] = useState<PortfolioVideo | null>(null);
  const [cameraMode, setCameraMode] = useState<"FPP" | "TPP">("FPP");
  const [navMode, setNavMode] = useState<"CHARACTER" | "VEHICLE">("CHARACTER");
  const [vehicleSpeedKmh, setVehicleSpeedKmh] = useState(0);
  const [isNearVehicle, setIsNearVehicle] = useState(false);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 1.65, 2.5]);
  const [playerYaw, setPlayerYaw] = useState<number>(0);
  const [teleportTarget, setTeleportTarget] = useState<[number, number, number] | null>(null);
  const [nearbyFriend, setNearbyFriend] = useState<FriendNPCData | null>(null);
  const [friendDialogue, setFriendDialogue] = useState<{ friend: FriendNPCData; lineIndex: number } | null>(null);
  const [landmarkOverlayData, setLandmarkOverlayData] = useState<LandmarkOverlayData | null>(null);

  const handleToggleNavMode = useCallback(() => {
    setNavMode((prev) => {
      const next = prev === "CHARACTER" ? "VEHICLE" : "CHARACTER";
      setActiveMessage(
        next === "VEHICLE"
          ? "VEHICLE MODE // AMITDIED BUGGY ONLINE [W/A/S/D TO DRIVE • R TO RESET • E TO EXIT]"
          : "CHARACTER MODE // DISMOUNTED ON FOOT"
      );
      return next;
    });
  }, []);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  const totalCollectibles = REQUIRED_ARTIFACTS_COUNT; // 8 collectibles
  const totalSecrets = TOTAL_SECRETS_COUNT; // 4 secrets
  const isNode04Unlocked = checkNode04Unlocked(discoveredArtifactIds, discoveredSecretIds);

  const toggleCameraMode = useCallback(() => {
    setCameraMode((prev) => (prev === "FPP" ? "TPP" : "FPP"));
  }, []);

  const handlePlayerPositionChange = useCallback(
    (pos: [number, number, number], yaw: number) => {
      setPlayerPos(pos);
      setPlayerYaw(yaw);
    },
    []
  );

  const handleTeleport = useCallback(
    (coordinates: [number, number, number], roomName: string) => {
      setTeleportTarget(coordinates);
      setActiveMessage(`WARP // TRANSFERRED TO ${roomName.toUpperCase()}`);
    },
    []
  );

  const handleTeleportHandled = useCallback(() => {
    setTeleportTarget(null);
  }, []);

  const cinemaScreenState: "offline" | "idle" | "projecting" =
    isCinemaTerminalOpen && selectedCinemaProject
      ? "projecting"
      : isCinemaTerminalOpen || projectorActive
      ? "idle"
      : "offline";

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Detect mobile / touch environment
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll while World Mode is active
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };
  }, []);

  // Handle Escape & Space keys for Dialogue and Exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (friendDialogue) {
          e.preventDefault();
          if (friendDialogue.lineIndex < friendDialogue.friend.dialogue.length - 1) {
            setFriendDialogue((prev) => (prev ? { ...prev, lineIndex: prev.lineIndex + 1 } : null));
          } else {
            setFriendDialogue(null);
          }
          return;
        } else if (
          nearbyFriend &&
          !isBeatArchiveOpen &&
          !isCctvTerminalOpen &&
          !isCinemaTerminalOpen &&
          !isNode04TerminalOpen
        ) {
          e.preventDefault();
          if (document.pointerLockElement) {
            document.exitPointerLock?.();
          }
          setFriendDialogue({ friend: nearbyFriend, lineIndex: 0 });
          return;
        }
      }

      if (e.key === "Escape" && stage === "open") {
        if (landmarkOverlayData) {
          e.preventDefault();
          setLandmarkOverlayData(null);
          return;
        }
        if (friendDialogue) {
          e.preventDefault();
          setFriendDialogue(null);
          return;
        }
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    stage,
    onExit,
    friendDialogue,
    landmarkOverlayData,
    nearbyFriend,
    isBeatArchiveOpen,
    isCctvTerminalOpen,
    isCinemaTerminalOpen,
    isNode04TerminalOpen,
  ]);

  // Transition from "entering" to "open" and status progression
  useEffect(() => {
    if (stage === "entering") {
      const enterTimer = setTimeout(() => {
        onEntered();
      }, 900); // 900ms transition time (within 700-1200ms spec)

      return () => clearTimeout(enterTimer);
    }
  }, [stage, onEntered]);

  // "INITIALIZING WORLD..." -> "WORLD ONLINE"
  useEffect(() => {
    let statusTimer: NodeJS.Timeout;
    if (stage === "open") {
      statusTimer = setTimeout(() => {
        setWorldStatus("online");
      }, 1000);
    } else {
      statusTimer = setTimeout(() => {
        setWorldStatus("initializing");
      }, 0);
    }

    return () => clearTimeout(statusTimer);
  }, [stage]);

  // Handle exit completion
  useEffect(() => {
    if (stage === "exiting") {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      const exitTimer = setTimeout(() => {
        onExited();
      }, 700);

      return () => clearTimeout(exitTimer);
    }
  }, [stage, onExited]);

  // Handle interaction, terminal opening, and collectible discovery
  const handleInteract = useCallback(
    (item: WorldInteractable) => {
      if (item.id === "BEAT_ARCHIVE_TERMINAL") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setIsBeatArchiveOpen(true);
      }
      if (item.id === "CCTV_TERMINAL") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setIsCctvTerminalOpen(true);
      }
      if (item.id === "CINEMA_TERMINAL" || item.id === "CINEMA_PROJECTOR") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setIsCinemaTerminalOpen(true);
        setProjectorActive(true);
      }
      if (item.id === "NODE_04_TERMINAL") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setIsNode04TerminalOpen(true);
      }
      if (item.id === "NODE_04_DOOR") {
        if (isNode04Unlocked) {
          setIsNode04DoorOpen((prev) => !prev);
          setActiveMessage(
            isNode04DoorOpen
              ? "BLAST DOOR // NODE 04 SEALED"
              : "BLAST DOOR // LEVEL 04 CLEARANCE ACCEPTED — VAULT OPENING"
          );
          return;
        } else {
          setActiveMessage(
            `NODE 04 // ACCESS DENIED — REQUIRED: 08 ARTIFACTS [${discoveredArtifactIds.length}/08] & 02 ANOMALIES [${discoveredSecretIds.length}/02]`
          );
          return;
        }
      }

      if (item.id === "FACILITY_EXIT") {
        setTeleportTarget([0, 1.65, 25.5]);
        setActiveMessage("SURFACE ACCESS // ASCENDING TO AMITDIED OUTDOOR DISTRICT...");
        return;
      }
      if (item.id === "FACILITY_ENTRANCE") {
        setTeleportTarget([0, 1.65, 7.8]);
        setActiveMessage("SECURITY AIRLOCK // DESCENDING TO UNDERGROUND FACILITY LEVEL -2...");
        return;
      }

      // Landmark Modal Overlays
      if (item.id === "audio_labs_exterior") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setLandmarkOverlayData({
          title: "AMITDIED AUDIO LABS",
          tag: "HEADQUARTERS",
          subhead: "RECORDING / MIXING / MASTERING HEADQUARTERS",
          accessLevel: "ACCESS LEVEL: PUBLIC EXHIBIT",
          description: "Analog 808 bus consoles, vacuum tube saturators, and multitrack tape decks online. The main production engine of the AMITDIED sound universe.",
          stats: ["STATUS: ONLINE 24/7", "FORMAT: 96KHZ / 32-BIT FLOAT", "GEAR: ANALOG CONSOLES & SYNTHS"],
          accentColor: "red",
        });
        return;
      }

      if (item.id === "cinema_lounge_exterior") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setLandmarkOverlayData({
          title: "35MM CINEMA LOUNGE & CAFE",
          tag: "VENUE LANDMARK",
          subhead: "ARCHIVE SCREENINGS & VINYL LOUNGE",
          accessLevel: "NOW SHOWING: AMITDIED VISUALS",
          description: "Optical 35mm projection system streaming archival film reels, music videos, and unreleased stems while serving espresso.",
          stats: ["STATUS: OPEN TO VISITORS", "AUDIO: 35MM OPTICAL & WAX", "BEVERAGES: ESPRESSO & COLD BREW"],
          accentColor: "purple",
        });
        return;
      }

      if (item.id === "sound_monument") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setLandmarkOverlayData({
          title: "CENTRAL SOUND MONUMENT",
          tag: "ACOUSTIC MONOLITH",
          subhead: "RESONATING FREQUENCY SCULPTURE",
          accessLevel: "FREQUENCY: 108.4 MHZ",
          description: "Central acoustic tower pulsing synchronously with the master audio bass spectrum across the Central Park Vinyl Plaza.",
          stats: ["RESONANCE: BASS BARS ACTIVE", "LOCATION: CENTRAL PARK", "SUBWOOFERS: 808 CUSTOM TUNED"],
          accentColor: "amber",
        });
        return;
      }

      if (item.id === "scenic_telescope") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setLandmarkOverlayData({
          title: "OBSERVATION TELESCOPE",
          tag: "SCENIC OVERLOOK",
          subhead: "ELEVATION +24M VISTA POINT",
          accessLevel: "LIVE PANORAMIC VIEW",
          description: "Panoramic view across the AMITDIED Audio District, Central Park, and the transmission tower broadcasting live across the valley.",
          stats: ["VISIBILITY: 100%", "SKYLINE: MOUNTAIN HORIZON", "BROADCAST: TRANSMISSION TOWER ACTIVE"],
          accentColor: "cyan",
        });
        return;
      }

      if (item.id === "residential_beat_cave") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setLandmarkOverlayData({
          title: "THE BEAT CAVE",
          tag: "STUDIO LOFT",
          subhead: "ANALOG 808 SAMPLER HAVEN",
          accessLevel: "CREATIVE RESIDENCE",
          description: "Private studio loft outfitted with vintage drum machines, analog samplers, and acoustic dampening panels.",
          stats: ["LOFT: 01", "EQUIPMENT: HARDWARE SAMPLERS", "BEAT RATE: 140 BPM TRAP"],
          accentColor: "sky",
        });
        return;
      }

      if (item.id === "residential_vinyl_archive") {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setLandmarkOverlayData({
          title: "VINYL ARCHIVE STOREFRONT",
          tag: "RECORD SHOP",
          subhead: "RARE WAX & TEST PRESSINGS",
          accessLevel: "ARCHIVE COLLECTION",
          description: "Curated collection of unreleased test pressings, 12-inch dubplates, and underground tape cassettes.",
          stats: ["COLLECTION: 100+ CUTS", "RPM: 33 / 45 / 78", "VAULT: DUBPLATE SELECTION"],
          accentColor: "orange",
        });
        return;
      }

      // Collectible Music Artifacts
      if (item.isCollectible) {
        if (!discoveredArtifactIds.includes(item.id)) {
          const nextArtifacts = [...discoveredArtifactIds, item.id];
          setDiscoveredArtifactIds(nextArtifacts);

          const milestone = getProgressionMilestoneMessage(
            discoveredArtifactIds.length,
            nextArtifacts.length,
            discoveredSecretIds.length,
            discoveredSecretIds.length
          );

          const artifactDesc = ARTIFACT_MESSAGES[item.id] || item.message;
          setActiveMessage(
            milestone ? `${milestone} • ${artifactDesc}` : artifactDesc
          );
          return;
        } else {
          setActiveMessage(`${item.name} // ALREADY CATALOGUED IN ARCHIVE`);
          return;
        }
      }

      // Hidden Secrets & Facility Anomalies
      if (item.id.startsWith("SECRET_")) {
        if (!discoveredSecretIds.includes(item.id)) {
          const nextSecrets = [...discoveredSecretIds, item.id];
          setDiscoveredSecretIds(nextSecrets);

          const milestone = getProgressionMilestoneMessage(
            discoveredArtifactIds.length,
            discoveredArtifactIds.length,
            discoveredSecretIds.length,
            nextSecrets.length
          );

          const secretDesc = SECRET_MESSAGES[item.id] || item.message;
          setActiveMessage(
            milestone ? `${milestone} • ${secretDesc}` : secretDesc
          );
          return;
        } else {
          setActiveMessage(`${item.name} // ANOMALY LOGGED IN MEMORY`);
          return;
        }
      }

      setActiveMessage(`${item.name} // ${item.message}`);
    },
    [
      discoveredArtifactIds,
      discoveredSecretIds,
      isNode04Unlocked,
      isNode04DoorOpen,
    ]
  );

  const handleToggleProjector = useCallback(() => {
    setProjectorActive((prev) => !prev);
  }, []);

  // Auto-dismiss interaction message after 4.2 seconds
  useEffect(() => {
    if (!activeMessage) return;
    const timer = setTimeout(() => {
      setActiveMessage(null);
    }, 4200);
    return () => clearTimeout(timer);
  }, [activeMessage]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AMITDIED World"
      className="fixed inset-0 z-[200] overflow-hidden select-none bg-black text-zinc-100 font-mono"
    >
      {/* ======================================================== */}
      {/* 1. CINEMATIC TRANSITION OVERLAY */}
      {/* ======================================================== */}
      <AnimatePresence>
        {(stage === "entering" || stage === "exiting") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.3 : 0.45, ease: "easeInOut" }}
            className="absolute inset-0 z-50 pointer-events-none bg-black flex items-center justify-center"
          >
            {!reducedMotion && (
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1, 0.2, 0.8, 0],
                  opacity: [0, 0.9, 0.4, 0.7, 0],
                }}
                transition={{ duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] }}
                className="absolute inset-x-0 h-1 bg-red-600/80 shadow-[0_0_20px_rgba(220,38,38,0.9)]"
              />
            )}
            <div className="text-[11px] tracking-[0.3em] uppercase text-zinc-500 font-mono animate-pulse">
              {stage === "entering"
                ? "INITIALIZING UNDERGROUND FACILITY..."
                : "RETURNING TO MAINFRAME..."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. 3D EXPLORABLE SCENE (ACTIVE ONLY WHEN OPEN) */}
      {/* ======================================================== */}
      {stage === "open" && (
        <WorldScene
          onHoverInteractable={setHoveredItem}
          onInteract={handleInteract}
          reducedMotion={reducedMotion}
          projectorActive={projectorActive}
          onToggleProjector={handleToggleProjector}
          isCctvTerminalOpen={isCctvTerminalOpen}
          isCinemaTerminalOpen={isCinemaTerminalOpen}
          cinemaScreenState={cinemaScreenState}
          discoveredArtifactIds={discoveredArtifactIds}
          discoveredSecretIds={discoveredSecretIds}
          isNode04Unlocked={isNode04Unlocked}
          isNode04DoorOpen={isNode04DoorOpen}
          onPlayerPositionChange={handlePlayerPositionChange}
          teleportTarget={teleportTarget}
          onTeleportHandled={handleTeleportHandled}
          cameraMode={cameraMode}
          onCameraModeChange={setCameraMode}
          onZoneTransition={(zone) => setActiveMessage(zone)}
          onNearbyFriendChange={setNearbyFriend}
          navMode={navMode}
          onToggleNavMode={handleToggleNavMode}
          onVehicleSpeedChange={setVehicleSpeedKmh}
          onVehicleProximityChange={setIsNearVehicle}
        />
      )}

      {/* ======================================================== */}
      {/* 3. ATMOSPHERIC POST OVERLAYS (CRT, SCANLINES, VIGNETTE) */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Subtle atmospheric ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(160,20,20,0.03)_0%,transparent_70%,rgba(0,0,0,0.25)_100%)]" />

        {/* Ambient Grain Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] mix-blend-overlay" />

        {/* CRT Scanline layer */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_3px,3px_100%] opacity-15 mix-blend-overlay" />

        {/* Soft Cinematic Edge Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_65%,rgba(0,0,0,0.25)_100%)]" />
      </div>

      {/* ======================================================== */}
      {/* 4. CENTER CROSSHAIR & INTERACTION PROMPT */}
      {/* ======================================================== */}
      {stage === "open" && (
        <>
          {/* Center Minimal Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                hoveredItem
                  ? "bg-red-500 scale-150 shadow-[0_0_10px_rgba(220,38,38,1)] ring-2 ring-red-500/40"
                  : "bg-white/70"
              }`}
            />
          </div>

          {/* Prompt on Hover: [SPACE] EXAMINE // VINYL 001 */}
          {hoveredItem && !activeMessage && (
            <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
              <div className="px-3.5 py-1.5 bg-black/85 backdrop-blur-md border border-red-600/70 rounded text-[11px] font-mono tracking-[0.2em] text-white flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <kbd className="px-1.5 py-0.5 bg-red-950 border border-red-800 rounded text-[10px] text-red-300 font-bold">
                  SPACE
                </kbd>
                <span>
                  {hoveredItem.actionText} {"// "} {hoveredItem.label}
                </span>
              </div>
            </div>
          )}

          {/* Active Interaction Message Banner */}
          <AnimatePresence>
            {activeMessage &&
              !isBeatArchiveOpen &&
              !isCctvTerminalOpen &&
              !isCinemaTerminalOpen &&
              !isNode04TerminalOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none max-w-xl w-full px-4"
                >
                  <div className="p-4 bg-zinc-950/95 border border-red-600/90 rounded-lg shadow-[0_0_35px_rgba(220,38,38,0.5)] font-mono text-center space-y-1.5 backdrop-blur-md">
                    <div className="text-[10px] tracking-[0.25em] text-red-500 font-bold uppercase flex items-center justify-center gap-2">
                      <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                      <span>SYSTEM INTERCEPT</span>
                    </div>
                    <div className="text-xs sm:text-sm text-white tracking-wider font-semibold">
                      {activeMessage}
                    </div>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* In-World Beat Archive Terminal UI */}
          <AnimatePresence>
            {isBeatArchiveOpen && (
              <BeatArchiveTerminal onClose={() => setIsBeatArchiveOpen(false)} />
            )}
          </AnimatePresence>

          {/* LANDMARK DETAIL OVERLAY MODAL */}
          <AnimatePresence>
            {landmarkOverlayData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto font-mono"
                onClick={() => setLandmarkOverlayData(null)}
              >
                <div
                  className="relative w-full max-w-lg bg-zinc-950 border-2 border-red-500/80 rounded-xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] text-zinc-100 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-950/80 border border-red-500/60 rounded text-[9px] font-bold tracking-widest text-red-400 uppercase">
                          {landmarkOverlayData.tag}
                        </span>
                        <span className="text-[10px] text-zinc-500 tracking-wider">AMITDIED LANDMARK</span>
                      </div>
                      <h2 className="text-xl font-bold tracking-wide text-white mt-1">
                        {landmarkOverlayData.title}
                      </h2>
                      <p className="text-xs text-red-400/90 tracking-widest mt-0.5">
                        {landmarkOverlayData.subhead}
                      </p>
                    </div>
                    <button
                      onClick={() => setLandmarkOverlayData(null)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer font-bold"
                    >
                      [ESC] CLOSE
                    </button>
                  </div>

                  {/* Access Level Badge */}
                  <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded border border-zinc-800 text-xs tracking-wider text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>{landmarkOverlayData.accessLevel}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-zinc-300 leading-relaxed tracking-wide">
                    {landmarkOverlayData.description}
                  </p>

                  {/* Telemetry & Specs */}
                  <div className="pt-2 border-t border-zinc-900 space-y-2">
                    <div className="text-[10px] tracking-widest text-zinc-500 uppercase font-bold">TELEMETRY & SPECS</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                      {landmarkOverlayData.stats.map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-black/60 px-2.5 py-1.5 rounded border border-zinc-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="truncate">{stat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
                    <span>AMITDIED WORLD • OUTDOOR DISTRICT</span>
                    <span>PRESS [ESC] OR CLICK TO RETURN</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* In-World CCTV Surveillance Terminal UI */}
          <AnimatePresence>
            {isCctvTerminalOpen && (
              <CCTVTerminal onClose={() => setIsCctvTerminalOpen(false)} />
            )}
          </AnimatePresence>

          {/* In-World Cinema Projection Terminal UI */}
          <AnimatePresence>
            {isCinemaTerminalOpen && (
              <CinemaTerminal
                onClose={() => setIsCinemaTerminalOpen(false)}
                onProjectSelect={(project) => setSelectedCinemaProject(project)}
              />
            )}
          </AnimatePresence>

          {/* In-World Node 04 Secret Chamber Terminal UI */}
          <AnimatePresence>
            {isNode04TerminalOpen && (
              <Node04Terminal
                onClose={() => setIsNode04TerminalOpen(false)}
                artifactsCount={discoveredArtifactIds.length}
                secretsCount={discoveredSecretIds.length}
              />
            )}
          </AnimatePresence>

          {/* PROXIMITY VEHICLE ENTRY PROMPT */}
          {isNearVehicle && navMode === "CHARACTER" && !friendDialogue && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-zinc-950/90 border border-amber-500/80 px-4 py-2 rounded-lg text-amber-400 font-mono text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse pointer-events-auto">
              <span className="font-bold tracking-widest">AMITDIED BUGGY</span>
              <span className="text-zinc-600">•</span>
              <button
                onClick={handleToggleNavMode}
                className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded font-bold cursor-pointer transition-colors"
              >
                <kbd className="bg-amber-900/60 px-1.5 py-0.2 rounded text-[10px]">E</kbd>
                <span>ENTER VEHICLE</span>
              </button>
            </div>
          )}

          {/* PROXIMITY FRIEND TALK PROMPT */}
          {nearbyFriend && !friendDialogue && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-zinc-950/90 border border-amber-500/60 px-4 py-2 rounded-lg text-amber-400 font-mono text-xs shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse pointer-events-auto">
              <span className="font-bold tracking-widest">{nearbyFriend.name}</span>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => {
                  if (document.pointerLockElement) {
                    document.exitPointerLock?.();
                  }
                  setFriendDialogue({ friend: nearbyFriend, lineIndex: 0 });
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded font-bold cursor-pointer"
              >
                <kbd className="bg-amber-900/60 px-1 py-0.2 rounded text-[10px]">SPACE</kbd>
                <span>TALK</span>
              </button>
            </div>
          )}

          {/* FRIEND NPC DIALOGUE OVERLAY */}
          <AnimatePresence>
            {friendDialogue && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-x-0 bottom-24 z-50 max-w-xl mx-auto px-4 pointer-events-auto"
              >
                <div className="bg-zinc-950/95 border-2 border-amber-500/80 rounded-lg p-5 shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-md">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-amber-400 font-bold text-sm tracking-widest font-mono">
                        {friendDialogue.friend.name}
                      </span>
                      <span className="text-zinc-500 text-xs font-mono">• AMITDIED OUTDOOR</span>
                    </div>
                    <button
                      onClick={() => setFriendDialogue(null)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs font-mono cursor-pointer"
                    >
                      [ESC]
                    </button>
                  </div>

                  <p className="py-4 text-zinc-100 font-mono text-sm leading-relaxed tracking-wide min-h-[60px]">
                    &quot;{friendDialogue.friend.dialogue[friendDialogue.lineIndex]}&quot;
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs text-zinc-400 font-mono">
                    <span className="text-zinc-500 text-[10px]">
                      {friendDialogue.lineIndex + 1} / {friendDialogue.friend.dialogue.length}
                    </span>
                    <button
                      onClick={() => {
                        if (friendDialogue.lineIndex < friendDialogue.friend.dialogue.length - 1) {
                          setFriendDialogue({
                            ...friendDialogue,
                            lineIndex: friendDialogue.lineIndex + 1,
                          });
                        } else {
                          setFriendDialogue(null);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded text-xs font-bold tracking-wider cursor-pointer transition-colors"
                    >
                      <span>
                        {friendDialogue.lineIndex < friendDialogue.friend.dialogue.length - 1
                          ? "NEXT [SPACE]"
                          : "CLOSE [SPACE]"}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* In-World Interactive Minimap Widget & Expanded Schematic */}
          <WorldMinimap
            playerPos={playerPos}
            playerYaw={playerYaw}
            isNode04Unlocked={isNode04Unlocked}
            discoveredArtifactIds={discoveredArtifactIds}
            discoveredSecretIds={discoveredSecretIds}
            onTeleport={handleTeleport}
          />
        </>
      )}

      {/* ======================================================== */}
      {/* 5. TOP HUD: NAVIGATION, TELEMETRY & COLLECTIBLE COUNTER */}
      {/* ======================================================== */}
      <header className="relative z-30 p-4 sm:p-7 flex items-start justify-between pointer-events-none">
        {/* Top-Left: Exit Button, World Identity & Progression Counters */}
        <div className="space-y-2.5 pointer-events-auto">
          <button
            onClick={onExit}
            className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-950/85 hover:bg-red-950/50 border border-zinc-800 hover:border-red-600/80 text-zinc-400 hover:text-red-400 text-[10px] tracking-[0.2em] uppercase rounded transition-all cursor-pointer shadow-[0_0_12px_rgba(0,0,0,0.9)]"
            title="Exit AMITDIED World (or press Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>← EXIT WORLD</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              <span>AMITDIED WORLD</span>
            </div>

            {/* Collectibles Counter: ARCHIVE: 00/08 */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-black/80 border border-zinc-800 rounded text-[10px] tracking-[0.2em] text-zinc-400">
              <Disc className="w-3 h-3 text-red-500 animate-spin" style={{ animationDuration: "8s" }} />
              <span className="text-zinc-500">
                {discoveredArtifactIds.length >= totalCollectibles ? "ARCHIVE COMPLETE:" : "ARCHIVE:"}
              </span>
              <span className={discoveredArtifactIds.length >= totalCollectibles ? "text-emerald-400 font-bold" : "text-white font-bold"}>
                {discoveredArtifactIds.length.toString().padStart(2, "0")}/{totalCollectibles.toString().padStart(2, "0")}
              </span>
            </div>

            {/* Secrets Counter: SECRETS: 00/04 */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-black/80 border border-zinc-800 rounded text-[10px] tracking-[0.2em] text-zinc-400">
              <span className="text-zinc-500">SECRETS:</span>
              <span className={discoveredSecretIds.length >= 2 ? "text-cyan-400 font-bold" : "text-white font-bold"}>
                {discoveredSecretIds.length.toString().padStart(2, "0")}/{totalSecrets.toString().padStart(2, "0")}
              </span>
            </div>

            {/* Node 04 Access Status */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-black/80 border border-zinc-800 rounded text-[9px] tracking-[0.2em]">
              <span className="text-zinc-500">NODE 04:</span>
              <span className={isNode04Unlocked ? "text-emerald-400 font-bold" : "text-red-500 font-bold"}>
                {isNode04Unlocked ? "GRANTED" : "LOCKED"}
              </span>
            </div>

            {/* Camera View Mode Badge (FPP ↔ TPP) */}
            <button
              onClick={toggleCameraMode}
              className="flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-950/90 hover:bg-red-950/40 border border-zinc-700/80 hover:border-red-500/80 rounded text-[10px] tracking-[0.2em] text-zinc-300 transition-colors cursor-pointer shadow-sm"
              title="Toggle First Person / Third Person View [V]"
            >
              <span className="text-zinc-500">CAM:</span>
              <span className="text-red-400 font-bold">{cameraMode}</span>
            </button>

            {/* Vehicle Mode Badge */}
            <button
              onClick={handleToggleNavMode}
              className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/80 rounded text-[10px] tracking-[0.2em] text-amber-300 transition-colors cursor-pointer shadow-sm font-mono"
              title="Toggle Character Mode / Vehicle Mode [E]"
            >
              <span className="text-amber-500 font-bold">MODE:</span>
              <span className="text-white font-bold">{navMode}</span>
              {navMode === "VEHICLE" && (
                <>
                  <span className="text-zinc-500">•</span>
                  <span className="text-amber-400 font-bold">{vehicleSpeedKmh} KM/H</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top-Right: Signal, Timestamp & Mobile Notification */}
        <div className="text-right space-y-1.5">
          <div className="text-[10px] tracking-[0.2em] uppercase flex items-center justify-end gap-1.5 text-zinc-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                worldStatus === "online"
                  ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  : "bg-amber-400 animate-ping"
              }`}
            />
            <span className={worldStatus === "online" ? "text-emerald-400" : "text-amber-400"}>
              SIGNAL: ONLINE
            </span>
          </div>

          {/* Location Telemetry */}
          {hoveredItem && (
            <div className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">
              ZONE // {hoveredItem.room}
            </div>
          )}

          {/* Responsive Mobile Badge */}
          {isMobile && (
            <div className="text-[9px] tracking-[0.15em] text-amber-400/90 bg-black/80 px-2 py-0.5 rounded border border-amber-900/40 uppercase">
              AMITDIED WORLD — DESKTOP EXPERIENCE
            </div>
          )}
        </div>
      </header>

      {/* ======================================================== */}
      {/* 6. BOTTOM HUD: CONTROLS & FACILITY IDENTIFIER */}
      {/* ======================================================== */}
      <footer className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-7 flex items-end justify-between text-zinc-500 text-[10px] tracking-[0.2em] uppercase pointer-events-none">
        {/* Bottom-Left Controls HUD */}
        <div className="space-y-1 bg-zinc-950/80 backdrop-blur-md p-2.5 sm:p-3 rounded border border-zinc-900/90 pointer-events-auto">
          <div className="flex items-center gap-2 text-zinc-400">
            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-300 font-bold">
              WASD
            </kbd>
            <span>/ MOVE</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-[9px] text-zinc-500 font-bold">MOUSE</span>
            <span>/ LOOK</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-300 font-bold">
              SPACE
            </kbd>
            <span>/ INTERACT</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-200 font-bold">
              V
            </kbd>
            <span>/ CAM ({cameraMode})</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <kbd className="px-1.5 py-0.5 bg-amber-950 border border-amber-700 rounded text-[9px] text-amber-300 font-bold">
              E
            </kbd>
            <span>/ {navMode === "VEHICLE" ? "EXIT VEHICLE" : "ENTER VEHICLE"}</span>
          </div>
          {navMode === "VEHICLE" && (
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <kbd className="px-1.5 py-0.5 bg-amber-950 border border-amber-700 rounded text-[9px] text-amber-300 font-bold">
                R
              </kbd>
              <span>/ RESET SPAWN</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-red-400/90 font-bold">
            <kbd className="px-1.5 py-0.5 bg-red-950 border border-red-800 rounded text-[9px] text-red-300 font-bold">
              M
            </kbd>
            <span>/ FACILITY MAP</span>
          </div>
          <div className="text-[8px] text-zinc-600 pt-0.5">
            CLICK TO LOCK CAMERA • ESC TO EXIT
          </div>
        </div>

        {/* Bottom-Right System Mode (positioned above minimap on desktop) */}
        <div className="hidden lg:flex items-center gap-2 text-zinc-600 bg-zinc-950/70 p-1.5 px-2 rounded border border-zinc-900/80 mb-[210px]">
          <Terminal className="w-3.5 h-3.5" />
          <span>FACILITY_SECTOR_GRID</span>
        </div>
      </footer>
    </div>
  );
}

export default WorldMode;

