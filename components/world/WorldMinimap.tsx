"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, Minimize2, MapPin, Lock, Unlock, Compass, X, Zap } from "lucide-react";
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

// Map Coordinate Transform Helper
// World coordinates: X from -21 to +21 (width 42), Z from -43 to +6 (height 49)
const MIN_X = -22;
const MAX_X = 22;
const MIN_Z = -44;
const MAX_Z = 7;
const TOTAL_W = MAX_X - MIN_X; // 44
const TOTAL_H = MAX_Z - MIN_Z; // 51

function worldToMap(x: number, z: number, svgWidth: number, svgHeight: number) {
  const normX = (x - MIN_X) / TOTAL_W;
  const normY = (z - MIN_Z) / TOTAL_H;
  return {
    x: normX * svgWidth,
    y: normY * svgHeight,
  };
}

function worldBoxToMap(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  svgWidth: number,
  svgHeight: number
) {
  const topLeft = worldToMap(minX, minZ, svgWidth, svgHeight);
  const width = ((maxX - minX) / TOTAL_W) * svgWidth;
  const height = ((maxZ - minZ) / TOTAL_H) * svgHeight;
  return {
    x: topLeft.x,
    y: topLeft.y,
    width,
    height,
  };
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
  const [teleportWarning, setTeleportWarning] = useState<string | null>(null);

  // Identify current room
  const currentRoomName = useMemo(() => {
    const [px, , pz] = playerPos;
    const match = WALKABLE_BOUNDS.find(
      (b) => px >= b.minX && px <= b.maxX && pz >= b.minZ && pz <= b.maxZ
    );
    return match ? match.name.toUpperCase() : "FACILITY CORRIDOR";
  }, [playerPos]);

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
          title="Click to Open Expanded Facility Map [M]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[10px] tracking-[0.2em] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-300 group-hover:text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>MAP // AMITDIED</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-500 group-hover:text-zinc-300">
              <span className="text-[8px] bg-zinc-900 px-1 py-0.2 rounded border border-zinc-700">M</span>
              <Maximize2 className="w-3 h-3" />
            </div>
          </div>

          {/* SVG Map Render */}
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

              {/* Corridors */}
              {/* West Corridor */}
              {(() => {
                const b = worldBoxToMap(-9.5, -4.5, -1.2, 1.2, 220, 140);
                return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
              })()}
              {/* East Corridor */}
              {(() => {
                const b = worldBoxToMap(4.5, 9.5, -1.2, 1.2, 220, 140);
                return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
              })()}
              {/* North Hallway 1 */}
              {(() => {
                const b = worldBoxToMap(-1.2, 1.2, -11.0, -4.5, 220, 140);
                return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
              })()}
              {/* North Hallway 2 */}
              {(() => {
                const b = worldBoxToMap(-1.2, 1.2, -25.4, -20.6, 220, 140);
                return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />;
              })()}

              {/* 5 Main Facility Rooms */}
              {/* 1. Main Studio (Center) */}
              {(() => {
                const b = worldBoxToMap(-4.8, 4.8, -4.8, 4.8, 220, 140);
                return (
                  <g>
                    <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#ef4444" strokeWidth="1.2" />
                    <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#a1a1aa" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      STUDIO
                    </text>
                  </g>
                );
              })()}

              {/* 2. Beat Room (West) */}
              {(() => {
                const b = worldBoxToMap(-18.6, -9.0, -3.8, 3.8, 220, 140);
                return (
                  <g>
                    <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#f59e0b" strokeWidth="1.2" />
                    <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#fcd34d" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      BEAT
                    </text>
                  </g>
                );
              })()}

              {/* 3. CCTV Room (East) */}
              {(() => {
                const b = worldBoxToMap(9.0, 18.6, -3.8, 3.8, 220, 140);
                return (
                  <g>
                    <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#38bdf8" strokeWidth="1.2" />
                    <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#7dd3fc" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      CCTV
                    </text>
                  </g>
                );
              })()}

              {/* 4. Cinema Room (North) */}
              {(() => {
                const b = worldBoxToMap(-5.8, 5.8, -20.6, -11.0, 220, 140);
                return (
                  <g>
                    <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="2" fill="#18181b" stroke="#a855f7" strokeWidth="1.2" />
                    <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill="#d8b4fe" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      CINEMA
                    </text>
                  </g>
                );
              })()}

              {/* 5. Archive / Node 04 Area (Deep North) */}
              {(() => {
                const b = worldBoxToMap(-3.8, 3.8, -34.0, -25.4, 220, 140);
                return (
                  <g>
                    <rect
                      x={b.x}
                      y={b.y}
                      width={b.width}
                      height={b.height}
                      rx="2"
                      fill="#18181b"
                      stroke={isNode04Unlocked ? "#22c55e" : "#dc2626"}
                      strokeWidth="1.2"
                    />
                    <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 3} fill={isNode04Unlocked ? "#86efac" : "#f87171"} fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      {isNode04Unlocked ? "NODE 04" : "ARCHIVE"}
                    </text>
                  </g>
                );
              })()}

              {/* Player Marker + Direction Vector */}
              {(() => {
                const p = worldToMap(playerPos[0], playerPos[2], 220, 140);
                // In Three.js: Yaw 0 is facing negative Z (North/Up on map).
                // svg angle: -yaw in radians
                const angle = -playerYaw - Math.PI / 2;
                const arrowLength = 9;
                const tipX = p.x + Math.cos(angle) * arrowLength;
                const tipY = p.y + Math.sin(angle) * arrowLength;

                return (
                  <g>
                    {/* Glowing pulse ring */}
                    <circle cx={p.x} cy={p.y} r="8" fill="url(#playerGlow)" opacity="0.6" />
                    {/* Core player dot */}
                    <circle cx={p.x} cy={p.y} r="3.2" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
                    {/* Direction pointer line */}
                    <line x1={p.x} y1={p.y} x2={tipX} y2={tipY} stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Coordinates & Zone Telemetry */}
          <div className="mt-1.5 flex items-center justify-between text-[8.5px] font-mono text-zinc-400">
            <span className="truncate text-red-400 font-bold max-w-[130px]">{currentRoomName}</span>
            <span className="text-zinc-500">
              X:{playerPos[0].toFixed(0)} Z:{playerPos[2].toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. EXPANDED FACILITY SCHEMATIC OVERLAY (MODAL) */}
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
              className="relative max-w-3xl w-full bg-zinc-950 border-2 border-red-600/80 rounded-xl p-5 sm:p-7 shadow-[0_0_60px_rgba(220,38,38,0.35)] text-zinc-100 flex flex-col max-h-[92vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
                  <div>
                    <h2 className="text-sm sm:text-base font-bold tracking-[0.25em] text-white">
                      AMITDIED UNDERGROUND FACILITY // SCHEMATIC
                    </h2>
                    <p className="text-[10px] tracking-[0.2em] text-zinc-500">
                      LEVEL -2 GRID • SECURE SECTOR MATRIX
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded transition-colors cursor-pointer"
                  title="Close Map (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
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

              {/* Main Content Layout: Schematic (Left) + Fast Travel Panel (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-y-auto">
                {/* SVG Blueprint Schematic (7 cols) */}
                <div className="md:col-span-7 bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 relative flex flex-col items-center justify-center min-h-[280px]">
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

                    {/* Background Grid */}
                    <rect width="320" height="380" fill="url(#grid)" />

                    {/* Corridors */}
                    {/* West Corridor */}
                    {(() => {
                      const b = worldBoxToMap(-9.5, -4.5, -1.2, 1.2, 320, 380);
                      return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                    })()}
                    {/* East Corridor */}
                    {(() => {
                      const b = worldBoxToMap(4.5, 9.5, -1.2, 1.2, 320, 380);
                      return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                    })()}
                    {/* North Hallway 1 */}
                    {(() => {
                      const b = worldBoxToMap(-1.2, 1.2, -11.0, -4.5, 320, 380);
                      return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                    })()}
                    {/* North Hallway 2 */}
                    {(() => {
                      const b = worldBoxToMap(-1.2, 1.2, -25.4, -20.6, 320, 380);
                      return <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="#27272a" stroke="#52525b" strokeWidth="1" />;
                    })()}

                    {/* Rooms */}
                    {/* 1. Main Studio */}
                    {(() => {
                      const b = worldBoxToMap(-4.8, 4.8, -4.8, 4.8, 320, 380);
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
                      const b = worldBoxToMap(-18.6, -9.0, -3.8, 3.8, 320, 380);
                      return (
                        <g>
                          <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#18181b" stroke="#f59e0b" strokeWidth="1.8" />
                          <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#fef08a" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                            BEAT ROOM
                          </text>
                          <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#71717a" fontSize="7" fontFamily="monospace" textAnchor="middle">
                            [ARCHIVE TERMINAL]
                          </text>
                        </g>
                      );
                    })()}

                    {/* 3. CCTV Room */}
                    {(() => {
                      const b = worldBoxToMap(9.0, 18.6, -3.8, 3.8, 320, 380);
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
                      const b = worldBoxToMap(-5.8, 5.8, -20.6, -11.0, 320, 380);
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
                      const b = worldBoxToMap(-3.8, 3.8, -34.0, -25.4, 320, 380);
                      return (
                        <g>
                          <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="3" fill="#18181b" stroke="#f87171" strokeWidth="1.8" />
                          <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill="#fecaca" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                            ARCHIVE STORAGE
                          </text>
                          <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill="#71717a" fontSize="7" fontFamily="monospace" textAnchor="middle">
                            [NODE 04 GATEWAY]
                          </text>
                        </g>
                      );
                    })()}

                    {/* 6. Node 04 Secret Chamber */}
                    {(() => {
                      const b = worldBoxToMap(-3.6, 3.6, -41.5, -34.0, 320, 380);
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
                            strokeDasharray={isNode04Unlocked ? "none" : "3,3"}
                          />
                          <text x={b.x + b.width / 2} y={b.y + b.height / 2 - 2} fill={isNode04Unlocked ? "#86efac" : "#ef4444"} fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                            {isNode04Unlocked ? "NODE 04 VAULT" : "NODE 04 [LOCKED]"}
                          </text>
                          <text x={b.x + b.width / 2} y={b.y + b.height / 2 + 10} fill={isNode04Unlocked ? "#a7f3d0" : "#71717a"} fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                            {isNode04Unlocked ? "[UNLOCKED]" : "[LEVEL 04 CLEARANCE]"}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Key Terminals as Yellow Dots */}
                    {WORLD_EQUIPMENT_INTERACTABLES.map((item) => {
                      const pt = worldToMap(item.position[0], item.position[2], 320, 380);
                      return (
                        <g key={item.id}>
                          <circle cx={pt.x} cy={pt.y} r="2.5" fill="#facc15" stroke="#713f12" strokeWidth="0.8" />
                        </g>
                      );
                    })}

                    {/* Collectibles as Green/Red Dots */}
                    {WORLD_COLLECTIBLES.map((item) => {
                      const pt = worldToMap(item.position[0], item.position[2], 320, 380);
                      const isFound = discoveredArtifactIds.includes(item.id);
                      return (
                        <g key={item.id}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="2"
                            fill={isFound ? "#22c55e" : "#ef4444"}
                            stroke="#000"
                            strokeWidth="0.5"
                          />
                        </g>
                      );
                    })}

                    {/* Player Marker + Orientation Arrow */}
                    {(() => {
                      const p = worldToMap(playerPos[0], playerPos[2], 320, 380);
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
                  </svg>

                  {/* Legend Overlay */}
                  <div className="mt-2 w-full flex flex-wrap items-center justify-between text-[8.5px] text-zinc-400 font-mono px-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white border border-red-500" />
                      <span>PLAYER</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span>TERMINAL</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>DISCOVERED</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>COLLECTIBLE</span>
                    </div>
                  </div>
                </div>

                {/* Fast Travel / Spawn Points Section (5 cols) */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-[11px] text-red-400 font-bold tracking-[0.2em] uppercase">
                      <Compass className="w-3.5 h-3.5 text-red-500" />
                      <span>FAST TRAVEL // SAFE SPAWNS</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 tracking-wider mt-1.5 mb-3">
                      Select a sector to teleport instantly to its safe entry node:
                    </p>

                    <div className="space-y-2">
                      {SAFE_SPAWN_POINTS.map((spawn) => {
                        const isLocked = spawn.requiresNode04 && !isNode04Unlocked;
                        return (
                          <button
                            key={spawn.id}
                            onClick={() => handleSpawnClick(spawn)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
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
                              <div className="text-[9px] text-zinc-500 tracking-wider">
                                {spawn.description}
                              </div>
                            </div>

                            <div className="text-right">
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1 text-[9px] text-red-500 font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                                  <Lock className="w-2.5 h-2.5" /> LOCKED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
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
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[9.5px] font-mono space-y-1 text-zinc-400">
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
                      <span className="text-zinc-500">CLEARANCE:</span>
                      <span className={isNode04Unlocked ? "text-emerald-400 font-bold" : "text-amber-400"}>
                        {isNode04Unlocked ? "LEVEL 04 FULL ACCESS" : "STANDARD SECTOR CLEARANCE"}
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
