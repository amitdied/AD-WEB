'use client';

import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';

export function Header() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 100);
  });

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-black/90 backdrop-blur-xl border-zinc-800/50 py-4' : 'bg-transparent border-transparent py-8 pointer-events-none'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between pointer-events-auto">
          
          <Link href="/" className="font-display font-black text-2xl tracking-[0.2em] uppercase text-white hover:text-red-500 transition-colors flex items-center gap-3 relative z-50">
            AMIT<span className="text-red-600">DIED</span>
            <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-0.5 rounded-sm border border-red-500/30 hidden sm:block">SYS.1</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 relative z-50">
            {['Store', 'Portfolio', 'About', 'Contact'].map((item) => (
               <Link 
                 key={item} 
                 href={`/#${item.toLowerCase()}`}
                 className="relative group hover:text-white transition-colors"
               >
                 {item}
                 <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-red-600 transition-all duration-300 group-hover:w-full" />
               </Link>
            ))}
            
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-zinc-500 hover:text-red-500 transition-colors border border-zinc-800/80 hover:border-red-600/50 px-2.5 py-1 rounded text-[10px] tracking-wider"
              title="Admin Panel"
            >
              <Lock className="w-3 h-3 text-red-500" />
              <span>Admin</span>
            </Link>
          </nav>

          <button 
            className="md:hidden relative z-50 text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Fullscreen Overlay */}
      <motion.div 
         initial={false}
         animate={{ 
            clipPath: menuOpen ? "circle(150% at calc(100% - 2rem) 2rem)" : "circle(0% at calc(100% - 2rem) 2rem)"
         }}
         transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
         className="fixed inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center"
      >
         {/* Noise overlay */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
         
         <nav className="flex flex-col gap-6 text-center">
            {['Store', 'Portfolio', 'About', 'Contact'].map((item, i) => (
               <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: menuOpen ? 1 : 0, y: menuOpen ? 0 : 20 }}
                  transition={{ duration: 0.5, delay: menuOpen ? 0.2 + (i * 0.1) : 0 }}
               >
                  <Link 
                     href={`/#${item.toLowerCase()}`}
                     onClick={() => setMenuOpen(false)}
                     className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter hover:text-red-500 transition-colors"
                  >
                     {item}
                  </Link>
               </motion.div>
            ))}

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: menuOpen ? 1 : 0, y: menuOpen ? 0 : 20 }}
               transition={{ duration: 0.5, delay: 0.7 }}
               className="pt-2"
            >
               <Link 
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 text-sm uppercase font-mono tracking-widest text-zinc-500 hover:text-red-500 transition-colors border border-zinc-800 px-4 py-2 rounded-full"
               >
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                  <span>Admin Portal</span>
               </Link>
            </motion.div>
         </nav>
      </motion.div>
    </>
  );
}
