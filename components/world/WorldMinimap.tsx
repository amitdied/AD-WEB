"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, MapPin, Lock, Compass, X, Zap, Sun, Building2, Trees } from "lucide-react";
import {
  SAFE_SPAWN_POINTS,
  SafeSpawnPoint,
  WALKABLE_BOUNDS,
  WORLD_EQUIPMENT_INTERACTABLES,
  WORLD_COLLECTIBLES,
} from "./worldData";

export interface WorldMinimapProps {
  playerPos: [number, number, number];
  playerYaw: number;
  isNode04Unlocked: boolean;
  discoveredArtifactIds?: string[];
  discoveredSecretIds?: string[];
  onTeleport: (coordinates: [number, number, number], roomName: string) => void;
  className?: string;
}

// Underground Coordinate Bounds: X: -22 to +22, Z: -44 to +11
const UG_MIN_X = -22;
const UG_MAX_X = 22;
const UG_MIN_Z = -44;
const UG_MAX_Z = 11;
const UG_TOTAL_W = UG_MAX_X - UG_MIN_X; // 44
const UG_TOTAL_H = UG_MAX_Z - UG_MIN_Z; // 55

// Outdoor Coordinate Bounds: X: -62 to +62, Z: 20 to 115
const OUT_MIN_X = -62;
const OUT_MAX_X = 62;
const OUT_MIN_Z = 20;
const OUT_MAX_Z = 115;
const OUT_TOTAL_W = OUT_MAX_X - OUT_MIN_X; // 124
const OUT_TOTAL_H = OUT_MAX_Z - OUT_MIN_Z; // 95

function ugWorldToMap(x: number, z: number, svgWidth: number, svgHeight: number) {
  const normX = (x - UG_MIN_X) / UG_TOTAL_W;
  const normY = (z - UG_MIN_Z) / UG_TOTAL_H;
  return { x: normX * svgWidth, y: normY * svgHeight };
}

function ugWorldBoxToMap(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  svgWidth: number,
  svgHeight: number
) {
  const topLeft = ugWorldToMap(minX, minZ, svgWidth, svgHeight);
  const width = ((maxX - minX) / UG_TOTAL_W) * svgWidth;
  const height = ((maxZ - minZ) / UG_TOTAL_H) * svgHeight;
  return { x: topLeft.x, y: topLeft.y, width, height };
}

function outWorldToMap(x: number, z: number, svgWidth: number, svgHeight: number) {
  const normX = (x - OUT_MIN_X) / OUT_TOTAL_W;
  const normY = (z - OUT_MIN_Z) / OUT_TOTAL_H;
  return { x: normX * svgWidth, y: normY * svgHeight };
}

function outWorldBoxToMap(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  svgWidth: number,
  svgHeight: number
) {
  const topLeft = outWorldToMap(minX, minZ, svgWidth, svgHeight);
  const width = ((maxX - minX) / OUT_TOTAL_W) * svgWidth;
  const height = ((maxZ - minZ) / OUT_TOTAL_H) * svgHeight;
  return { x: topLeft.x, y: topLeft.y, width, height };
}

