'use client';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export function CinematicScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  // Stages of scroll:
  // 0.0 - 0.3: Vinyl fades in and rotates up from flat
  // 0.3 - 0.6: Vinyl scales up and centers, spinning
  // 0.6 - 1.0: Vinyl slides right into a player

  const rotateX = useTransform(scrollYProgress, [0, 0.3], [75, 0]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], [0, 720]); // Spinning
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.5, 1.2, 1.2, 0.9]);
  const x = useTransform(scrollYProgress, [0.6, 0.9], ["0%", "60%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // Player animations
  const playerX = useTransform(scrollYProgress, [0.5, 0.7], ["100%", "30%"]);
  const playerOpacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);

  return (
    <section ref={ref} className="h-[300vh] bg-black relative border-t border-zinc-900 z-10 hidden lg:block overflow-x-clip">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        
        {/* Background text reacting to scroll */}
        <motion.div 
           className="absolute inset-0 flex items-center justify-center text-[12vw] font-display font-black text-zinc-900/80 uppercase whitespace-nowrap z-0 pointer-events-none tracking-tighter"
           style={{ x: useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]) }}
        >
           SPIN THE BLOCK
        </motion.div>

        {/* The Vinyl */}
        <motion.div 
           className="relative z-20 w-[500px] h-[500px] rounded-full bg-zinc-950 border-[2px] border-zinc-800 flex items-center justify-center"
           style={{ 
              rotateX, 
              rotateZ, 
              scale, 
              x, 
              opacity,
              boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 0 40px rgba(255,255,255,0.03)'
           }}
        >
           {/* Vinyl grooves */}
           <div className="absolute inset-2 rounded-full border border-zinc-800/40" />
           <div className="absolute inset-6 rounded-full border border-zinc-800/30" />
           <div className="absolute inset-10 rounded-full border border-zinc-800/20" />
           <div className="absolute inset-14 rounded-full border border-zinc-900/50" />
           <div className="absolute inset-[80px] rounded-full border border-zinc-800/20" />
           <div className="absolute inset-[120px] rounded-full border border-zinc-800/30" />
           
           {/* Reflections to make it look like vinyl */}
           <div className="absolute w-full h-[150%] bg-white/5 rotate-45 pointer-events-none -translate-y-1/4 mix-blend-overlay" />
           <div className="absolute w-[150%] h-full bg-white/5 -rotate-45 pointer-events-none -translate-x-1/4 mix-blend-overlay" />
           
           {/* Center label */}
           <div className="w-40 h-40 rounded-full bg-red-900 border-2 border-red-500 flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.3)]">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
              
              {/* Spindle hole */}
              <div className="w-5 h-5 bg-zinc-950 rounded-full border border-zinc-800 z-10 shadow-inner" />
              
              <div className="absolute font-display font-black text-sm uppercase text-white tracking-widest top-6">AMITDIED</div>
              <div className="absolute h-[1px] w-8 bg-red-400/50 left-4 top-1/2" />
              <div className="absolute h-[1px] w-8 bg-red-400/50 right-4 top-1/2" />
              <div className="absolute font-mono text-[8px] font-bold uppercase text-red-200 bottom-6">33 ⅓ RPM</div>
           </div>
        </motion.div>

        {/* The Player / Sleeve */}
        <motion.div 
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[45vw] h-[70vh] bg-zinc-950/95 backdrop-blur-2xl border-l border-t border-b border-zinc-800/80 rounded-l-[40px] z-30 shadow-[-30px_0_80px_rgba(0,0,0,0.9)] flex items-center p-12 overflow-hidden"
          style={{ x: playerX, opacity: playerOpacity }}
        >
           {/* Player glass reflection */}
           <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
           
           <div className="w-full h-full border border-zinc-800/60 rounded-3xl relative overflow-hidden flex flex-col justify-between p-10 bg-zinc-900/30">
               <div className="relative z-10 flex justify-between items-start">
                  <div>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_#ef4444]" />
                        <span className="font-mono text-[10px] text-red-500 uppercase tracking-[0.3em] font-bold">System Active</span>
                     </div>
                     <h3 className="font-display text-6xl font-black uppercase text-white tracking-tighter leading-none mb-2">ANALOG<br/>SYNDICATE</h3>
                     <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] pl-1 border-l border-red-900/50">High Fidelity Audio Interface</p>
                  </div>
                  
                  {/* Fake dials */}
                  <div className="flex gap-4">
                     <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                        <div className="w-1 h-8 bg-zinc-600 rounded-full origin-bottom rotate-[45deg]" />
                     </div>
                     <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                        <div className="w-1 h-8 bg-red-600 rounded-full origin-bottom rotate-[-20deg]" />
                     </div>
                  </div>
               </div>
               
               {/* Minimalist Equalizer / Grid */}
               <div className="relative z-10 w-full mt-12 grid grid-cols-12 gap-2 h-32 items-end border-b border-zinc-800/50 pb-4">
                  {[...Array(12)].map((_, i) => (
                     <div key={i} className="flex flex-col gap-1 items-center justify-end h-full">
                        <motion.div 
                           className={`w-full ${i % 3 === 0 ? 'bg-red-600' : 'bg-red-900'} rounded-t-sm opacity-80`}
                           animate={{ height: ["10%", "90%", "20%", "70%", "10%"] }}
                           transition={{ 
                              duration: 1 + ((i % 5) * 0.3), 
                              repeat: Infinity, 
                              ease: "easeInOut", 
                              delay: (i % 3) * 0.3 
                           }}
                        />
                        <span className="font-mono text-[8px] text-zinc-600">{i + 1}</span>
                     </div>
                  ))}
               </div>
               
               <div className="w-full flex justify-between items-center mt-6 text-[10px] font-mono text-zinc-500 tracking-[0.2em] relative z-10">
                  <span>FREQ: 20Hz-20kHz</span>
                  <span>SYNC: LOCKED</span>
               </div>
           </div>
        </motion.div>

      </div>
    </section>
  );
}
