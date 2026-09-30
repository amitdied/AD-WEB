"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

type RollingStage = 'HIDDEN' | 'START' | 'GRIND' | 'PAPER' | 'FILL' | 'ROLL' | 'SUCCESS';

export default function SmokeSessionPage() {
  // ==========================================
  // 1. ORIGINAL PAGE STATE
  // ==========================================
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  const toggle = () => setIsPlaying((prev) => !prev);


  // ==========================================
  // 2. SECRET ROLLING GAME STATE & LOGIC
  // ==========================================
  const [stage, setStage] = useState<RollingStage>('HIDDEN');
  const [grindProgress, setGrindProgress] = useState(0);
  const [fillPos, setFillPos] = useState(0);
  const [fillDirection, setFillDirection] = useState(1);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 200);
  };

  useEffect(() => {
    if (stage !== 'FILL') return;
    const interval = setInterval(() => {
      setFillPos((prev) => {
        if (prev >= 100) { setFillDirection(-1); return 99; }
        if (prev <= 0) { setFillDirection(1); return 1; }
        return prev + 3 * fillDirection;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [stage, fillDirection]);

  const handleGrind = () => {
    setGrindProgress((prev) => {
      const next = prev + 15;
      triggerShake();
      if (next >= 100) {
        setTimeout(() => setStage('PAPER'), 300);
        return 100;
      }
      return next;
    });
  };

  const handleFillTap = () => {
    if (fillPos > 40 && fillPos < 60) {
      triggerShake();
      setStage('ROLL');
    } else {
      triggerShake(); // Miss penalty
    }
  };


  // ==========================================
  // 3. RENDER (YOUR UI + THE HIDDEN GAME)
  // ==========================================
  return (
    <div className={`min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center ${shake ? 'animate-shake' : ''}`}>
      
      {/* --- YOUR ORIGINAL UI --- */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-sm tracking-widest uppercase hover:text-red-500 transition-colors z-40"
      >
        ← Back
      </Link>

      <div className="relative flex flex-col items-center z-10">
        <video
          ref={videoRef}
          src="/smoking-loop.mp4"
          muted
          loop
          playsInline
          className="w-full max-w-[420px] h-auto object-contain"
          style={{ maxHeight: "70vh" }}
        />

        <button
          onClick={toggle}
          className={`mt-10 px-8 py-3 text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 border ${
            isPlaying
              ? "border-orange-500 text-orange-400 hover:bg-orange-500/10"
              : "border-white/40 text-white hover:border-white hover:bg-white/5"
          }`}
        >
          {isPlaying ? "PUT OUT" : "MAKE HIM SMOKE"}
        </button>
      </div>
      {/* --- END ORIGINAL UI --- */}


      {/* --- SECRET CORNER BUTTON --- */}
      <button
        onClick={() => setStage('START')}
        className="fixed bottom-6 right-6 z-40 text-xs font-mono text-red-900/40 hover:text-red-500 hover:shadow-[0_0_10px_red] transition-all duration-300 uppercase tracking-widest cursor-crosshair border border-transparent hover:border-red-900/50 px-2 py-1"
      >
        [ Roll Blunt ]
      </button>


      {/* --- THE HIDDEN ROLLING GAME OVERLAY --- */}
      <AnimatePresence>
        {stage !== 'HIDDEN' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center selection:bg-red-900 font-mono"
          >
            {/* CRT Overlay */}
            <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay"></div>
            
            {/* Abort Game Button */}
            <button 
              onClick={() => { setStage('HIDDEN'); setGrindProgress(0); }}
              className="absolute top-6 right-6 text-red-900 hover:text-red-500 z-50 font-bold uppercase tracking-widest"
            >
              [ Abort ]
            </button>

            <AnimatePresence mode="wait">
              {/* STAGE: START */}
              {stage === 'START' && (
                <motion.div key="start" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center z-10">
                  <h1 className="text-6xl font-black mb-8 tracking-tighter uppercase text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    ILLEGAL STASH
                  </h1>
                  <button onClick={() => setStage('GRIND')} className="px-8 py-4 border-2 border-red-600 font-bold text-red-600 hover:bg-red-600 hover:text-black transition-colors uppercase tracking-widest">
                    Spark It
                  </button>
                </motion.div>
              )}

              {/* STAGE: GRIND */}
              {stage === 'GRIND' && (
                <motion.div key="grind" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full max-w-md px-6 z-10">
                  <h2 className="text-3xl font-bold mb-12 text-red-600 uppercase tracking-widest">1. Crush</h2>
                  <div className="w-full h-8 border-2 border-red-900 mb-8 relative">
                    <motion.div className="h-full bg-red-600" initial={{ width: '0%' }} animate={{ width: `${grindProgress}%` }} />
                  </div>
                  <button onPointerDown={handleGrind} className="w-48 h-48 rounded-full border-4 border-red-600 flex items-center justify-center text-xl font-bold text-red-600 uppercase active:bg-red-900 transition-colors select-none">
                    Mash
                  </button>
                </motion.div>
              )}

              {/* STAGE: PAPER */}
              {stage === 'PAPER' && (
                <motion.div key="paper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full max-w-md px-6 z-10">
                  <h2 className="text-3xl font-bold mb-12 text-red-600 uppercase tracking-widest text-center">2. Wrap</h2>
                  <div className="w-full h-32 border-2 border-dashed border-red-900 relative flex items-center justify-center mb-12">
                    <div className="w-16 h-full bg-red-900/20 absolute"></div>
                    <motion.div
                      drag="x" dragConstraints={{ left: -150, right: 150 }} dragElastic={0.2}
                      onDragEnd={(e, info) => { if (Math.abs(info.offset.x) < 20) { triggerShake(); setStage('FILL'); } }}
                      className="w-24 h-24 bg-amber-900/80 backdrop-blur-sm cursor-grab active:cursor-grabbing border-2 border-amber-700 z-20"
                    />
                  </div>
                </motion.div>
              )}

              {/* STAGE: FILL */}
              {stage === 'FILL' && (
                <motion.div key="fill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full max-w-md px-6 z-10">
                  <h2 className="text-3xl font-bold mb-12 text-red-600 uppercase tracking-widest text-center">3. Pack It</h2>
                  <div className="w-full h-12 border-2 border-red-900 relative mb-12">
                    <div className="absolute left-[40%] right-[40%] h-full bg-green-900/40 border-x border-green-500"></div>
                    <div className="absolute top-[-8px] bottom-[-8px] w-4 bg-red-500 shadow-[0_0_10px_rgba(220,38,38,1)]" style={{ left: `calc(${fillPos}% - 8px)` }}></div>
                  </div>
                  <button onClick={handleFillTap} className="px-12 py-6 border-2 border-red-600 text-xl text-red-600 font-bold hover:bg-red-600 hover:text-black transition-colors uppercase">
                    Lock In
                  </button>
                </motion.div>
              )}

              {/* STAGE: ROLL */}
              {stage === 'ROLL' && (
                <motion.div key="roll" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full max-w-md px-6 z-10">
                  <h2 className="text-3xl font-bold mb-12 text-red-600 uppercase tracking-widest text-center">4. Roll & Lick</h2>
                  <div className="w-full h-64 border-2 border-red-900/50 flex flex-col justify-end items-center pb-4 relative overflow-hidden">
                    <motion.div
                      drag="y" dragConstraints={{ top: -200, bottom: 0 }} dragElastic={0.1}
                      onDragEnd={(e, info) => { if (info.offset.y < -150) { triggerShake(); setStage('SUCCESS'); } }}
                      className="w-48 h-12 bg-amber-800 cursor-grab active:cursor-grabbing shadow-[0_0_20px_rgba(180,83,9,0.6)]"
                    />
                  </div>
                </motion.div>
              )}

              {/* STAGE: SUCCESS */}
              {stage === 'SUCCESS' && (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
                  <video src="/smoking-loop.mp4" autoPlay loop playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  <div className="relative z-30 flex flex-col items-center">
                    <motion.h1 initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl font-black text-red-500 mb-12 uppercase tracking-tighter drop-shadow-2xl">
                      SESSION ACTIVE
                    </motion.h1>
                    <button onClick={() => { setGrindProgress(0); setStage('HIDDEN'); }} className="px-8 py-4 border-2 border-red-600 text-red-600 font-bold bg-black/50 hover:bg-red-600 hover:text-black uppercase">
                      Put Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GLOBAL CSS FOR SHAKE ANIMATION --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          50% { transform: translateX(5px) rotate(1deg); }
          75% { transform: translateX(-5px) rotate(-1deg); }
        }
        .animate-shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
      `}} />
    </div>
  );
}