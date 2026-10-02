"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Film, Radio, Video, AlertCircle, Play, ChevronRight, Terminal, RefreshCw } from "lucide-react";
import { YOUTUBE_LINKS } from "@/lib/data";

export interface PortfolioVideo {
  id: string;
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  author: string;
  description?: string;
}

interface CinemaTerminalProps {
  onClose: () => void;
  onProjectSelect?: (project: PortfolioVideo | null) => void;
}

export function CinemaTerminal({ onClose, onProjectSelect }: CinemaTerminalProps) {
  const [projects, setProjects] = useState<PortfolioVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch authoritative portfolio items from the existing /api/videos endpoint with fallback
  useEffect(() => {
    let active = true;

    const fetchPortfolioVideos = async () => {
      try {
        setError(null);
        let rawLinks: any[] = YOUTUBE_LINKS;

        try {
          const res = await fetch("/api/videos", { cache: "no-store" });
          if (res.ok) {
            const apiData = await res.json();
            if (Array.isArray(apiData) && apiData.length > 0) {
              rawLinks = apiData;
            }
          }
        } catch {
          // Use YOUTUBE_LINKS fallback
        }

        if (!active) return;

        const parsedProjects: PortfolioVideo[] = await Promise.all(
          rawLinks.map(async (item: any, idx: number) => {
            const url = typeof item === "string" ? item : String(item.url || "");
            const match = url
              ? url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
              : null;
            const videoId = match ? match[1] : (url?.split("v=")[1]?.split("&")[0] || "");
            const uniqueId = typeof item === "object" && item.id ? String(item.id) : videoId || `video-${idx}`;
            const itemTitle = typeof item === "object" && item.title ? item.title : null;
            const description = typeof item === "object" && item.description ? item.description : undefined;

            try {
              const oembedRes = await fetch(`https://noembed.com/embed?url=${url}`);
              if (oembedRes.ok) {
                const json = await oembedRes.json();
                if (!json.error) {
                  return {
                    id: uniqueId,
                    videoId,
                    url,
                    title: itemTitle || json.title || `TRANSMISSION_${idx + 1}`,
                    thumbnail: json.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    author: json.author_name || "AMITDIED",
                    description,
                  };
                }
              }
            } catch {
              // Fallback
            }

            return {
              id: uniqueId,
              videoId,
              url,
              title: itemTitle || `AMITDIED // ARCHIVE_${String(idx + 1).padStart(2, "0")}`,
              thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
              author: "AMITDIED",
              description,
            };
          })
        );

        const validProjects = parsedProjects.filter((p) => !!p.url);

        if (active) {
          setProjects(validProjects);
          if (validProjects.length > 0) {
            setSelectedProjectId(validProjects[0].id);
            onProjectSelect?.(validProjects[0]);
          }
        }
      } catch (err) {
        if (active) {
          setError("ARCHIVE CONNECTION FAILED");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPortfolioVideos();

    return () => {
      active = false;
    };
  }, [onProjectSelect]);

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

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleSelect = (project: PortfolioVideo) => {
    setSelectedProjectId(project.id);
    onProjectSelect?.(project);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="In-World Cinema Projection Terminal"
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(220,38,38,0.2)] overflow-hidden"
      >
        {/* CRT Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_3px] opacity-40 mix-blend-overlay" />

        {/* Top Header Bar */}
        <div className="relative z-40 px-4 sm:px-6 py-3.5 bg-black border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            <div className="text-xs sm:text-sm font-bold tracking-[0.25em] text-white">
              AMITDIED <span className="text-red-500">{"// CINEMA ARCHIVE"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
            <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
              <Terminal className="w-3 h-3 text-red-500" />
              <span>NODE 03 // PROJECTION SYSTEM // SIGNAL: ONLINE</span>
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

        {/* Main Viewport Content */}
        <div className="relative z-20 flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[440px]">
          {/* Left Column: Project Selection Reel (4 cols) */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-zinc-800/80 overflow-y-auto p-3 sm:p-4 space-y-2 bg-zinc-950/70">
            <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-zinc-500 pb-2 border-b border-zinc-900 px-2">
              <span>ARCHIVE REELS</span>
              <span>{projects.length} FILMS</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500 tracking-[0.2em] animate-pulse space-y-2">
                <RefreshCw className="w-4 h-4 mx-auto animate-spin text-red-500" />
                <div>ALIGNING 35MM OPTICAL SYSTEM...</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-red-400 tracking-[0.2em] space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-red-500" />
                <div>{error}</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 tracking-[0.2em] space-y-2">
                <Film className="w-6 h-6 mx-auto text-zinc-600" />
                <div>CINEMA ARCHIVE</div>
                <div className="text-[10px] text-zinc-600">NO TRANSMISSIONS AVAILABLE</div>
              </div>
            ) : (
              projects.map((project, idx) => {
                const isSelected = selectedProject?.id === project.id;

                return (
                  <div
                    key={project.id}
                    onClick={() => handleSelect(project)}
                    className={`group p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-red-950/20 border-red-600/70 shadow-[0_0_12px_rgba(220,38,38,0.2)]"
                        : "bg-black/40 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isSelected
                            ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse"
                            : "bg-zinc-700"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-[9px] text-zinc-500">
                          REEL_{String(idx + 1).padStart(2, "0")}
                        </div>
                        <div
                          className={`font-bold truncate text-xs ${
                            isSelected ? "text-red-300" : "text-zinc-300"
                          }`}
                        >
                          {project.title}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                        isSelected ? "text-red-400 translate-x-0.5" : "text-zinc-600 group-hover:text-zinc-400"
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Projection Viewport (8 cols) */}
          <div className="md:col-span-8 p-4 sm:p-5 flex flex-col justify-between bg-black">
            {selectedProject ? (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                {/* Active Project Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[9px] tracking-[0.25em] text-red-500 font-bold uppercase flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                      <span>[ NOW PROJECTING ]</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wider truncate">
                      {selectedProject.title}
                    </h3>
                  </div>

                  <div className="text-right text-[10px] space-y-0.5 text-zinc-500 flex-shrink-0">
                    <div>FEED: <span className="text-zinc-300">YOUTUBE_OPTICAL</span></div>
                    <div>STATUS: <span className="text-emerald-400 font-bold">READY</span></div>
                  </div>
                </div>

                {/* Single YouTube Iframe Player Frame */}
                <div className="relative w-full flex-1 min-h-[260px] max-h-[440px] bg-black rounded border border-zinc-800 flex items-center justify-center overflow-hidden">
                  {/* Corner Brackets */}
                  <div className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-red-600/70 z-20" />
                  <div className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-red-600/70 z-20" />
                  <div className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-red-600/70 z-20" />
                  <div className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-red-600/70 z-20" />

                  {/* Top-Right Projector Telemetry */}
                  <div className="pointer-events-none absolute top-3 right-4 z-20 flex items-center gap-1.5 text-[9px] font-mono text-red-500 tracking-widest uppercase">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span>35MM OPTICAL BEAM // 24 FPS</span>
                  </div>

                  {selectedProject.videoId ? (
                    <iframe
                      key={selectedProject.videoId}
                      src={`https://www.youtube.com/embed/${selectedProject.videoId}?enablejsapi=1&rel=0&modestbranding=1`}
                      title={selectedProject.title}
                      className="w-full h-full min-h-[260px] aspect-video border-0 bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
                      <div className="text-xs text-white tracking-widest">
                        TRANSMISSION ERROR
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        INVALID VIDEO SIGNAL // CANNOT RESOLVE ID
                      </div>
                    </div>
                  )}
                </div>

                {/* Description & Footer Controls */}
                <div className="space-y-2">
                  {selectedProject.description && (
                    <div className="text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-900 leading-relaxed">
                      {selectedProject.description}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] text-zinc-500 tracking-wider">
                    <div>PROJECTION BEAM: ALIGNED</div>
                    <div>PRESS ESC TO RETURN TO 3D CINEMA</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center text-xs text-zinc-600 tracking-widest">
                SELECT A TRANSMISSION TO PROJECT
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CinemaTerminal;
