"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Maximize2, Minimize2, Sparkles } from "lucide-react";

interface WorldModeProps {
  stage: "entering" | "open" | "exiting";
  onExit: () => void;
  onEntered: () => void;
  onExited: () => void;
}

export function WorldMode({
  stage,
  onExit,
  onEntered,
  onExited,
}: WorldModeProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Focus iframe on mount/stage changes so keyboard events (WASD / arrows) work immediately
  const focusIframe = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.focus();
    } catch {
      // Cross-origin fallback (same-origin works transparently)
    }
  }, []);

  useEffect(() => {
    if (stage === "entering" || stage === "open") {
      const timer = setTimeout(() => {
        focusIframe();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stage, focusIframe]);

  // Handle ESC key to exit world mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  return (
    <AnimatePresence onExitComplete={onExited}>
      {stage !== "exiting" && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[70] w-full h-full bg-[#302b66] overflow-hidden select-none"
        >
          {/* Top-Center Quick Control Bar (doesn't collide with Little Hollow's Top-Left Card or Top-Right Sound Icon) */}
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onExit}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/80 hover:bg-black text-zinc-200 hover:text-white border border-white/20 hover:border-red-500/80 rounded-full font-mono text-[10px] tracking-[0.2em] uppercase backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all cursor-pointer group active:scale-95"
              title="Return to AMITDIED site (or press Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-red-400" />
              <span>EXIT WORLD</span>
              <kbd className="hidden sm:inline bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-zinc-400 font-sans">
                ESC
              </kbd>
            </button>

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

          {/* Initial Loading Screen */}
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

          {/* Embedded attached HTML file as the entire AMITDIED WORLD */}
          <iframe
            ref={iframeRef}
            src="/assets/aistudio/amitdied-world-free-roam_233ea8dd.html"
            title="AMITDIED WORLD"
            className="w-full h-full border-0 block"
            allow="autoplay; fullscreen"
            onLoad={() => {
              setIsLoaded(true);
              onEntered();
              focusIframe();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WorldMode;
