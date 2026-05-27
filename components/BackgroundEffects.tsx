'use client';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Abstract Animated Smoke/Fog Elements */}
      <motion.div 
         animate={{
            x: ["-20%", "20%", "-20%"],
            y: ["0%", "10%", "0%"],
            opacity: [0.1, 0.3, 0.1],
         }}
         transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
         className="absolute top-0 left-[-20%] w-[80vw] h-[80vh] bg-red-900/10 blur-[120px] rounded-full mix-blend-screen"
      />
      <motion.div 
         animate={{
            x: ["20%", "-20%", "20%"],
            y: ["10%", "-10%", "10%"],
            opacity: [0.1, 0.2, 0.1],
         }}
         transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
         className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-blue-900/10 blur-[100px] rounded-full mix-blend-screen"
      />
      
      {/* Floating Artifacts */}
      {Array.from({ length: 8 }).map((_, i) => (
         <motion.div
            key={i}
            className="absolute rounded-full bg-white/20 blur-[1px]"
            style={{
               width: ((i % 5) * 1) + 2 + 'px',
               height: ((i % 3) * 1.5) + 2 + 'px',
               top: ((i * 13) % 100) + '%',
               left: ((i * 17) % 100) + '%',
            }}
            animate={{
               y: ["-50px", "50px", "-50px"],
               x: ["-20px", "20px", "-20px"],
               opacity: [0, 0.5, 0]
            }}
            transition={{
               duration: 10 + (i % 10),
               repeat: Infinity,
               ease: "linear",
               delay: (i % 5)
            }}
         />
      ))}
    </div>
  );
}
