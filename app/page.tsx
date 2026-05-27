'use client';
import { AudioProvider } from '@/lib/AudioContext';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { BeatStore } from '@/components/BeatStore';
import { StickyPlayer } from '@/components/StickyPlayer';
import { Portfolio } from '@/components/Portfolio';
import { Contact } from '@/components/Contact';
import { IntroSequence } from '@/components/IntroSequence';
import { ScrollSequence } from '@/components/ScrollSequence';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { OSBootProvider, useOSBoot } from '@/hooks/useOSBoot';

function AppContent() {
  const { isBooted } = useOSBoot();

  return (
    <>
      {!isBooted && <IntroSequence />}
      
      <main className={`min-h-screen pb-24 selection:bg-red-500/30 transition-opacity duration-1000 ${isBooted ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
        <ParallaxBackground />
        {/* Global CRT scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-[100] h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay"></div>
        
        <Header />
        <Hero />
        <ScrollSequence />
        <BeatStore />
        <Portfolio />
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

