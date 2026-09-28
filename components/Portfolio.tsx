'use client';

import React from 'react';
import { Award, Disc, ExternalLink, Headphones, Play, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { PORTFOLIO_RELEASES, LICENSE_TIERS } from '@/lib/data';

export function Portfolio() {
  return (
    <section id="credits" className="py-20 border-t border-zinc-900 bg-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Discography & Placements */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-mono uppercase tracking-widest mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>DISCOGRAPHY & PRODUCED WORKS</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
              PROVEN TRACK RECORD
            </h2>
            <p className="text-zinc-400 text-sm font-mono mt-2">
              Major label artists, underground trailblazers, and millions of worldwide streams engineered by AMITDIED.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PORTFOLIO_RELEASES.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-zinc-950 border border-zinc-800 p-4 hover:border-red-600/60 transition-all hover:-translate-y-1 overflow-hidden"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 border border-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-red-400 border border-zinc-800">
                    {item.platform}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-800 flex items-center gap-1">
                    <Headphones className="w-3 h-3 text-red-500" />
                    <span>{item.streams}</span>
                  </div>
                </div>

                <h3 className="font-display font-bold text-white text-base truncate group-hover:text-red-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                  {item.artist}
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>{item.role}</span>
                  <span>{item.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Licensing Guide & Pricing Matrix */}
        <div id="licensing" className="pt-12 border-t border-zinc-900">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono uppercase tracking-widest mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
              <span>TRANSPARENT LICENSING MATRIX</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
              CLEAR TERMS. ZERO HEADACHES.
            </h2>
            <p className="text-zinc-400 text-sm font-mono mt-2">
              Every lease includes an official contract agreement and untagged broadcast-ready files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LICENSE_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                  tier.recommended
                    ? 'bg-zinc-950 border-red-500 shadow-2xl shadow-red-950/40 ring-1 ring-red-500'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">
                    RECOMMENDED CHOICE
                  </div>
                )}

                <div>
                  <h3 className="font-display font-black text-xl text-white mb-2">{tier.name}</h3>
                  <div className="text-3xl font-display font-black text-red-500 mb-6">
                    ${tier.price}
                    <span className="text-xs text-zinc-500 font-mono font-normal ml-1">/ beat</span>
                  </div>

                  <div className="space-y-3 font-mono text-xs text-zinc-300 mb-6 border-y border-zinc-800/80 py-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Distribution:</span>
                      <span className="text-right text-zinc-200">{tier.streamsLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Music Videos:</span>
                      <span className="text-right text-zinc-200">{tier.musicVideos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Radio Stations:</span>
                      <span className="text-right text-zinc-200">{tier.radioBroadcasting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Live Shows:</span>
                      <span className="text-right text-zinc-200">{tier.forProfitLivePerformances ? 'Yes (For Profit)' : 'Non-Profit Only'}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 text-xs font-mono text-zinc-400">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="#beats"
                  className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-center transition-all ${
                    tier.recommended
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                  }`}
                >
                  SELECT BEAT & LEASE
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
