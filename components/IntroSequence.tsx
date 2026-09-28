'use client';

import React from 'react';
import { useOSBoot } from '@/hooks/useOSBoot';
import { Terminal, Disc3, ShieldAlert, Cpu } from 'lucide-react';

export function IntroSequence() {
  const { bootProgress, skipBoot } = useOSBoot();

  return (
    <div className="fixed inset-0 z-[120] bg-black text-red-500 font-mono flex flex-col items-center justify-center p-6 select-none">
      {/* Background CRT scan lines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-40"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex items-center justify-between border-b border-red-950 pb-3 text-xs tracking-widest text-zinc-500">
          <div className="flex items-center gap-2 text-red-500">
            <Cpu className="w-4 h-4 animate-pulse" />
            <span>AMITDIED // SOUND PROTOCOL V4</span>
          </div>
          <span className="font-bold text-white">{bootProgress}%</span>
        </div>

        <div className="space-y-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-red-500">▶</span>
            <span>INITIALIZING HIGH-PRECISION AUDIO ENGINE...</span>
          </div>
          {bootProgress > 25 && (
            <div className="flex items-center gap-2">
              <span className="text-red-500">▶</span>
              <span>CALIBRATING 808 SUBWOOFER HARMONICS...</span>
            </div>
          )}
          {bootProgress > 50 && (
            <div className="flex items-center gap-2">
              <span className="text-red-500">▶</span>
              <span>FETCHING UNTAGGED STEM MASTER VAULTS...</span>
            </div>
          )}
          {bootProgress > 75 && (
            <div className="flex items-center gap-2 text-white">
              <span className="text-red-500">▶</span>
              <span className="animate-pulse">MOUNTING STEREO INTERFACE...</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150"
            style={{ width: `${bootProgress}%` }}
          />
        </div>

        {/* Skip button */}
        <div className="pt-4 text-center">
          <button
            onClick={skipBoot}
            className="px-4 py-1.5 rounded-lg border border-red-950 bg-red-950/20 text-zinc-400 hover:text-white hover:border-red-600 text-[11px] font-mono tracking-widest uppercase transition-all"
          >
            [ SKIP BOOT SEQUENCE ]
          </button>
        </div>
      </div>
    </div>
  );
}
