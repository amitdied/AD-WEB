"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, ShieldAlert, Radio, Eye, Video, VideoOff, Terminal } from "lucide-react";

export interface CCTVFeed {
  id: string;
  url: string;
  label: string;
  location: string;
  title: string;
  snippet: string;
  status: string;
  date: string;
  isVideo: boolean;
}

interface CCTVTerminalProps {
  onClose: () => void;
}

export function CCTVTerminal({ onClose }: CCTVTerminalProps) {
  const [feeds, setFeeds] = useState<CCTVFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);

  // Load real CCTV data from the existing /api/instagram endpoint
  useEffect(() => {
    let active = true;

    const loadCCTVFeeds = async () => {
      try {
        const res = await fetch("/api/instagram", { cache: "no-store" });
        if (!res.ok) throw new Error("CCTV API failed");
        const data = await res.json();

        if (active && Array.isArray(data) && data.length > 0) {
          const mapped: CCTVFeed[] = data
            .filter((item: any) => item && item.visible !== false)
            .map((item: any, i: number) => {
              const url = String(
                item.url || item.postUrl || item.youtubeUrl || item.imageUrl || ""
              );
              const isVideo =
                item.type === "video" ||
                /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ||
                (url.length > 0 && !url.includes("instagram.com"));

              return {
                id: String(item.id || `feed-${i}`),
                url,
                label: String(
                  item.label || item.camCode || `CAM_${String(i + 1).padStart(2, "0")}`
                ),
                location: String(item.location || "STUDIO_UNDERGROUND"),
                title: String(
                  item.title || item.captionTitle || item.videoSnippetTitle || `TRANSMISSION_${i + 1}`
                ),
                snippet: String(item.snippet || item.caption || ""),
                status: String(item.status || (url ? "ONLINE" : "OFFLINE")),
                date: String(item.date || "LIVE"),
                isVideo,
              };
            });

          setFeeds(mapped);
          if (mapped.length > 0) {
            setSelectedFeedId(mapped[0].id);
          }
        }
      } catch (err) {
        console.warn("[CCTVTerminal] Load notice:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCCTVFeeds();
    return () => {
      active = false;
    };
  }, []);

  // Handle ESC key to close terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedFeed = feeds.find((f) => f.id === selectedFeedId) || feeds[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="In-World CCTV Surveillance Terminal"
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(56,189,248,0.15)] overflow-hidden"
      >
        {/* CRT Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_3px] opacity-40 mix-blend-overlay" />

        {/* Top Header Bar */}
        <div className="relative z-40 px-4 sm:px-6 py-3.5 bg-black border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <div className="text-xs sm:text-sm font-bold tracking-[0.25em] text-white">
              AMITDIED <span className="text-cyan-400">{"// SURVEILLANCE NETWORK"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
            <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>NODE 02 // CAMERAS: ONLINE // SIGNAL: ACTIVE</span>
            </div>
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-red-950/60 border border-zinc-700 hover:border-red-600/80 text-zinc-300 hover:text-red-400 text-[10px] tracking-[0.2em] uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>[ESC] CLOSE</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Main Terminal Viewport */}
        <div className="relative z-20 flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[420px]">
          {/* Left Column: Feed Monitor Selector (4 cols) */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-zinc-800/80 overflow-y-auto p-3 sm:p-4 space-y-2 bg-zinc-950/60">
            <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-zinc-500 pb-2 border-b border-zinc-900 px-2">
              <span>CAMERA CHANNELS</span>
              <span>{feeds.length} SIGNALS</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500 tracking-[0.2em] animate-pulse">
                INITIALIZING SURVEILLANCE LINK...
              </div>
            ) : feeds.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 tracking-[0.2em] space-y-2">
                <ShieldAlert className="w-6 h-6 mx-auto text-amber-500/70" />
                <div>SURVEILLANCE DATABASE</div>
                <div className="text-[10px] text-zinc-600">NO ACTIVE SIGNALS</div>
              </div>
            ) : (
              feeds.map((feed) => {
                const isSelected = selectedFeed?.id === feed.id;
                const isOnline = feed.status === "ONLINE" && feed.url;

                return (
                  <div
                    key={feed.id}
                    onClick={() => setSelectedFeedId(feed.id)}
                    className={`group p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : "bg-black/40 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isOnline
                            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                            : "bg-red-500/70"
                        }`}
                      />
                      <div className="min-w-0">
                        <div
                          className={`font-bold truncate text-xs ${
                            isSelected ? "text-cyan-300" : "text-zinc-300"
                          }`}
                        >
                          {feed.label}
                        </div>
                        <div className="text-[9px] text-zinc-500 truncate">
                          {feed.location}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 text-[10px]">
                      <span
                        className={`font-mono ${
                          isOnline ? "text-emerald-400" : "text-zinc-600"
                        }`}
                      >
                        {isOnline ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Live Feed Screen & Telemetry (8 cols) */}
          <div className="md:col-span-8 p-4 sm:p-5 flex flex-col justify-between bg-black">
            {selectedFeed ? (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                {/* Channel Header Info */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[9px] tracking-[0.25em] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>CAMERA SIGNAL // {selectedFeed.label}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wider truncate">
                      {selectedFeed.title}
                    </h3>
                  </div>

                  <div className="text-right text-[10px] space-y-0.5 text-zinc-400">
                    <div>LOCATION: <span className="text-zinc-200">{selectedFeed.location}</span></div>
                    <div>
                      STATUS:{" "}
                      <span
                        className={`font-bold ${
                          selectedFeed.status === "ONLINE" && selectedFeed.url
                            ? "text-emerald-400"
                            : "text-amber-500"
                        }`}
                      >
                        {selectedFeed.url ? selectedFeed.status : "SIGNAL UNAVAILABLE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CRT Monitor Viewport Frame */}
                <div className="relative w-full flex-1 min-h-[260px] max-h-[420px] bg-black rounded border border-zinc-800 flex items-center justify-center overflow-hidden">
                  {/* Overlay Corner Brackets */}
                  <div className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 z-20" />
                  <div className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 z-20" />
                  <div className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60 z-20" />
                  <div className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 z-20" />

                  {/* Top-Right REC Telemetry */}
                  <div className="pointer-events-none absolute top-3 right-4 z-20 flex items-center gap-1.5 text-[9px] font-mono text-red-500 tracking-widest uppercase">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span>REC 03:47:22 AM</span>
                  </div>

                  {/* Top-Left Channel Label */}
                  <div className="pointer-events-none absolute top-3 left-4 z-20 text-[9px] font-mono text-cyan-400/90 tracking-widest uppercase">
                    {selectedFeed.label} {"// "} {selectedFeed.location}
                  </div>

                  {/* VIDEO PLAYER or STATIC FALLBACK */}
                  {selectedFeed.url && selectedFeed.isVideo ? (
                    <video
                      key={selectedFeed.url}
                      src={selectedFeed.url}
                      controls
                      controlsList="nodownload"
                      playsInline
                      preload="metadata"
                      className="w-full h-full max-h-[400px] object-contain bg-black"
                    />
                  ) : selectedFeed.url ? (
                    <div className="p-6 text-center space-y-2">
                      <Video className="w-8 h-8 mx-auto text-cyan-400 animate-pulse" />
                      <div className="text-xs text-white tracking-widest">
                        FEED ENCRYPTED // INSTAGRAM TRANSMISSION
                      </div>
                      <a
                        href={selectedFeed.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[10px] text-cyan-400 underline hover:text-cyan-300"
                      >
                        OPEN EXTERNAL FEED
                      </a>
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <VideoOff className="w-8 h-8 mx-auto text-zinc-600" />
                      <div className="text-xs text-zinc-400 tracking-widest">
                        SIGNAL UNAVAILABLE
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        CAMERA OFFLINE // NO CARRIER
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Console Status Bar */}
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] text-zinc-500 tracking-wider">
                  <div>TRANSMISSION LOG: ARCHIVE VERIFIED</div>
                  <div>PRESS ESC TO RETURN TO 3D ENVIRONMENT</div>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center text-xs text-zinc-600 tracking-widest">
                SELECT A CAMERA FEED TO MONITOR
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CCTVTerminal;
