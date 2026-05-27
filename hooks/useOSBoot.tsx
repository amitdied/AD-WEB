'use client';
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

type OSBootContextType = {
  isBooted: boolean;
  completeBoot: () => void;
  playSystemSound: (type: 'impact' | 'glitch' | 'hover') => void;
};

const OSBootContext = createContext<OSBootContextType>({
  isBooted: false,
  completeBoot: () => {},
  playSystemSound: () => {},
});

export function OSBootProvider({ children }: { children: React.ReactNode }) {
  const [isBooted, setIsBooted] = useState(false);

  const completeBoot = useCallback(() => {
    setIsBooted(true);
    window.scrollTo(0, 0);
  }, []);

  const playSystemSound = useCallback((type: 'impact' | 'glitch' | 'hover') => {
    try {
      if (typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        if (type === 'impact') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(100, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 1.5);
          gain.gain.setValueAtTime(1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.5);
        } else if (type === 'glitch') {
          const bufferSize = ctx.sampleRate * 0.1; 
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
             data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          noise.connect(gain);
          gain.connect(ctx.destination);
          noise.start();
        } else if (type === 'hover') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      }
    } catch (e) {
      console.log('Audio disabled explicitly or context failed');
    }
  }, []);

  useEffect(() => {
    if (!isBooted) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isBooted]);

  return (
    <OSBootContext.Provider value={{ isBooted, completeBoot, playSystemSound }}>
      {children}
    </OSBootContext.Provider>
  );
}

export function useOSBoot() {
  return useContext(OSBootContext);
}
