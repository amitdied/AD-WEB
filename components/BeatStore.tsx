'use client';

import React, { useState, useMemo } from 'react';
import { Play, Pause, Search, Filter, ShoppingBag, Music, Disc3, Sparkles, SlidersHorizontal } from 'lucide-react';
import { INITIAL_BEATS, Beat } from '@/lib/data';
import { useAudio } from '@/lib/AudioContext';
import { LicenseModal } from './LicenseModal';

export function BeatStore() {
  const { currentBeat, isPlaying, playBeat } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'bpm-asc' | 'bpm-desc'>('popular');
  const [selectedBeatForLicense, setSelectedBeatForLicense] = useState<Beat | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  const genres = ['All', 'Dark Trap', 'Rage', 'Melodic Drill', 'Ambient Phonk', 'Cinematic Trap', 'Cyberpunk'];

  // Filter and sort beats
  const filteredBeats = useMemo(() => {
    return INITIAL_BEATS.filter((beat) => {
      const matchesSearch =
        beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beat.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        beat.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenre = selectedGenre === 'All' || beat.genre === selectedGenre;

      return matchesSearch && matchesGenre;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.plays - a.plays;
      if (sortBy === 'newest') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      if (sortBy === 'bpm-asc') return a.bpm - b.bpm;
      if (sortBy === 'bpm-desc') return b.bpm - a.bpm;
      return 0;
    });
  }, [searchQuery, selectedGenre, sortBy]);

  const openLicenseModal = (beat: Beat) => {
    setSelectedBeatForLicense(beat);
    setIsLicenseModalOpen(true);
  };

  return (
    <section id="beats" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-red-500 tracking-widest font-bold mb-2">
            <Disc3 className="w-4 h-4 animate-spin" />
            <span>BEATS VAULT // CATALOGUE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
            SELECT YOUR NEXT HIT
          </h2>
          <p className="text-zinc-400 text-sm font-mono mt-1">
            Untagged MP3, WAV and multi-track stems available with instant licensing.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          SHOWING <span className="text-white font-bold">{filteredBeats.length}</span> PRODUCTIONS
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title, tag, artist vibe, BPM, or key (e.g., 'Travis', '140', 'C# Minor')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-mono"
            />
          </div>

          {/* Sort dropdown */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="relative w-full">
              <SlidersHorizontal className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort beats catalog"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-3 text-xs font-mono text-zinc-300 uppercase tracking-wider focus:outline-none focus:border-red-600 cursor-pointer appearance-none"
              >
                <option value="popular">Sort: Most Popular</option>
                <option value="newest">Sort: Newest Drops</option>
                <option value="bpm-asc">Sort: BPM (Low to High)</option>
                <option value="bpm-desc">Sort: BPM (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Genre Pill Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedGenre === genre
                  ? 'bg-red-600 text-white font-bold border border-red-500 shadow-md shadow-red-950/40'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800/80 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Beats List */}
      <div className="space-y-2.5">
        {filteredBeats.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950 rounded-2xl border border-zinc-900">
            <Music className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-mono text-sm">No beats found matching your search filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 text-zinc-300 text-xs font-mono hover:text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredBeats.map((beat, idx) => {
            const isCurrent = currentBeat?.id === beat.id;
            const isPlayingThis = isCurrent && isPlaying;

            return (
              <div
                key={beat.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-zinc-900/90 border-red-700/60 shadow-lg shadow-red-950/30 ring-1 ring-red-600/30'
                    : 'bg-zinc-950/70 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/40'
                }`}
              >
                {/* Track Details: Play + Artwork + Title */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {/* Play Button */}
                  <button
                    onClick={() => playBeat(beat)}
                    className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-all ${
                      isPlayingThis
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                        : 'bg-zinc-900 text-zinc-300 group-hover:bg-red-600 group-hover:text-white group-hover:scale-105'
                    }`}
                    aria-label={isPlayingThis ? 'Pause' : 'Play'}
                  >
                    {isPlayingThis ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Artwork */}
                  <div className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden border border-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={beat.coverUrl}
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-sm sm:text-base truncate group-hover:text-red-400 transition-colors">
                        {beat.title}
                      </span>
                      {beat.featured && (
                        <span className="shrink-0 text-[9px] font-mono uppercase bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800/60">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mt-0.5">
                      <span>{beat.genre}</span>
                      <span>•</span>
                      <span>{beat.bpm} BPM</span>
                      <span>•</span>
                      <span className="text-zinc-400">{beat.key}</span>
                    </div>
                  </div>
                </div>

                {/* Animated Waveform Visualizer on Active Track */}
                <div className="hidden lg:flex items-center gap-1 px-4 w-40 h-6 shrink-0">
                  {Array.from({ length: 16 }).map((_, barIdx) => (
                    <span
                      key={barIdx}
                      className={`w-1 rounded-full bg-red-600/40 transition-all duration-150 ${
                        isPlayingThis ? 'animate-pulse' : 'h-1.5'
                      }`}
                      style={{
                        height: isPlayingThis ? `${Math.max(4, Math.sin(barIdx * 0.8 + Date.now() / 400) * 20 + 8)}px` : '4px',
                        backgroundColor: isPlayingThis ? '#ef4444' : '#52525b',
                      }}
                    />
                  ))}
                </div>

                {/* Tags / Sub-info */}
                <div className="hidden md:flex items-center gap-1.5 px-4 shrink-0">
                  {beat.tags.slice(0, 2).map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Price and Licensing Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 shrink-0">
                  <div className="sm:text-right">
                    <span className="text-[10px] text-zinc-500 font-mono block">STARTING AT</span>
                    <span className="text-sm font-display font-black text-white font-mono">
                      ${beat.price}
                    </span>
                  </div>

                  <button
                    onClick={() => openLicenseModal(beat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-red-600 text-zinc-200 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all border border-zinc-800 hover:border-red-600"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>LICENSE</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Licensing Modal */}
      <LicenseModal
        beat={selectedBeatForLicense}
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />
    </section>
  );
}
