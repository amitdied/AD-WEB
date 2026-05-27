'use client';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useOSBoot } from '@/hooks/useOSBoot';

export function IntroSequence() {
  const { completeBoot, playSystemSound } = useOSBoot();
  const [stage, setStage] = useState<'start' | 'ad' | 'reveal' | 'done'>('start');
  const overlayRef = useRef<HTMLDivElement>(null);

  const startSequence = () => {
    setStage('ad');
    playSystemSound('impact');
    setTimeout(() => playSystemSound('glitch'), 500);
    setTimeout(() => playSystemSound('glitch'), 1200);
    setTimeout(() => playSystemSound('glitch'), 1800);
    
    // Simulated sequence timing
    setTimeout(() => {
      setStage('reveal');
      playSystemSound('impact');
    }, 4000); 
    setTimeout(() => setStage('done'), 7000);
  };

  useEffect(() => {
    if (stage === 'done') {
      completeBoot();
    }
  }, [stage, completeBoot]);

  if (stage === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div 
        ref={overlayRef}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Persistent Grain Texture */}
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay pointer-events-none" />

        {stage === 'start' && (
          <motion.div 
            className="relative z-10 flex flex-col items-center cursor-pointer group"
            onClick={startSequence}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <motion.h1 
              className="font-display font-black text-2xl uppercase tracking-[0.5em] text-zinc-500 group-hover:text-red-500 transition-colors"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Enter
            </motion.h1>
            <div className="mt-4 text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
              Warning: Flashing Lights & Loud Audio
            </div>
          </motion.div>
        )}

        {stage === 'ad' && (
           <div className="relative z-10 w-full h-full flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 1.2] }}
                transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                className="absolute font-display font-black text-5xl md:text-8xl uppercase tracking-tighter text-white whitespace-nowrap"
              >
                COMING FROM
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: [0, 1, 0], scale: [1.5, 1, 0.8] }}
                transition={{ duration: 0.5, delay: 0.6, times: [0, 0.5, 1] }}
                className="absolute font-display font-black text-6xl md:text-9xl uppercase tracking-tighter text-red-600 whitespace-nowrap"
              >
                THE UNDERGROUND
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -100, skewX: 20 }}
                animate={{ opacity: [0, 1, 0], x: [-100, 0, 100], skewX: [20, 0, -20] }}
                transition={{ duration: 0.6, delay: 1.2, times: [0, 0.5, 1] }}
                className="absolute font-display font-black text-7xl md:text-[10rem] uppercase tracking-tighter text-white whitespace-nowrap mix-blend-difference"
              >
                NO INDUSTRY
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: [0, 1, 1, 0], y: [100, 0, 0, -100] }}
                transition={{ duration: 1, delay: 1.8, times: [0, 0.2, 0.8, 1] }}
                className="absolute font-display font-black text-8xl md:text-[12rem] uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-red-900 to-red-500 whitespace-nowrap"
              >
                NO RULES
              </motion.div>

              {/* Strobe Effect */}
              <motion.div 
                 className="absolute inset-0 bg-white z-20 pointer-events-none mix-blend-overlay"
                 animate={{ opacity: [0, 1, 0, 1, 0] }}
                 transition={{ duration: 0.4, delay: 1.8, times: [0, 0.2, 0.4, 0.6, 1] }}
              />
           </div>
        )}

        {stage === 'reveal' && (
          <div className="relative z-10 w-full h-full flex items-center justify-center bg-black">
            {/* Cinematic Red Glow */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.5, scale: 1.5 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-red-900/30 rounded-full blur-[100px]"
            />
            {/* Main Logo Reveal */}
            <motion.h1
              initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-black text-7xl md:text-9xl lg:text-[12rem] tracking-tighter uppercase relative"
              style={{
                textShadow: "0 0 40px rgba(220, 38, 38, 0.5)",
              }}
            >
              <span className="text-zinc-200">AMIT</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-900">DIED</span>
            </motion.h1>

            {/* Smoke Particles substitution (using floating divs) */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full blur-sm"
                initial={{ 
                  x: (((i * 13) % 100) - 50) + "vw",
                  y: (((i * 17) % 100) - 50) + "vh",
                  opacity: 0 
                }}
                animate={{ 
                  y: "-=100", 
                  opacity: [0, 0.5, 0],
                  scale: [1, 2, 1]
                }}
                transition={{ 
                  duration: 2 + ((i % 5) * 0.4), 
                  repeat: Infinity,
                  delay: ((i % 7) * 0.3) 
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
