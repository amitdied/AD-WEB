'use client';
import { motion, useScroll, useTransform } from 'motion/react';
import { Button } from './ui/button';
import { ArrowRight, Play, ChevronDown } from 'lucide-react';
import { useRef } from 'react';
import Link from 'next/link';

export function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
     target: ref,
     offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-black z-0">
      
      {/* Background Kinetic Text */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-[0.03] text-white font-display font-black leading-none break-words uppercase whitespace-nowrap z-0 flex items-center justify-center w-[200vw] -translate-x-[50vw]">
         <motion.div 
            animate={{ x: ["0%", "-50%", "0%"] }} 
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            className="text-[30vw] tracking-tighter"
         >
            AMITDIED AMITDIED AMITDIED
         </motion.div>
      </div>

      {/* Parallax Background Gradient & Noise */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black"></div>
        {/* Animated Orbs */}
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 100, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-red-950/30 rounded-full blur-[150px]"
        />
        {/* Element 4: Ambient Noise/Grain overlay reacting subtly to High Frequencies */}
        <div
          className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none transition-opacity duration-150 ease-out"
          style={{ opacity: "var(--audio-grain-opacity, 0.15)" }}
        />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center mt-20">
        
        {/* Kinetic Title */}
        <div className="overflow-hidden mb-6 relative">
           <motion.div
              initial={{ y: 200, rotate: 10 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative"
           >
              <h1 className="font-display font-black text-7xl md:text-[8rem] lg:text-[12rem] tracking-[-.05em] uppercase leading-[0.8] text-center text-white mix-blend-difference">
                AMIT<br/>
                <span className="text-red-600 block -mt-4 mix-blend-normal relative">
                  DIED
                  {/* Glitch sub-layer */}
                  <motion.span 
                    className="absolute inset-0 text-red-500 opacity-50 mix-blend-screen mix-blend-color-dodge -z-10 translate-x-[5px] translate-y-[2px]"
                    animate={{ x: [0, 5, -5, 0], y: [0, -2, 2, 0] }}
                    transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
                  >
                    DIED
                  </motion.span>
                </span>
              </h1>
           </motion.div>
        </div>
        
        <motion.div
           initial={{ opacity: 0, filter: "blur(10px)" }}
           animate={{ opacity: 1, filter: "blur(0px)" }}
           transition={{ duration: 1, delay: 0.8 }}
           className="w-full max-w-2xl text-center"
        >
           <p className="text-zinc-400 font-mono text-sm md:text-base uppercase tracking-[0.3em] mb-12">
             <span className="block border-b border-zinc-800/50 pb-4 mb-4">Underground Sound Architecture</span>
             <span className="text-zinc-600">01 / 888 / NO RULES</span>
           </p>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
             <button 
                className="group relative overflow-hidden bg-white text-black px-8 py-4 uppercase font-black text-sm tracking-[0.2em] w-full sm:w-auto inline-flex justify-center items-center gap-3 transition-transform hover:scale-105 active:scale-95"
                onClick={() => document.getElementById('store')?.scrollIntoView({ behavior: 'smooth' })}
             >   
                <span className="relative z-10">Access Store</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-2 transition-transform" />
             </button>
             
             <button className="group relative overflow-hidden bg-transparent border border-zinc-700 text-white px-8 py-4 uppercase font-bold text-sm tracking-[0.2em] w-full sm:w-auto inline-flex justify-center items-center gap-3 hover:border-red-600 transition-colors">
                <div className="absolute inset-0 bg-red-600/10 -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play className="w-4 h-4 fill-white" />
                Latest Release
             </button>

             <Link 
                href="/smoke-session"
                className="group relative overflow-hidden bg-transparent border border-zinc-700 text-white px-8 py-4 uppercase font-bold text-sm tracking-[0.2em] w-full sm:w-auto inline-flex justify-center items-center gap-3 hover:border-red-600 transition-colors"
             >
                <div className="absolute inset-0 bg-red-600/10 -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                Smoke Session
             </Link>
           </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
         className="absolute bottom-12 left-1/2 -translate-x-1/2 text-zinc-600 flex flex-col items-center gap-2"
         animate={{ y: [0, 10, 0] }}
         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
         <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll</span>
         <div className="w-[1px] h-12 bg-gradient-to-b from-zinc-600 to-transparent" />
      </motion.div>
    </section>
  );
}
