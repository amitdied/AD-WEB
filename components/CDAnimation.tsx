'use client';

import React, { useRef } from 'react';
import { useAudio } from '@/lib/AudioContext';

export function CDAnimation() {
  const { isPlaying, currentBeat } = useAudio();
  const discRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto perspective-1000 select-none">
      {/* Outer Glow */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000 ${
          isPlaying ? 'opacity-40 bg-red-600' : 'opacity-15 bg-zinc-700'
        }`} 
      />

      {/* Jewel CD Case Background / Sleeve */}
      <div className="absolute inset-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-xl -rotate-3 transition-transform duration-700 group-hover:rotate-0">
        {/* Cover Art Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentBeat?.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
          alt={currentBeat?.title || 'AMITDIED Jewel Case'}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Case Spine / Spine Bar */}
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-zinc-800 to-zinc-900 border-r border-zinc-700/50 flex flex-col items-center justify-between py-4">
          <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-widest [writing-mode:vertical-rl] rotate-180">
            AMITDIED // ARCHIVE 2026
          </span>
          <span className="text-[8px] font-mono text-red-500 font-bold">
            01
          </span>
        </div>

        {/* Text Details on Case */}
        <div className="absolute bottom-4 left-7 right-4">
          <span className="text-[9px] font-mono uppercase tracking-widest text-red-500 font-bold block mb-1">
            {currentBeat?.genre || 'DARK TRAP'}
          </span>
          <h3 className="text-sm sm:text-base font-display font-black text-white tracking-wider truncate">
            {currentBeat?.title || 'VALKYRIE PROTOCOL'}
          </h3>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
            <span>{currentBeat?.bpm || 144} BPM</span>
            <span>{currentBeat?.key || 'C# Minor'}</span>
          </div>
        </div>
      </div>

      {/* Spinning Optical Compact Disc (CD) */}
      <div 
        ref={discRef}
        className={`absolute top-0 right-0 w-60 h-60 sm:w-68 sm:h-68 md:w-80 md:h-80 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-zinc-700/60 transition-transform duration-700 ease-out flex items-center justify-center translate-x-6 sm:translate-x-12 -translate-y-2`}
        style={{
          background: 'radial-gradient(circle, #1a1a1a 0%, #0d0d0d 30%, #1f1f1f 40%, #0f0f0f 65%, #2a2a2a 75%, #111111 100%)',
          animation: isPlaying ? 'spin 5s linear infinite' : 'none',
        }}
      >
        {/* Holographic Rainbow Sheen Reflection Layer */}
        <div 
          className="absolute inset-0 rounded-full opacity-40 pointer-events-none mix-blend-color-dodge"
          style={{
            background: 'conic-gradient(from 45deg, transparent, rgba(239, 68, 68, 0.4), rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.4), transparent, rgba(239, 68, 68, 0.4))',
          }}
        />

        {/* CD Micro-Grooves */}
        <div className="absolute inset-4 rounded-full border border-zinc-800/80 pointer-events-none" />
        <div className="absolute inset-8 rounded-full border border-zinc-800/60 pointer-events-none" />
        <div className="absolute inset-12 rounded-full border border-zinc-800/40 pointer-events-none" />

        {/* Center Label */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-red-600 via-zinc-900 to-black border-2 border-red-500/50 flex flex-col items-center justify-center p-2 text-center shadow-inner relative z-10">
          <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-300 font-bold">
            AMITDIED
          </span>
          <span className="text-[10px] font-display font-black text-white truncate max-w-[80px]">
            {currentBeat?.title ? currentBeat.title.split(' ')[0] : 'VALKYRIE'}
          </span>
          <span className="text-[7px] font-mono text-red-400 mt-0.5">
            COMPACT DISC
          </span>

          {/* Center Hole */}
          <div className="w-8 h-8 rounded-full bg-black border-2 border-zinc-700/80 shadow-inner flex items-center justify-center mt-1">
            <div className="w-4 h-4 rounded-full bg-transparent border border-zinc-600/40"></div>
          </div>
        </div>

        {/* Transparent Inner Ring of CD */}
        <div className="absolute w-36 h-36 rounded-full border border-zinc-600/30 pointer-events-none" />
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: translate(2rem, -0.5rem) rotate(0deg);
          }
          to {
            transform: translate(2rem, -0.5rem) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
