'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('.parallax-layer');
    
    // Animate background elements at different speeds
    elements.forEach((el, index) => {
      const speed = (index + 1) * 0.2;
      gsap.to(el, {
        y: () => -window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <div className="parallax-layer absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black" />
      <div className="parallax-layer absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-red-800/10 rounded-full blur-[120px]" />
      <div className="parallax-layer absolute top-[60%] left-[5%] w-[40vw] h-[40vw] bg-blue-900/10 rounded-full blur-[140px]" />
      
      {/* Particles/Dust */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div 
          key={i}
          className="parallax-layer absolute w-1.5 h-1.5 bg-red-500/20 rounded-full blur-[1px]"
          style={{
            top: `${(i * 17) % 100}%`,
            left: `${(i * 23) % 100}%`,
            opacity: ((i % 5) + 1) * 0.1
          }}
        />
      ))}
    </div>
  );
}
