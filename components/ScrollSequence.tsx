'use client';

import React from 'react';
import { Disc, Zap, Flame, Shield, Radio, Sparkles } from 'lucide-react';

export function ScrollSequence() {
  const items = [
    'DARK TRAP',
    'HEAVY 808S',
    'METRO BOOMIN STYLE',
    'DRILL VIBES',
    'PHONK OVERDRIVE',
    'CINEMATIC BRASS',
    'EXCLUSIVE RIGHTS AVAILABLE',
    'INSTANT WAV STEMS',
    'MULTI-PLATINUM CREDITS',
  ];

  return (
    <div className="relative w-full overflow-hidden border-y border-red-950/60 bg-zinc-950 py-3 my-6">
      {/* Red ambient tint */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-zinc-900/20 to-red-900/10 pointer-events-none" />

      <div className="flex w-max animate-marquee space-x-8 whitespace-nowrap">
        {[...items, ...items, ...items].map((text, idx) => (
          <div key={idx} className="flex items-center space-x-4 text-xs font-mono tracking-widest text-zinc-400 uppercase">
            <span className="text-red-500 font-bold">✦</span>
            <span className="hover:text-white transition-colors">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
