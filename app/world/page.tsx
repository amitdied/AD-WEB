"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, Sparkles } from "lucide-react";

export default function WorldPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#302b66] overflow-hidden select-none">
      {/* Top-Center Quick Nav Controls */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 pointer-events-auto">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 bg-black/80 hover:bg-black text-zinc-200 hover:text-white border border-white/20 hover:border-red-500/80 rounded-full font-mono text-[10px] tracking-[0.2em] uppercase backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all cursor-pointer group active:scale-95"
          title="Return to AMITDIED Beat Store"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-red-400" />
          <span>EXIT TO SITE</span>
        </Link>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-black/80 hover:bg-black text-zinc-300 hover:text-white border border-white/20 rounded-full backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all cursor-pointer active:scale-95"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-[75] flex flex-col items-center justify-center bg-[#302b66] text-white">
          <div className="relative mb-4 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-[#ff7a59] animate-spin" />
            <Sparkles className="w-5 h-5 text-[#ff7a59] absolute" />
          </div>
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#fff3df]/80">
            LOADING AMITDIED WORLD...
          </p>
        </div>
      )}

      {/* Embedded attached HTML file */}
      <iframe
        src="/assets/aistudio/amitdied-world-free-roam_233ea8dd.html"
        title="AMITDIED WORLD"
        className="w-full h-full border-0 block"
        allow="autoplay; fullscreen"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
