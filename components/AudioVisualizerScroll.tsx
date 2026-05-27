'use client';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export function AudioVisualizerScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-50%", "0%"]);
  
  // Create an array of random heights for the waveform
  const waveformHeights = Array.from({ length: 40 }).map((_, i) => 20 + ((i * 13) % 80));

  return (
    <section ref={ref} className="relative py-32 bg-black overflow-hidden border-y border-zinc-900">
      <div className="absolute inset-0 bg-red-950/10 mix-blend-screen pointer-events-none" />
      
      {/* Background massive glitch text */}
      <motion.div 
         className="absolute inset-0 flex items-center whitespace-nowrap text-[20vw] font-black font-display text-zinc-900/30 uppercase z-0 tracking-tighter"
         style={{ x: x1 }}
      >
         EXPERIMENTAL BASS EXPERIMENTAL BASS
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 mb-20 text-center">
         <h2 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">
            Sonic <span className="text-red-600">Architecture</span>
         </h2>
         <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em]">Audio Reactive Elements // Sub-Bass Frequencies</p>
      </div>
      
      {/* Waveform Visualization */}
      <div className="relative z-10 w-full h-[400px] flex flex-col justify-center gap-12 overflow-hidden">
         {/* Top Waveform Row */}
         <motion.div style={{ x: x2 }} className="flex gap-2 items-center min-w-[200vw] h-40">
            {waveformHeights.map((h, i) => (
               <motion.div 
                  key={`top-${i}`}
                  className="w-4 bg-zinc-800 rounded-full"
                  animate={{ height: [`${h}%`, `${h * 0.4}%`, `${h * 1.5}%`, `${h}%`] }}
                  transition={{ 
                     duration: 0.8 + ((i % 5) / 5), 
                     repeat: Infinity, 
                     ease: "easeInOut",
                     delay: (i % 7) * 0.3
                  }}
               />
            ))}
            {waveformHeights.map((h, i) => (
               <motion.div 
                  key={`top-dup-${i}`}
                  className="w-4 bg-zinc-800 rounded-full"
                  animate={{ height: [`${h}%`, `${h * 0.4}%`, `${h * 1.5}%`, `${h}%`] }}
                  transition={{ 
                     duration: 0.8 + ((i % 5) / 5), 
                     repeat: Infinity, 
                     ease: "easeInOut",
                     delay: (i % 7) * 0.3
                  }}
               />
            ))}
         </motion.div>

         {/* Bottom Waveform Row (Red Accent) */}
         <motion.div style={{ x: x1 }} className="flex gap-3 items-center min-w-[200vw] h-48 ml-[20vw]">
            {waveformHeights.map((h, i) => (
               <motion.div 
                  key={`bot-${i}`}
                  className={`w-6 rounded-t-sm shadow-[0_0_15px_rgba(220,38,38,0.2)] ${i % 4 === 0 ? 'bg-red-600' : 'bg-red-900'}`}
                  animate={{ height: [`${h * 0.5}%`, `${h * 1.2}%`, `${h * 0.2}%`, `${h * 0.5}%`] }}
                  transition={{ 
                     duration: 0.6 + ((i % 4) / 4), 
                     repeat: Infinity, 
                     ease: "easeInOut",
                     delay: (i % 6) * 0.25
                  }}
               />
            ))}
            {waveformHeights.map((h, i) => (
               <motion.div 
                  key={`bot-dup-${i}`}
                  className={`w-6 rounded-t-sm shadow-[0_0_15px_rgba(220,38,38,0.2)] ${i % 4 === 0 ? 'bg-red-600' : 'bg-red-900'}`}
                  animate={{ height: [`${h * 0.5}%`, `${h * 1.2}%`, `${h * 0.2}%`, `${h * 0.5}%`] }}
                  transition={{ 
                     duration: 0.6 + ((i % 4) / 4), 
                     repeat: Infinity, 
                     ease: "easeInOut",
                     delay: (i % 6) * 0.25
                  }}
               />
            ))}
         </motion.div>
      </div>

      {/* Edge Gradients for fading */}
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />
    </section>
  );
}
