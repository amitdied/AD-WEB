'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  Disc, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { useAudio } from '@/lib/AudioContext';
import { LicenseModal } from './LicenseModal';

export function Player() {
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    visualizerData,
  } = useAudio();

  const [isLicenseOpen, setIsLicenseOpen] = useState(false);

  if (!currentBeat) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 shadow-2xl transition-all">
        {/* Top Seek Progress Bar */}
        <div
          className="relative w-full h-1.5 bg-zinc-800 hover:h-2.5 transition-all cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seek(clickPos * duration);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Left: Track Info */}
          <div className="flex items-center gap-3 min-w-0 w-1/4 sm:w-1/3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentBeat.coverUrl}
              alt={currentBeat.title}
              className={`w-12 h-12 rounded-lg object-cover border border-zinc-800 shrink-0 ${isPlaying ? 'ring-2 ring-red-500/50 animate-pulse' : ''}`}
            />
            <div className="min-w-0">
              <h4 className="text-white font-display font-bold text-sm truncate flex items-center gap-1.5">
                <span>{currentBeat.title}</span>
              </h4>
              <p className="text-zinc-400 text-xs font-mono truncate">
                {currentBeat.bpm} BPM • {currentBeat.key}
              </p>
            </div>
          </div>

          {/* Center: Controls & Timestamps */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
            <div className="flex items-center gap-4">
              <button
                onClick={prevTrack}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/30"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Audio Visualizer + Volume + License CTA */}
          <div className="flex items-center justify-end gap-4 w-1/4 sm:w-1/3">
            {/* Visualizer bars */}
            <div className="hidden xl:flex items-center gap-0.5 h-6">
              {visualizerData.slice(0, 14).map((val, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full transition-all duration-100"
                  style={{
                    height: isPlaying ? `${Math.max(4, (val / 100) * 24)}px` : '3px',
                    opacity: isPlaying ? 0.9 : 0.3,
                  }}
                />
              ))}
            </div>

            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Mute / Unmute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume slider"
                className="w-18 accent-red-600 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* License button */}
            <button
              onClick={() => setIsLicenseOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-900/30 whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LICENSE</span>
              <span>${currentBeat.price}</span>
            </button>
          </div>
        </div>
      </div>

      <LicenseModal
        beat={currentBeat}
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
      />
    </>
  );
}
