"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Pause, X, Disc, Terminal, Volume2 } from "lucide-react";
import { useAudio } from "@/lib/AudioContext";
import { beats as hardcodedBeats } from "@/lib/data";
import { formatINR } from "@/lib/utils";

interface BeatArchiveTerminalProps {
  onClose: () => void;
}

export function BeatArchiveTerminal({ onClose }: BeatArchiveTerminalProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();
  const [beats, setBeats] = useState<any[]>(hardcodedBeats);
  const [loading, setLoading] = useState(true);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(
    currentTrack?.id || null
  );

  // Fetch real beat data from the existing /api/beats route with hardcoded fallback
  useEffect(() => {
    let isMounted = true;
    const fetchBeats = async () => {
      try {
        const res = await fetch("/api/beats", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setBeats(data);
        }
      } catch {
        if (isMounted) {
          setBeats(hardcodedBeats);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBeats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle ESC key to close archive
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

  const selectedBeat = beats.find((b) => b.id === (selectedBeatId || currentTrack?.id)) || beats[0];

  const handleSelectAndPlay = (beat: any) => {
    setSelectedBeatId(beat.id);
    if (currentTrack?.id === beat.id) {
      togglePlay();
    } else {
      playTrack(beat);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="In-World Beat Archive Terminal"
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono"
    >
      {/* Terminal Screen Container */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-4xl max-h-[88vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(34,197,94,0.15)] overflow-hidden"
      >
        {/* Terminal Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_3px] opacity-40 mix-blend-overlay" />

        {/* Terminal Top Bar */}
        <div className="relative z-40 px-4 sm:px-6 py-3.5 bg-black border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <div className="text-xs sm:text-sm font-bold tracking-[0.25em] text-white">
              AMITDIED <span className="text-emerald-400">{"// BEAT ARCHIVE"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
            <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>NODE 01 // DATABASE: ONLINE</span>
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

        {/* Main Content Area */}
        <div className="relative z-20 flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[360px]">
          {/* Left Column: Compact Beat List (7 Cols) */}
          <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-zinc-800/80 overflow-y-auto p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-zinc-500 pb-2 border-b border-zinc-900 px-2">
              <span>AVAILABLE MASTER STEMS</span>
              <span>{beats.length} ENTRIES</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500 tracking-[0.2em] animate-pulse">
                SYNCING AUDIO DATABASE...
              </div>
            ) : beats.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 tracking-[0.2em]">
                NO BEATS CATALOGUED
              </div>
            ) : (
              beats.map((beat, idx) => {
                const isCurrent = currentTrack?.id === beat.id;
                const isSelected = selectedBeat?.id === beat.id;
                const currentlyPlayingThis = isCurrent && isPlaying;

                return (
                  <div
                    key={beat.id}
                    onClick={() => setSelectedBeatId(beat.id)}
                    className={`group p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? "bg-emerald-950/20 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : "bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndPlay(beat);
                        }}
                        className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-transform ${
                          currentlyPlayingThis
                            ? "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            : "bg-zinc-900 text-zinc-300 hover:text-white group-hover:scale-105"
                        }`}
                        title={currentlyPlayingThis ? "Pause" : "Play"}
                      >
                        {currentlyPlayingThis ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`font-bold truncate text-xs ${
                              isSelected ? "text-emerald-300" : "text-zinc-200"
                            }`}
                          >
                            {beat.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-0.5">
                          {beat.bpm ? <span>{beat.bpm} BPM</span> : null}
                          {beat.key ? <span>• {beat.key}</span> : null}
                          {beat.genre ? <span>• {beat.genre}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] font-bold text-zinc-300">
                        {formatINR(beat.price || 1999)}
                      </div>
                      {currentlyPlayingThis && (
                        <div className="text-[9px] text-emerald-400 tracking-wider flex items-center justify-end gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>LIVE</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: In-World Loaded Beat Inspection (5 Cols) */}
          <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-black/60">
            {selectedBeat ? (
              <div className="space-y-4">
                {/* Now Loaded Status */}
                <div className="space-y-1 pb-3 border-b border-zinc-900">
                  <div className="text-[9px] tracking-[0.25em] text-emerald-500 uppercase font-bold flex items-center gap-1.5">
                    <Disc className="w-3 h-3 text-emerald-400" />
                    <span>NOW LOADED</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider truncate">
                    {selectedBeat.title}
                  </h3>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-3 rounded border border-zinc-900">
                  <div>
                    <span className="text-[9px] text-zinc-600 block uppercase">TEMPO</span>
                    <span className="text-zinc-300 font-bold">{selectedBeat.bpm || 140} BPM</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-600 block uppercase">SCALE / KEY</span>
                    <span className="text-zinc-300 font-bold">{selectedBeat.key || "F# MINOR"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-600 block uppercase">GENRE</span>
                    <span className="text-zinc-300 font-bold">{selectedBeat.genre || "DARK TRAP"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-600 block uppercase">LEASING PRICE</span>
                    <span className="text-emerald-400 font-bold">{formatINR(selectedBeat.price || 1999)}</span>
                  </div>
                </div>

                {/* Audio Signal Telemetry */}
                <div className="p-3 bg-zinc-950/80 rounded border border-zinc-900/90 text-[10px] space-y-1.5 text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 uppercase tracking-widest">AUDIO SIGNAL</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        currentTrack?.id === selectedBeat.id && isPlaying
                          ? "text-emerald-400"
                          : "text-zinc-500"
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                      {currentTrack?.id === selectedBeat.id && isPlaying ? "ONLINE" : "STANDBY"}
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-600 leading-relaxed">
                    ROUTED DIRECTLY TO AMITDIED MASTER MONITOR SYSTEM.
                  </div>
                </div>

                {/* Big Preview Control Button */}
                <button
                  type="button"
                  onClick={() => handleSelectAndPlay(selectedBeat)}
                  className={`w-full py-2.5 px-4 rounded text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    currentTrack?.id === selectedBeat.id && isPlaying
                      ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600"
                      : "bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  }`}
                >
                  {currentTrack?.id === selectedBeat.id && isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>PAUSE PREVIEW</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>PREVIEW MASTER</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="my-auto text-center text-xs text-zinc-600 tracking-widest">
                SELECT A BEAT TO INSPECT
              </div>
            )}

            {/* Bottom Terminal Notice */}
            <div className="pt-3 border-t border-zinc-900 text-[9px] text-zinc-600 tracking-wider text-center">
              PURCHASE LICENSES VIA PUBLIC BEAT STORE • ESC TO RETURN
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default BeatArchiveTerminal;
