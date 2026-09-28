'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Radio, Eye, Video, ShieldAlert, Disc3, Volume2, Sparkles, Maximize2 } from 'lucide-react';
import { useAudio } from '@/lib/AudioContext';

const CAMERAS = [
  {
    id: 'cam-1',
    name: 'CAM 01: MAIN CONSOLE',
    location: 'SSL 4000 & SYNTH LAB',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80',
    fps: '24.0',
    status: 'OPTIMAL',
  },
  {
    id: 'cam-2',
    name: 'CAM 02: VOCAL BOOTH',
    location: 'NEUMANN U87 & TUBE PRE',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    fps: '24.0',
    status: 'ACTIVE',
  },
  {
    id: 'cam-3',
    name: 'CAM 03: MASTERING TAPE',
    location: 'STUDER A80 2-INCH REEL',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    fps: '29.97',
    status: 'STANDBY',
  },
  {
    id: 'cam-4',
    name: 'CAM 04: SOUND ARCHIVE',
    location: 'VINYL & HARDWARE VAULT',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
    fps: '24.0',
    status: 'RECORDING',
  },
];

export function CctvFeed() {
  const { isPlaying, currentBeat, visualizerData } = useAudio();
  const [selectedCam, setSelectedCam] = useState(CAMERAS[0]);
  const [nightVision, setNightVision] = useState(false);
  const [timecode, setTimecode] = useState('');
  const [glitchActive, setGlitchActive] = useState(false);

  // Timecode clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      setTimecode(`${dateStr} ${timeStr}.${ms}`);
    };

    const interval = setInterval(updateTime, 45);
    return () => clearInterval(interval);
  }, []);

  // Occasional CRT glitch trigger
  const triggerGlitch = () => {
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 300);
  };

  return (
    <section className="py-16 border-y border-zinc-900 bg-zinc-950/60 relative overflow-hidden">
      {/* Background ambient red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-950/20 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-red-500 tracking-widest font-bold mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block"></span>
              <span>LIVE CLOSED-CIRCUIT SURVEILLANCE</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
              STUDIO ARCHIVE // CCTV
            </h2>
            <p className="text-zinc-400 text-sm font-mono mt-1">
              Direct live feed into AMITDIED recording suites, analog gear racks, and sound lab sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Night Vision Toggle */}
            <button
              onClick={() => setNightVision(!nightVision)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
                nightVision
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>IR NIGHT VISION: {nightVision ? 'ON' : 'OFF'}</span>
            </button>

            {/* Manual Glitch / Refresh */}
            <button
              onClick={triggerGlitch}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-all"
            >
              SYNC FEED
            </button>
          </div>
        </div>

        {/* CCTV Monitor Shell */}
        <div className="relative rounded-2xl bg-black border-2 border-zinc-800 shadow-2xl overflow-hidden">
          
          {/* Top Surveillance HUD Bar */}
          <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                <span className="text-white font-bold tracking-widest uppercase">REC [●]</span>
              </div>
              <span className="text-zinc-500">|</span>
              <span className="text-red-400 font-bold">{selectedCam.name}</span>
              <span className="hidden sm:inline text-zinc-500">({selectedCam.location})</span>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">FPS:</span>
                <span className="text-white font-bold">{selectedCam.fps}</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-zinc-500">SYS:</span>
                <span className="text-emerald-400 font-bold">{selectedCam.status}</span>
              </div>
              <div className="text-zinc-200 font-bold font-mono">
                {timecode || '2026-09-28 08:24:19.412 UTC'}
              </div>
            </div>
          </div>

          {/* Video Feed Screen Viewport */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-zinc-950">
            {/* Background Camera Image Feed */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedCam.image}
              alt={selectedCam.name}
              className={`w-full h-full object-cover transition-all duration-700 ${
                nightVision 
                  ? 'filter grayscale contrast-150 brightness-90 sepia hue-rotate-[90deg] saturate-[300%]' 
                  : 'filter contrast-125 brightness-95'
              } ${glitchActive ? 'translate-x-2 skew-x-3 opacity-80' : ''}`}
            />

            {/* CRT Scanline & Grain Grid */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-40 mix-blend-overlay"></div>
            
            {/* Vignette Shadow */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.85)]" />

            {/* Camera Viewfinder Crosshairs and Markings */}
            <div className="absolute inset-6 pointer-events-none border border-zinc-600/30">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-red-500" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-red-500" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-500" />

              {/* Center Target Reticle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-40">
                <div className="w-12 h-0.5 bg-red-500/60" />
                <div className="h-12 w-0.5 bg-red-500/60 -ml-6" />
                <div className="w-4 h-4 rounded-full border border-red-500/80 -ml-2" />
              </div>

              {/* Watermark Details */}
              <div className="absolute top-3 left-3 text-[10px] font-mono text-white/80 drop-shadow-md space-y-0.5">
                <div>AMITDIED HQ // BERLIN SEC_ZONE_09</div>
                <div className="text-zinc-400">CH_0{selectedCam.id.split('-')[1]} • 1080p RAW</div>
              </div>

              {/* Live Audio Reactive Detection Pill on Viewport */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded bg-black/70 backdrop-blur-md border border-zinc-800 text-[10px] font-mono">
                <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
                <span className="text-zinc-300">
                  {isPlaying ? (
                    <>AUDIO TRIGGER: <strong className="text-white">{currentBeat?.title}</strong> ({currentBeat?.bpm} BPM)</>
                  ) : (
                    <>AUDIO SENSOR: LISTENING FOR STUDIO SIGNAL</>
                  )}
                </span>
                
                {/* Audio meter mini bar */}
                <div className="flex items-center gap-0.5 h-3 ml-2">
                  {visualizerData.slice(0, 8).map((val, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-red-500 rounded-sm transition-all"
                      style={{
                        height: isPlaying ? `${Math.max(3, (val / 100) * 12)}px` : '2px',
                        opacity: isPlaying ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Security Telemetry */}
              <div className="absolute bottom-3 right-3 text-right text-[10px] font-mono text-zinc-400/90 drop-shadow-md hidden sm:block">
                <div>LATENCY: 14ms // SSL ENCRYPTED</div>
                <div>MOTION: PASSIVE MONITORING</div>
              </div>
            </div>

          </div>

          {/* Bottom Camera Selector Bar */}
          <div className="bg-zinc-950 p-3 border-t border-zinc-800 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-1">
                SWITCH CHANNEL:
              </span>
              {CAMERAS.map((cam) => {
                const isActive = selectedCam.id === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => {
                      triggerGlitch();
                      setSelectedCam(cam);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                      isActive
                        ? 'bg-red-600 text-white font-bold shadow-md shadow-red-900/40'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <Camera className="w-3 h-3" />
                    <span>{cam.name.split(':')[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-zinc-500 hidden lg:block pr-2">
              [ 24/7 UNRESTRICTED PRODUCER SURVEILLANCE ARCHIVE ]
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
