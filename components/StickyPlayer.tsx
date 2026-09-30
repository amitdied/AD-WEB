'use client';
import { useState } from 'react';
import { useAudio } from '@/lib/AudioContext';
import { Play, Pause, SkipForward, SkipBack, Heart, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

export function StickyPlayer() {
  const { currentTrack, isPlaying, progress, togglePlay, seek } = useAudio();
  const [isDragging, setIsDragging] = useState(false);

  if (!currentTrack) return null;

  const calculatePercentage = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const barContainer = e.currentTarget;
    const percentage = calculatePercentage(clientX, barContainer);
    seek(percentage);

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const p = calculatePercentage(moveClientX, barContainer);
      seek(p);
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-zinc-800 pt-1 px-4 pb-0 h-24 flex flex-col justify-between"
    >
      {/* Progress Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-4 flex items-center cursor-pointer group select-none"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <div className={`w-full bg-zinc-800 group-hover:bg-zinc-700 relative transition-all ${isDragging ? 'h-1.5' : 'h-1'}`}>
          <div 
            className={`bg-red-600 relative group-hover:bg-red-500 transition-all ${isDragging ? 'h-1.5 bg-red-500' : 'h-full'}`}
            style={{ width: `${progress}%` }}
          >
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-opacity ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'}`} />
          </div>
        </div>
      </div>

      <div className="h-full max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          <div className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
            <Image src={currentTrack.coverUrl} alt={currentTrack.title} fill className="object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-bold text-base truncate">{currentTrack.title}</h4>
            <div className="flex gap-2 text-xs text-zinc-400">
              <span>{currentTrack.bpm} BPM</span>
            </div>
          </div>
          <button className="text-zinc-500 hover:text-red-500 transition-colors hidden sm:block ml-2">
            <Heart size={18} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex flex-row items-center gap-6">
            <button className="text-zinc-400 hover:text-white transition-colors">
              <SkipBack size={20} className="fill-current" />
            </button>
            <button 
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause size={20} className="fill-current" />
              ) : (
                <Play size={20} className="fill-current ml-1" />
              )}
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <SkipForward size={20} className="fill-current" />
            </button>
          </div>
        </div>

        {/* Extra actions / Volume */}
        <div className="w-1/3 flex justify-end items-center gap-4 pr-2">
           <button className="text-zinc-400 hover:text-white">
              <Volume2 size={18} />
           </button>
           <button 
             onClick={() => {
               if (typeof window !== "undefined") {
                 window.dispatchEvent(new CustomEvent("open-license-modal", { detail: currentTrack }));
               }
             }}
             className="bg-red-700 hover:bg-red-600 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-sm transition-all hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] uppercase tracking-wider hidden sm:flex items-center gap-1.5 cursor-pointer"
             title="Acquire Beat / Instant Instagram DM"
           >
              <span>Acquire ${currentTrack.price}</span>
           </button>
        </div>
      </div>
    </motion.div>
  );
}
