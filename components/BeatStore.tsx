"use client";
import { beats as hardcodedBeats } from "@/lib/data";
import { useAudio } from "@/lib/AudioContext";
import {
  Play,
  Pause,
  ShoppingCart,
  Search,
  Filter,
  Activity,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LicenseModal } from "./LicenseModal";

export function BeatStore() {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null);
  const [allBeats, setAllBeats] = useState<any[]>(hardcodedBeats);
  const [selectedBeatForLicense, setSelectedBeatForLicense] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/beats")
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((customBeats) => {
        if (Array.isArray(customBeats) && customBeats.length > 0) {
          setAllBeats(customBeats);
        }
      })
      .catch((err) => {
        console.error("Failed to load beats from API, using fallback", err);
        setAllBeats(hardcodedBeats);
      });
  }, []);

  // Listen for global open-license-modal events (from StickyPlayer, etc.)
  useEffect(() => {
    const handleOpenLicense = (e: any) => {
      if (e.detail) {
        setSelectedBeatForLicense(e.detail);
      }
    };
    window.addEventListener("open-license-modal", handleOpenLicense);
    return () => window.removeEventListener("open-license-modal", handleOpenLicense);
  }, []);

  const categories = [
    "All",
    "Trap",
    "Rage",
    "Drill",
    "Emotional",
    "Experimental",
  ];

  const filteredBeats = allBeats.filter((b) => {
    const matchesCategory = filter === "All" || b.genre === filter;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = b.title?.toLowerCase().includes(query);
    const genreMatch = b.genre?.toLowerCase().includes(query);
    const tagMatch = b.moodTags?.some((t: string) => t.toLowerCase().includes(query));
    return titleMatch || genreMatch || tagMatch;
  });

  return (
    <section
      id="store"
      className="py-24 px-6 max-w-7xl mx-auto relative z-10 w-full"
    >
      <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-16 gap-8">
        <div className="relative">
          {/* Glitch text effect behind heading */}
          <div className="absolute -inset-x-4 -inset-y-2 bg-red-900/10 blur-xl -z-10 mix-blend-screen opacity-50" />
          <h2 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 text-white relative flex gap-4 overflow-hidden">
            <motion.span
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              Available
            </motion.span>
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900"
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              Beats
            </motion.span>
          </h2>
          <p className="text-zinc-500 font-mono text-sm uppercase max-w-md tracking-widest border-l-2 border-red-600 pl-4">
            Digital licenses • Instant delivery
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative group flex-1 xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CATALOG..."
              className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/80 rounded-none py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 w-full transition-all font-mono placeholder:text-zinc-600 uppercase tracking-widest"
            />
            {/* Cyberpunk corner accents */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500 opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500 opacity-50 pointer-events-none" />
          </div>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="bg-zinc-900 border border-zinc-800 rounded-none px-4 py-3 text-zinc-400 hover:text-white hover:border-red-600 transition-colors font-mono text-xs uppercase tracking-widest"
            >
              Clear
            </button>
          ) : (
            <button
              onClick={() => {
                const el = document.getElementById("catalog-tracks");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-none px-6 py-3 text-zinc-400 hover:text-white hover:border-red-600 transition-colors flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Filter className="w-4 h-4" /> Filter
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-12 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2.5 rounded-none text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-all border snap-start relative overflow-hidden group ${
              filter === cat
                ? "bg-red-700/10 border-red-600 text-red-500"
                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            <span className="relative z-10">{cat}</span>
            {filter === cat && (
              <motion.div
                layoutId="activeFilter"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600"
              />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Header row for desktop */}
        <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-3 border-b border-zinc-800/50 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
          <div className="col-span-4">Track Identity</div>
          <div className="col-span-2">Specs</div>
          <div className="col-span-4">Aesthetics</div>
          <div className="col-span-2 text-right">Acquire</div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-3">
          {filteredBeats.map((beat) => {
            const isActive = currentTrack?.id === beat.id;
            const isHovered = hoveredBeatId === beat.id;

            return (
              <motion.div
                key={beat.id}
                onHoverStart={() => setHoveredBeatId(beat.id)}
                onHoverEnd={() => setHoveredBeatId(null)}
                className={`group grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center p-4 rounded-sm border transition-all duration-500 cursor-pointer overflow-hidden relative ${
                  isActive
                    ? "border-red-900/50 bg-gradient-to-r from-red-950/20 to-transparent"
                    : "border-zinc-800/50 hover:border-zinc-700 bg-zinc-950/30"
                }`}
                onClick={() => {
                  if (!isActive) playTrack(beat);
                }}
              >
                {/* Active scanline effect */}
                {isActive && (
                  <motion.div
                    className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent z-0"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}

                {/* Cover & Title */}
                <div className="col-span-1 lg:col-span-4 flex items-center gap-6 relative z-10">
                  <div
                    className="relative w-20 h-20 overflow-hidden flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack(beat);
                    }}
                  >
                    {typeof beat.coverUrl === "string" &&
                    beat.coverUrl.trim() !== "" ? (
                      <Image
                        src={beat.coverUrl}
                        alt={beat.title}
                        fill
                        className={`object-cover transition-transform duration-700 filter ${isActive ? "scale-110 contrast-125" : "group-hover:scale-105 grayscale group-hover:grayscale-0"}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-600 font-mono text-center p-2 leading-tight">
                        NO IMG
                      </div>
                    )}

                    {/* Play Overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all bg-black/40 ${isActive || isHovered ? "opacity-100 backdrop-blur-[2px]" : "opacity-0"}`}
                    >
                      {isActive && isPlaying ? (
                        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                          <Pause className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                          <Play className="w-5 h-5 ml-1" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`font-display font-black text-xl lg:text-2xl uppercase tracking-tighter truncate transition-colors ${isActive ? "text-red-500" : "text-zinc-200 group-hover:text-white"}`}
                    >
                      {beat.title}
                    </h3>
                    <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mt-1 flex items-center gap-2">
                      <span>{beat.genre}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span className={isActive ? "text-red-500/80" : ""}>
                        ID: {String(beat.id || "").padStart(4, "0")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="hidden lg:flex col-span-2 items-center gap-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                      Tempo
                    </span>
                    <div className="text-zinc-300 font-mono text-sm group-hover:text-red-400 transition-colors">
                      {beat.bpm}{" "}
                      <span className="text-[10px] text-zinc-600">BPM</span>
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-0.5 ml-2 h-4 w-12 opacity-80">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-red-500 rounded-full origin-bottom"
                          animate={{ height: ["20%", "100%", "20%"] }}
                          transition={{
                            duration: 0.5 + (i % 5) * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: (i % 3) * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags (Aesthetics) */}
                <div className="hidden lg:block col-span-4 relative z-10">
                  <div className="flex gap-2 flex-wrap">
                    {beat.moodTags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 border border-zinc-800/50 bg-black/20 px-3 py-1 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 lg:col-span-2 flex items-center justify-between lg:justify-end gap-6 w-full relative z-10">
                  <div className="flex flex-col lg:items-end">
                    <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest hidden lg:block mb-1">
                      License
                    </span>
                    <div className="font-mono text-base font-bold text-zinc-200">
                      ${beat.price}
                    </div>
                  </div>
                  <button
                    className="relative overflow-hidden group/btn bg-white hover:bg-zinc-200 text-black px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all w-full lg:w-auto z-10 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBeatForLicense(beat);
                    }}
                  >
                    {/* Hover slide effect inside button */}
                    <div className="absolute inset-0 bg-red-600 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out -z-10" />

                    <ShoppingCart className="w-3.5 h-3.5 group-hover/btn:text-white transition-colors duration-300" />
                    <span className="group-hover/btn:text-white transition-colors duration-300">
                      Acquire
                    </span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 1-Click Instagram DM & License Acquisition Modal */}
      <LicenseModal
        beat={selectedBeatForLicense}
        isOpen={!!selectedBeatForLicense}
        onClose={() => setSelectedBeatForLicense(null)}
      />
    </section>
  );
}
