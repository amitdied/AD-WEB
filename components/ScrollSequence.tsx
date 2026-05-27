'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CDAnimation } from './CDAnimation';
import { MusicSystem } from './MusicSystem';
import { DancerScene } from './DancerScene';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function ScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    if (containerRef.current) {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        }
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-black">
      
      {/* Sticky Canvas Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden pointer-events-none">
        
        {/* HTML Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-white mix-blend-difference">
          <div 
            className="flex flex-col items-center justify-center transition-opacity duration-500"
            style={{ opacity: scrollProgress < 0.3 ? 1 - (scrollProgress * 3) : 0 }}
          >
            <h2 className="font-display text-8xl font-black tracking-tighter uppercase blur-[0.5px]">
              The Archive
            </h2>
            <p className="font-mono text-xs tracking-[0.5em] mt-4 text-red-500 animate-pulse">
              INSERT DISC TO CONTINUE
            </p>
          </div>

          <div 
            className="absolute flex flex-col items-center justify-center transition-opacity duration-500"
            style={{ 
              opacity: scrollProgress > 0.4 && scrollProgress < 0.7 ? 1 : 0,
              transform: `translateY(${(0.5 - scrollProgress) * 200}px)` 
            }}
          >
            <h2 className="font-display text-7xl font-black tracking-tighter text-transparent w-full text-center" style={{ WebkitTextStroke: '2px #fff'}}>
              SYNCHRONIZING
            </h2>
          </div>

          <div 
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500"
            style={{ opacity: scrollProgress > 0.8 ? (scrollProgress - 0.8) * 5 : 0 }}
          >
            <h2 className="font-display text-9xl font-black text-red-600 uppercase tracking-tighter mix-blend-screen opacity-50 blur-sm">
              LIVE
            </h2>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="absolute inset-0 z-0">
          <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
            <color attach="background" args={['#000000']} />
            
            {/* Cinematic Lighting */}
            <ambientLight intensity={0.2} />
            <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={2} castShadow color="#ff0000" />
            <spotLight position={[-5, 10, -5]} angle={0.5} penumbra={1} intensity={1} castShadow color="#0055ff" />
            <pointLight position={[0, -2, 2]} intensity={scrollProgress > 0.3 ? 5 : 0} color="#ff0000" distance={10} />

            <Environment resolution={256}>
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, -5, -9]} scale={[10, 10, 1]} />
              </group>
            </Environment>

            {/* Stage 1: CD inserts into player (progress 0 to 0.4) */}
            {scrollProgress < 0.6 && (
              <group>
                <CDAnimation progress={scrollProgress * 2.5} />
                <MusicSystem progress={scrollProgress * 2.5} />
              </group>
            )}

            {/* Stage 2: Abstract Dancer scene (progress 0.5 to 1.0) */}
            {scrollProgress >= 0.4 && (
              <group>
                <DancerScene progress={(scrollProgress - 0.4) * 1.66} />
              </group>
            )}
            
          </Canvas>
        </div>
        
        {/* Scanlines / CRT Overlay applied globally to this section */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-20" />
      </div>
    </div>
  );
}
