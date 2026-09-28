'use client';

import React from 'react';
import { Play, Pause, Flame, Disc, ShieldCheck, ArrowRight, Music2, Sparkles } from 'lucide-react';
import { useAudio } from '@/lib/AudioContext';
import { INITIAL_BEATS } from '@/lib/data';
import { CDAnimation } from './CDAnimation';

export function Hero() {
  const { currentBeat, isPlaying, playBeat } = useAudio();
  const featuredBeat = INITIAL_BEATS[0];
  const isCurrentPlaying = currentBeat?.id === featuredBeat.id && isPlaying;

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 border-b border-zinc-900">
      {/* Background ambient crimson glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-red-600/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-rose-950/20 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-mono tracking-widest uppercase">
              <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>OFFICIAL PRODUCER VAULT // AMITDIED</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-white uppercase leading-[1.05]">
              DARK MELODIC & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-zinc-400">
                INDUSTRIAL SOUNDS
              </span>
            </h1>

            <p className="text-zinc-400 text-base sm:text-lg max-w-xl font-light leading-relaxed">
              Curated catalog of heavy analog 808s, haunting bells, and cinematic drill/trap textures.
              All beats are instantly downloadable untagged with verified license agreements.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#beats"
                className="px-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs font-mono uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-xl shadow-red-900/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>EXPLORE ALL BEATS</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => playBeat(featuredBeat)}
                className="px-6 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-200 font-mono text-xs uppercase tracking-widest border border-zinc-800 hover:border-red-500/60 flex items-center gap-2.5 transition-all"
              >
                {isCurrentPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-red-500" />
                    <span>PAUSE PREVIEW</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-red-500 fill-red-500" />
                    <span>PREVIEW LATEST DROP</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust and Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80 max-w-lg">
              <div>
                <div className="font-display font-black text-2xl text-white">10M+</div>
                <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">Streams Generated</div>
              </div>
              <div>
                <div className="font-display font-black text-2xl text-red-500">100%</div>
                <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">Royalty Retention</div>
              </div>
              <div>
                <div className="font-display font-black text-2xl text-white">INSTANT</div>
                <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">WAV & Stems</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic CD Jewel Case Animation */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full flex flex-col items-center">
              <CDAnimation />

              {/* Now Playing Interactive Strip under CD */}
              <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-zinc-400">NOW SPINNING:</span>
                <span className="text-white font-bold">{currentBeat?.title || featuredBeat.title}</span>
                <button
                  onClick={() => playBeat(currentBeat || featuredBeat)}
                  className="ml-2 text-red-400 hover:text-white underline text-[11px]"
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
