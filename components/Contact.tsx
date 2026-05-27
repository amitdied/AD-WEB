'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Terminal, Code, Cpu, ExternalLink, Zap } from 'lucide-react';
import { useOSBoot } from '@/hooks/useOSBoot';

export function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverState, setHoverState] = useState(false);
  const { playSystemSound } = useOSBoot();

  useGSAP(() => {
    // Flickering ambient terminal light
    gsap.to('.terminal-ambient', {
      opacity: () => Math.random() * 0.3 + 0.1,
      duration: 0.1,
      repeat: -1,
      yoyo: true,
      ease: 'steps(3)'
    });
  }, { scope: containerRef });

  const handleMouseEnter = () => {
    setHoverState(true);
    playSystemSound('hover');
    gsap.to('.dm-target', {
      scale: 1.05,
      textShadow: '0 0 20px #ff0000',
      duration: 0.2
    });
  };

  const handleMouseLeave = () => {
    setHoverState(false);
    gsap.to('.dm-target', {
      scale: 1,
      textShadow: '0 0 0px #ff0000',
      duration: 0.2
    });
  };

  return (
    <section 
      id="contact" 
      ref={containerRef}
      className="relative min-h-screen py-32 px-6 flex flex-col justify-between bg-black overflow-hidden border-t border-zinc-800"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[#050505] z-0" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay z-0 pointer-events-none" />
      
      {/* Scanlines & Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] opacity-40 mix-blend-overlay" />
        <div className="w-full h-full bg-[linear-gradient(transparent_95%,rgba(255,0,0,0.05)_100%)] bg-[length:100%_20px]" />
      </div>

      <div className="terminal-ambient absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-24 border-b border-red-900/50 pb-8 gap-8">
        <div>
          <div className="flex items-center gap-3 text-red-500 mb-4 animate-pulse">
            <Terminal className="w-6 h-6" />
            <span className="font-mono text-sm uppercase tracking-[0.3em]">SECURE_TERMINAL_V1.0</span>
          </div>
          <h2 className="font-display text-5xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none mix-blend-screen relative inline-block">
            <span className="relative z-10 dm-target">CONNECT</span>
            {hoverState && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: [0, 1, 0, 1], x: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 text-red-600 mix-blend-color-dodge dm-target"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}
              >
                CONNECT
              </motion.span>
            )}
            {hoverState && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: [1, 0, 1, 0], x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="absolute inset-0 text-blue-600 mix-blend-color-dodge dm-target"
                style={{ clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)' }}
              >
                CONNECT
              </motion.span>
            )}
          </h2>
        </div>

        <div className="text-right flex flex-col items-end">
           <div className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase max-w-[250px] leading-relaxed">
             Direct channel to underground vault.<br />
             Custom inquiries.<br />
             Exclusive rights.
           </div>
        </div>
      </div>

      {/* Main Terminal Window */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 flex-1 items-center">
        
        {/* Left: Data / Status */}
        <div className="space-y-12">
          
          <div className="border-l-2 border-red-800 focus-within:border-red-500 p-6 bg-zinc-900/30 backdrop-blur-sm relative group transition-colors">
             <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
               <Cpu className="w-4 h-4 text-red-500" />
             </div>
             <p className="font-mono text-sm text-zinc-400 mb-2 uppercase tracking-widest">System Status</p>
             <p className="font-mono text-xl text-white uppercase tracking-wider flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse" />
                Awaiting Transmission
             </p>
          </div>

          <div className="space-y-4 font-mono text-xs text-zinc-500 tracking-widest uppercase">
            <p className="flex justify-between border-b border-zinc-800 py-2">
              <span>Encryption</span>
              <span className="text-red-500">256-bit ACTIVE</span>
            </p>
            <p className="flex justify-between border-b border-zinc-800 py-2">
              <span>Location</span>
              <span className="text-white">UNKNOWN</span>
            </p>
            <p className="flex justify-between border-b border-zinc-800 py-2">
              <span>Node</span>
              <span className="text-white">AMITDIED-01</span>
            </p>
          </div>

        </div>

        {/* Right: Instagram Direct Portal */}
        <div className="relative h-full flex flex-col justify-center">
          
          {/* Decorative frame */}
          <div className="absolute inset-0 border border-zinc-800 bg-zinc-900/10 pointer-events-none" />
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600 pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-600 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600 pointer-events-none" />

          {/* Glitch Overlay on Hover (handled by CSS/Framer) */}
          <div className="relative z-10 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
             
             <motion.a 
               href="https://instagram.com/amitdied"
               target="_blank"
               rel="noopener noreferrer"
               onHoverStart={handleMouseEnter}
               onHoverEnd={handleMouseLeave}
               className="group relative inline-flex flex-col items-center justify-center gap-6 cursor-pointer"
             >
                {hoverState && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="absolute inset-0 bg-red-600/10 blur-xl rounded-full" 
                  />
                )}
                
                <div className="relative w-24 h-24 border-2 border-red-600 bg-black flex items-center justify-center transform transition-transform group-hover:rotate-45 duration-500 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.2)] group-hover:shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                   <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(220,38,38,0.2)_50%,transparent_55%)] translate-x-[-100%] translate-y-[-100%] group-hover:translate-x-[100%] group-hover:translate-y-[100%] transition-transform duration-1000" />
                   <div className="transform transition-transform group-hover:-rotate-45 duration-500">
                     <Zap className={`w-8 h-8 ${hoverState ? 'text-white' : 'text-red-500'}`} />
                   </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                   <h3 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tighter text-white group-hover:text-red-500 transition-colors flex items-center gap-2">
                      Open Direct Channel
                   </h3>
                   <p className="font-mono text-xs md:text-sm text-zinc-500 tracking-[0.3em] uppercase group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                      @amitdied <ExternalLink className="w-3 h-3" />
                   </p>
                </div>

                <div className="mt-8 border border-zinc-700 bg-zinc-900/50 px-6 py-3 flex items-center gap-3">
                   <Code className="w-4 h-4 text-zinc-500" />
                   <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                      Custom Beats • Collabs • Rights
                   </span>
                </div>
             </motion.a>

          </div>
        </div>

      </div>

      {/* Footer Meta */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mt-24 pt-8 border-t border-zinc-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4">
            <span className="w-3 h-3 bg-red-600 block animate-pulse" />
            <span className="font-display font-black text-xl tracking-tighter text-zinc-300 uppercase">AMITDIED</span>
         </div>
         
         <div className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.4em] text-center md:text-right flex flex-col gap-1">
            <p>© {new Date().getFullYear()} ARCHIVE_OS. ALL RIGHTS RESERVED.</p>
            <p>UNAUTHORIZED REPLICATION IS PROHIBITED.</p>
         </div>
      </div>
    </section>
  );
}
