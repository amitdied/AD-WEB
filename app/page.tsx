'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AudioProvider } from '@/lib/AudioContext';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { BeatStore } from '@/components/BeatStore';
import { StickyPlayer } from '@/components/StickyPlayer';
import { Portfolio } from '@/components/Portfolio';
import { InstagramTeaser } from '@/components/InstagramTeaser';
import { Contact } from '@/components/Contact';
import { IntroSequence } from '@/components/IntroSequence';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { OSBootProvider, useOSBoot } from '@/hooks/useOSBoot';
import { WorldMode } from '@/components/world/WorldMode';

const ScrollSequence = dynamic(
  () => import('@/components/ScrollSequence').then((mod) => mod.ScrollSequence),
  { ssr: false }
);

function AppContent() {
  const { isBooted } = useOSBoot();
  const [worldState, setWorldState] = useState<'closed' | 'entering' | 'open' | 'exiting'>('closed');

  return (
    <>
      {!isBooted && <IntroSequence />}

      {/* World Mode Fullscreen Shell */}
      {worldState !== 'closed' && (
        <WorldMode
          stage={worldState}
          onExit={() => setWorldState('exiting')}
          onEntered={() => setWorldState('open')}
          onExited={() => setWorldState('closed')}
        />
      )}

      {/* Small Native Top-Left Control: ENTER AMITDIED WORLD */}
      {worldState === 'closed' && isBooted && (
        <button
          onClick={() => setWorldState('entering')}
          className="fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-zinc-400 hover:text-red-400 bg-black/85 hover:bg-zinc-950 backdrop-blur-md border border-zinc-800/90 hover:border-red-600/70 px-2.5 py-1.5 rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.9)] cursor-pointer group select-none"
          title="Enter AMITDIED World"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 group-hover:bg-red-500 animate-pulse group-hover:shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
          <span>ENTER AMITDIED WORLD</span>
        </button>
      )}
      
      <main
        aria-hidden={worldState !== 'closed'}
        className={`min-h-screen pb-24 selection:bg-red-500/30 transition-opacity duration-1000 ${
          isBooted ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'
        } ${worldState !== 'closed' ? 'pointer-events-none opacity-0' : ''}`}
      >
        <ParallaxBackground />
        {/* Element 3: Global CRT scanline overlay reacting to Kick Transient and Highs */}
        <div
          className="pointer-events-none fixed inset-0 z-[100] h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] mix-blend-overlay transition-opacity duration-75 ease-out"
          style={{ opacity: "var(--audio-crt-opacity, 0.20)" }}
        />
        
        <Header />
        <Hero />
        <ScrollSequence />
        <BeatStore />
        <Portfolio />
        <InstagramTeaser />
        <Contact />
        <StickyPlayer />
      </main>
    </>
  );
}

export default function Home() {
  return (
    <OSBootProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </OSBootProvider>
  );
}

