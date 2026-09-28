import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CctvFeed } from '@/components/CctvFeed';
import { BeatStore } from '@/components/BeatStore';
import { Portfolio } from '@/components/Portfolio';
import { Contact } from '@/components/Contact';
import { Player } from '@/components/Player';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white pb-28 relative">
      {/* Background cyber grid & ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-red-950/15 rounded-full blur-[160px]" />
      </div>

      <Header />
      <Hero />
      <CctvFeed />
      <BeatStore />
      <Portfolio />
      <Contact />
      <Player />
    </div>
  );
}