export function WorldMinimap({
  playerPos,
  playerYaw,
  isNode04Unlocked,
  discoveredArtifactIds = [],
  discoveredSecretIds = [],
  onTeleport,
  className = "",
}: WorldMinimapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"auto" | "underground" | "outdoor">("auto");
  const [teleportWarning, setTeleportWarning] = useState<string | null>(null);

  // Player zone check: underground if Z <= 15, outdoor if Z > 15
  const isOutdoor = playerPos[2] > 15;
  const effectiveView = activeTab === "auto" ? (isOutdoor ? "outdoor" : "underground") : activeTab;

  // Identify current room
  const currentRoomName = useMemo(() => {
    const [px, , pz] = playerPos;
    const match = WALKABLE_BOUNDS.find(
      (b) => px >= b.minX && px <= b.maxX && pz >= b.minZ && pz <= b.maxZ
    );
    return match ? match.name.toUpperCase() : isOutdoor ? "OUTDOOR DISTRICT" : "FACILITY CORRIDOR";
  }, [playerPos, isOutdoor]);

  // Handle ESC to close expanded map and M to toggle
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey) {
        if (typeof document !== "undefined" && document.pointerLockElement) {
          document.exitPointerLock?.();
        }
        setIsExpanded((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  const handleOpenExpanded = useCallback(() => {
    if (typeof document !== "undefined" && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    setIsExpanded(true);
  }, []);

  const handleSpawnClick = useCallback(
    (spawn: SafeSpawnPoint) => {
      if (spawn.requiresNode04 && !isNode04Unlocked) {
        setTeleportWarning("ACCESS LOCKED — LEVEL 04 CLEARANCE REQUIRED");
        setTimeout(() => setTeleportWarning(null), 3200);
        return;
      }
      setIsExpanded(false);
      onTeleport(spawn.coordinates, spawn.roomName);
    },
    [isNode04Unlocked, onTeleport]
  );

  return (
    <>
      {/* ======================================================== */}
      {/* 1. COMPACT HUD MINIMAP WIDGET (BOTTOM-RIGHT) */}
      {/* ======================================================== */}
      <div
        className={`fixed bottom-4 right-4 z-40 pointer-events-auto select-none ${className}`}
        data-testid="world-minimap"
      >
        <div
          onClick={handleOpenExpanded}
          className="group relative w-[220px] bg-zinc-950/90 hover:bg-black/95 border-2 border-zinc-700/80 hover:border-red-500/80 rounded-lg p-2.5 shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md cursor-pointer transition-all duration-200"
          title="Click to Open Expanded Facility & Outdoor Map [M]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[10px] tracking-[0.2em] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-300 group-hover:text-red-400 font-bold">
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isOutdoor ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" : "bg-red-500"
                }`}
              />
              <span>{isOutdoor ? "MAP // SURFACE" : "MAP // LEVEL -2"}</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-500 group-hover:text-zinc-300">
              <span className="text-[8px] bg-zinc-900 px-1 py-0.2 rounded border border-zinc-700">M</span>
              <Maximize2 className="w-3 h-3" />
            </div>
          </div>

          {/* SVG Map Render (Underground or Outdoor based on player location) */}
          <div className="relative w-full h-[140px] bg-zinc-900/60 rounded border border-zinc-800/80 overflow-hidden flex items-center justify-center">
            <svg
              viewBox="0 0 220 140"
              className="w-full h-full p-1"
              style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.5))" }}
            >
              <defs>
                <radialGradient id="playerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              {!isOutdoor ? (
                /* UNDERGROUND FACILITY COMPACT VIEW */
                <g>
                  {/* Corridors */}
                  {(() => {
                    const b = ugWorldBoxToMap(-9.5, -4.5, -1.2, 1.2, 220, 140);
                    return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
                  })()}
                  {(() => {
                    const b = ugWorldBoxToMap(4.5, 9.5, -1.2, 1.2, 220, 140);
                    return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
                  })()}
                  {(() => {
                    const b = ugWorldBoxToMap(-1.2, 1.2, -11.0, -4.5, 220, 140);
                    return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
                  })()}
                  {(() => {
                    const b = ugWorldBoxToMap(-1.2, 1.2, -25.4, -20.6, 220, 140);
                    return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
                  })()}
                  {/* South Exit Corridor */}
                  {(() => {
                    const b = ugWorldBoxToMap(-1.2, 1.2, 4.8, 9.5, 220, 140);
                    return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#064e3b" stroke="#22c55e" strokeWidth="0.8" />;
                  })()}

                  {/* 5 Underground Rooms */}
                  {/* 1. Main Studio */}
                  {(() => {
                    const b = ugWorldBoxToMap(-4.8, 4.8, -4.8, 4.8, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#ef4444" strokeWidth="1.2" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#a1a1aa" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          STUDIO
                        </text>
                      </g>
                    );
                  })()}
                  {/* 2. Beat Room */}
                  {(() => {
                    const b = ugWorldBoxToMap(-18.6, -9.0, -3.8, 3.8, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#f59e0b" strokeWidth="1.2" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#fcd34d" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          BEAT
                        </text>
                      </g>
                    );
                  })()}
                  {/* 3. CCTV Room */}
                  {(() => {
                    const b = ugWorldBoxToMap(9.0, 18.6, -3.8, 3.8, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#38bdf8" strokeWidth="1.2" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#7dd3fc" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          CCTV
                        </text>
                      </g>
                    );
                  })()}
                  {/* 4. Cinema Room */}
                  {(() => {
                    const b = ugWorldBoxToMap(-5.8, 5.8, -20.6, -11.0, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#a855f7" strokeWidth="1.2" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#d8b4fe" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          CINEMA
                        </text>
                      </g>
                    );
                  })()}
                  {/* 5. Archive / Node 04 */}
                  {(() => {
                    const b = ugWorldBoxToMap(-3.8, 3.8, -34.0, -25.4, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke={isNode04Unlocked ? "#22c55e" : "#dc2626"} strokeWidth="1.2" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill={isNode04Unlocked ? "#86efac" : "#f87171"} fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          {isNode04Unlocked ? "NODE 04" : "ARCHIVE"}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Surface Exit Marker */}
                  {(() => {
                    const p = ugWorldToMap(0, 9.2, 220, 140);
                    return (
                      <g>
                        <circle cx={p.x} cy={p.y} r="3" fill="#22c55e" />
                        <text x={p.x} y={p.y - 4} fill="#86efac" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          EXIT ↓
                        </text>
                      </g>
                    );
                  })()}

                  {/* Player Marker */}
                  {(() => {
                    const p = ugWorldToMap(playerPos[0], playerPos[2], 220, 140);
                    const angle = -playerYaw - Math.PI / 2;
                    const arrowLength = 9;
                    const tipX = p.x + Math.cos(angle) * arrowLength;
                    const tipY = p.y + Math.sin(angle) * arrowLength;
                    return (
                      <g>
                        <circle cx={p.x} cy={p.y} r="8" fill="url(#playerGlow)" opacity="0.6" />
                        <circle cx={p.x} cy={p.y} r="3.2" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1={p.x} y1={p.y} x2={tipX} y2={tipY} stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                      </g>
                    );
                  })()}
                </g>
              ) : (
                /* OUTDOOR WORLD COMPACT VIEW */
                <g>
                  {/* Grass Base */}
                  <rect x="0" y="0" width="220" height="140" fill="#14532d" opacity="0.4" />

                  {/* Road & Promenade */}
                  {(() => {
                    const b = outWorldBoxToMap(-58, 58, 32, 36, 220, 140);
                    return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#374151" />;
                  })()}
                  {(() => {
                    const b = outWorldBoxToMap(-3, 3, 24, 78, 220, 140);
                    return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#4b5563" />;
                  })()}

                  {/* Bunker Entrance (South) */}
                  {(() => {
                    const b = outWorldBoxToMap(-4, 4, 21, 26, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="1.5" fill="#1e293b" stroke="#22c55e" strokeWidth="1.2" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 2.5} fill="#86efac" fontSize="5.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          BUNKER
                        </text>
                      </g>
                    );
                  })()}

                  {/* Central Park */}
                  {(() => {
                    const b = outWorldBoxToMap(-25, 25, 38, 72, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#15803d" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 2} fill="#bbf7d0" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          CENTRAL PARK
                        </text>
                      </g>
                    );
                  })()}

                  {/* Residential Houses (West) */}
                  {(() => {
                    const b = outWorldBoxToMap(-52, -35, 38, 74, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="1" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 2} fill="#fcd34d" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          HOUSES
                        </text>
                      </g>
                    );
                  })()}

                  {/* Commercial / Sound Labs (East) */}
                  {(() => {
                    const b = outWorldBoxToMap(35, 52, 38, 74, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#311042" stroke="#c084fc" strokeWidth="1" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 2} fill="#f3e8ff" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          LABS
                        </text>
                      </g>
                    );
                  })()}

                  {/* Scenic Overlook (North) */}
                  {(() => {
                    const b = outWorldBoxToMap(-50, 50, 80, 108, 220, 140);
                    return (
                      <g>
                        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                        <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 2} fill="#7dd3fc" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          SCENIC OVERLOOK
                        </text>
                      </g>
                    );
                  })()}

                  {/* Player Marker in Outdoor Map */}
                  {(() => {
                    const p = outWorldToMap(playerPos[0], playerPos[2], 220, 140);
                    const angle = -playerYaw - Math.PI / 2;
                    const arrowLength = 9;
                    const tipX = p.x + Math.cos(angle) * arrowLength;
                    const tipY = p.y + Math.sin(angle) * arrowLength;
                    return (
                      <g>
                        <circle cx={p.x} cy={p.y} r="8" fill="url(#playerGlow)" opacity="0.6" />
                        <circle cx={p.x} cy={p.y} r="3.2" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1={p.x} y1={p.y} x2={tipX} y2={tipY} stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                      </g>
                    );
                  })()}
                </g>
              )}
            </svg>
          </div>

          {/* Coordinates & Zone Telemetry */}
          <div className="mt-1.5 flex items-center justify-between text-[8.5px] font-mono text-zinc-400">
            <span className={`truncate font-bold max-w-[130px] ${isOutdoor ? "text-emerald-400" : "text-red-400"}`}>
              {currentRoomName}
            </span>
            <span className="text-zinc-500">
              X:{playerPos[0].toFixed(0)} Z:{playerPos[2].toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. EXPANDED FACILITY & OUTDOOR SCHEMATIC OVERLAY (MODAL) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 select-none font-mono"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-zinc-950 border-2 border-red-600/80 rounded-xl p-5 sm:p-6 shadow-[0_0_60px_rgba(220,38,38,0.35)] text-zinc-100 flex flex-col max-h-[94vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
                  <div>
                    <h2 className="text-sm sm:text-base font-bold tracking-[0.25em] text-white">
                      AMITDIED WORLD SCHEMATIC // FACILITY & DISTRICT
                    </h2>
                    <p className="text-[10px] tracking-[0.2em] text-zinc-500">
                      CONNECTED MULTI-ROOM FACILITY + SURFACE OUTDOOR WORLD
                    </p>
                  </div>
                </div>

                {/* Tab switcher */}
                <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setActiveTab("underground")}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                      effectiveView === "underground"
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>LEVEL -2</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("outdoor")}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                      effectiveView === "outdoor"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Trees className="w-3 h-3" />
                    <span>SURFACE</span>
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors cursor-pointer ml-2"
                    title="Close Map (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Warning Banner */}
              <AnimatePresence>
                {teleportWarning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-2.5 bg-red-950/90 border border-red-600 rounded text-center text-red-300 text-xs font-bold tracking-wider"
                  >
                    {teleportWarning}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-y-auto">
                {/* SVG Blueprint Schematic (7 cols) */}
                <div className="md:col-span-7 bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 relative flex flex-col items-center justify-center min-h-[300px]">
                  <svg viewBox="0 0 320 380" className="w-full h-auto max-h-[360px]">
                    <defs>
                      <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
                        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#27272a" strokeWidth="0.5" />
                      </pattern>
                      <radialGradient id="expandedPlayerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <rect width="320" height="380" fill="url(#grid)" />

                    {effectiveView === "underground" ? (
                      /* EXPANDED UNDERGROUND FACILITY SCHEMATIC */
                      <g>
                        {/* Corridors */}
                        {(() => {
                          const b = ugWorldBoxToMap(-9.5, -4.5, -1.2, 1.2, 320, 380);
                          return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                        })()}
                        {(() => {
                          const b = ugWorldBoxToMap(4.5, 9.5, -1.2, 1.2, 320, 380);
                          return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                        })()}
                        {(() => {
                          const b = ugWorldBoxToMap(-1.2, 1.2, -11.0, -4.5, 320, 380);
                          return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                        })()}
                        {(() => {
                          const b = ugWorldBoxToMap(-1.2, 1.2, -25.4, -20.6, 320, 380);
                          return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                        })()}
                        {(() => {
                          const b = ugWorldBoxToMap(-1.2, 1.2, 4.8, 9.5, 320, 380);
                          return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#064e3b" stroke="#22c55e" strokeWidth="1.2" />;
                        })()}

                        {/* Rooms */}
                        {/* 1. Main Studio */}
                        {(() => {
                          const b = ugWorldBoxToMap(-4.8, 4.8, -4.8, 4.8, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#18181b" stroke="#ef4444" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#ffffff" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                MAIN STUDIO
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#71717a" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [CENTRAL HUB]
                              </text>
                            </g>
                          );
                        })()}

                        {/* 2. Beat Room */}
                        {(() => {
                          const b = ugWorldBoxToMap(-18.6, -9.0, -3.8, 3.8, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#18181b" stroke="#f59e0b" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#fef08a" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                BEAT ROOM
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#71717a" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [BEAT STORE TERMINAL]
                              </text>
                            </g>
                          );
                        })()}

                        {/* 3. CCTV Room */}
                        {(() => {
                          const b = ugWorldBoxToMap(9.0, 18.6, -3.8, 3.8, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#18181b" stroke="#38bdf8" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#bae6fd" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                CCTV ROOM
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#71717a" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [SURVEILLANCE GRID]
                              </text>
                            </g>
                          );
                        })()}

                        {/* 4. Cinema Room */}
                        {(() => {
                          const b = ugWorldBoxToMap(-5.8, 5.8, -20.6, -11.0, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#18181b" stroke="#c084fc" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#f3e8ff" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                CINEMA / 35MM
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#71717a" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [PROJECTION SYSTEM]
                              </text>
                            </g>
                          );
                        })()}

                        {/* 5. Archive Area */}
                        {(() => {
                          const b = ugWorldBoxToMap(-3.8, 3.8, -34.0, -25.4, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#18181b" stroke="#f87171" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#fecaca" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                ARCHIVE STORAGE
                              </text>
                            </g>
                          );
                        })()}

                        {/* 6. Node 04 Vault */}
                        {(() => {
                          const b = ugWorldBoxToMap(-3.6, 3.6, -41.5, -34.0, 320, 380);
                          return (
                            <g>
                              <rect
                                x={b.x}
                                y={b.y}
                                width={b.width}
                                height={b.height}
                                rx="3"
                                fill={isNode04Unlocked ? "#064e3b" : "#27272a"}
                                stroke={isNode04Unlocked ? "#22c55e" : "#dc2626"}
                                strokeWidth="1.8"
                              />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 2} fill={isNode04Unlocked ? "#86efac" : "#ef4444"} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                {isNode04Unlocked ? "NODE 04 VAULT" : "NODE 04 [LOCKED]"}
                              </text>
                            </g>
                          );
                        })()}

                        {/* Player Marker (if underground) */}
                        {!isOutdoor && (() => {
                          const p = ugWorldToMap(playerPos[0], playerPos[2], 320, 380);
                          const angle = -playerYaw - Math.PI / 2;
                          const arrowLength = 14;
                          const tipX = p.x + Math.cos(angle) * arrowLength;
                          const tipY = p.y + Math.sin(angle) * arrowLength;
                          return (
                            <g>
                              <circle cx={p.x} cy={p.y} r="12" fill="url(#expandedPlayerGlow)" opacity="0.75" />
                              <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#ef4444" strokeWidth="2.2" />
                              <line x1={p.x} y1={p.y} x2={tipX} y2={tipY} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                            </g>
                          );
                        })()}
                      </g>
                    ) : (
                      /* EXPANDED OUTDOOR WORLD SCHEMATIC */
                      <g>
                        {/* Central Park */}
                        {(() => {
                          const b = outWorldBoxToMap(-28, 28, 36, 76, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="1.8" opacity="0.7" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#bbf7d0" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                CENTRAL PARK
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#86efac" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [SOUND MONUMENT]
                              </text>
                            </g>
                          );
                        })()}

                        {/* Residential District */}
                        {(() => {
                          const b = outWorldBoxToMap(-56, -32, 36, 76, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="4" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#fde047" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                RESIDENTIAL
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#fcd34d" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [HOUSES 01–03]
                              </text>
                            </g>
                          );
                        })()}

                        {/* Commercial Sound Labs */}
                        {(() => {
                          const b = outWorldBoxToMap(32, 56, 36, 76, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="4" fill="#3b0764" stroke="#c084fc" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#f3e8ff" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                AUDIO LABS
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#d8b4fe" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [CINEMA & VINYL]
                              </text>
                            </g>
                          );
                        })()}

                        {/* Scenic Overlook (North) */}
                        {(() => {
                          const b = outWorldBoxToMap(-54, 54, 80, 110, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#7dd3fc" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                SCENIC OVERLOOK
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle">
                                [CITY SKYLINE RIDGE]
                              </text>
                            </g>
                          );
                        })()}

                        {/* Bunker Entrance Portal (South) */}
                        {(() => {
                          const b = outWorldBoxToMap(-6, 6, 21, 28, 320, 380);
                          return (
                            <g>
                              <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#1e293b" stroke="#22c55e" strokeWidth="1.8" />
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#86efac" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                FACILITY
                              </text>
                              <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 8} fill="#4ade80" fontSize="6" fontFamily="monospace" textAnchor="middle">
                                [BUNKER]
                              </text>
                            </g>
                          );
                        })()}

                        {/* Friend NPC Markers on Expanded Outdoor Map */}
                        {[
                          { name: "SAHIL", label: "S", pos: [-2, 50], color: "#f59e0b" },
                          { name: "CHIKU", label: "C", pos: [-20, 58], color: "#5eead4" },
                          { name: "ADDY", label: "A", pos: [0, 55], color: "#c084fc" },
                        ].map((friend, idx) => {
                          const fp = outWorldToMap(friend.pos[0], friend.pos[1], 320, 380);
                          return (
                            <g key={idx}>
                              <circle cx={fp.x} cy={fp.y} r="7" fill="#09090b" stroke={friend.color} strokeWidth="1.5" />
                              <text x={fp.x} y={fp.y + 3} fill={friend.color} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                                {friend.label}
                              </text>
                            </g>
                          );
                        })}

                        {/* Player Marker (if outdoor) */}
                        {isOutdoor && (() => {
                          const p = outWorldToMap(playerPos[0], playerPos[2], 320, 380);
                          const angle = -playerYaw - Math.PI / 2;
                          const arrowLength = 14;
                          const tipX = p.x + Math.cos(angle) * arrowLength;
                          const tipY = p.y + Math.sin(angle) * arrowLength;
                          return (
                            <g>
                              <circle cx={p.x} cy={p.y} r="12" fill="url(#expandedPlayerGlow)" opacity="0.75" />
                              <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#ef4444" strokeWidth="2.2" />
                              <line x1={p.x} y1={p.y} x2={tipX} y2={tipY} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </svg>
                </div>

                {/* Fast Travel / Spawn Points Section (5 cols) */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-[11px] text-red-400 font-bold tracking-[0.2em] uppercase">
                      <Compass className="w-3.5 h-3.5 text-red-500" />
                      <span>FAST TRAVEL // SECTORS</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 tracking-wider mt-1.5 mb-2.5">
                      Select a destination to warp instantly to its entry point:
                    </p>

                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                      {SAFE_SPAWN_POINTS.map((spawn) => {
                        const isLocked = spawn.requiresNode04 && !isNode04Unlocked;
                        return (
                          <button
                            key={spawn.id}
                            onClick={() => handleSpawnClick(spawn)}
                            className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                              isLocked
                                ? "bg-red-950/20 border-red-900/40 text-zinc-600 hover:border-red-600/50"
                                : "bg-zinc-900/80 hover:bg-red-950/40 border-zinc-800 hover:border-red-500/80 text-zinc-200"
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold tracking-wider flex items-center gap-1.5">
                                <MapPin className={`w-3 h-3 ${isLocked ? "text-zinc-600" : "text-red-500"}`} />
                                <span>{spawn.roomName}</span>
                              </div>
                              <div className="text-[8.5px] text-zinc-500 tracking-wider truncate max-w-[180px]">
                                {spawn.description}
                              </div>
                            </div>

                            <div className="text-right">
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1 text-[8.5px] text-red-500 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                                  <Lock className="w-2.5 h-2.5" /> LOCKED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[8.5px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                                  <Zap className="w-2.5 h-2.5" /> WARP
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Telemetry Status Box */}
                  <div className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[9px] font-mono space-y-1 text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">CURRENT SECTOR:</span>
                      <span className="text-white font-bold">{currentRoomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">COORDINATES:</span>
                      <span className="text-white">
                        X: {playerPos[0].toFixed(2)} | Z: {playerPos[2].toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ENVIRONMENT:</span>
                      <span className={isOutdoor ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {isOutdoor ? "SURFACE OUTDOOR DISTRICT" : "LEVEL -2 UNDERGROUND"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default WorldMinimap;
