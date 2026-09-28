'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Beat, INITIAL_BEATS } from './data';

interface AudioContextType {
  currentBeat: Beat | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  visualizerData: number[];
  playBeat: (beat: Beat) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(INITIAL_BEATS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(INITIAL_BEATS[0].duration || 160);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(10));

  // Audio nodes & timer refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Web Audio Engine
  const initAudio = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        const masterGain = ctx.createGain();
        masterGain.gain.value = isMuted ? 0 : volume;

        masterGain.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        masterGainRef.current = masterGain;
        analyserRef.current = analyser;
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [isMuted, volume]);

  // Trap Beat Synthesizer for instant preview when no external audio host is required
  const playSynthesizedStep = useCallback((step: number, beat: Beat) => {
    const ctx = audioContextRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master || ctx.state !== 'running') return;

    const now = ctx.currentTime;

    // Root notes based on key
    const baseFreqs: Record<string, number> = {
      'C# Minor': 138.59,
      'F Minor': 174.61,
      'G# Minor': 207.65,
      'D Minor': 146.83,
      'A Minor': 220.00,
      'E Minor': 164.81,
      'B Minor': 246.94,
      'F# Minor': 185.00,
    };
    const baseRoot = baseFreqs[beat.key] || 150;

    // 1. Kick / 808 sub bass on steps 0, 6, 8, 12
    if (step === 0 || step === 6 || step === 8 || step === 12) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';

      const pitchMultiplier = step === 6 ? 1.33 : step === 12 ? 0.89 : 1.0;
      kickOsc.frequency.setValueAtTime(baseRoot * 0.5 * pitchMultiplier, now);
      kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

      kickGain.gain.setValueAtTime(0.7, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      kickOsc.connect(kickGain);
      kickGain.connect(master);
      kickOsc.start(now);
      kickOsc.stop(now + 0.45);
    }

    // 2. Snare / Clap on steps 4 and 12
    if (step === 4 || step === 12) {
      // Noise burst
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      const snareGain = ctx.createGain();
      snareGain.gain.setValueAtTime(0.4, now);
      snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(master);
      noise.start(now);
      noise.stop(now + 0.16);
    }

    // 3. Hi-Hat ticking on every step (with velocity accents)
    const hatOsc = ctx.createOscillator();
    const hatGain = ctx.createGain();
    hatOsc.type = 'square';
    hatOsc.frequency.setValueAtTime(8000 + Math.random() * 2000, now);

    const isAccent = step % 4 === 2;
    hatGain.gain.setValueAtTime(isAccent ? 0.15 : 0.06, now);
    hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    hatOsc.connect(hatGain);
    hatGain.connect(master);
    hatOsc.start(now);
    hatOsc.stop(now + 0.05);

    // 4. Melodic Bell / Synth chord note
    const scale = [1, 1.189, 1.334, 1.498, 1.781, 2.0];
    const noteInterval = scale[step % scale.length];
    const synthOsc = ctx.createOscillator();
    const synthGain = ctx.createGain();

    synthOsc.type = beat.genre === 'Rage' ? 'sawtooth' : 'triangle';
    synthOsc.frequency.setValueAtTime(baseRoot * 2 * noteInterval, now);

    synthGain.gain.setValueAtTime(0.12, now);
    synthGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    synthOsc.connect(synthGain);
    synthGain.connect(master);
    synthOsc.start(now);
    synthOsc.stop(now + 0.3);
  }, []);

  // Handle Play/Stop loop
  useEffect(() => {
    if (!isPlaying || !currentBeat) {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    initAudio();

    // 16th note interval based on BPM
    // (60 / BPM) / 4 * 1000 ms
    const sixteenthMs = (60 / currentBeat.bpm / 4) * 1000;
    let currentStep = 0;

    synthTimerRef.current = setInterval(() => {
      playSynthesizedStep(currentStep % 16, currentBeat);
      currentStep++;
    }, sixteenthMs);

    progressTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= (currentBeat.duration || 160)) {
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    // Visualizer loop
    const updateVisualizer = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const normalized = Array.from(dataArray.slice(0, 32)).map((v) => Math.max(12, (v / 255) * 100));
        setVisualizerData(normalized);
      } else {
        // Fallback visualizer oscillation
        const simulated = Array.from({ length: 32 }, (_, i) => {
          return 15 + Math.abs(Math.sin((Date.now() / 200) + i * 0.4)) * 75;
        });
        setVisualizerData(simulated);
      }
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    animationFrameRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentBeat, initAudio, playSynthesizedStep]);

  // Volume & Mute listener
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  const playBeat = useCallback((beat: Beat) => {
    initAudio();
    if (currentBeat?.id === beat.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentBeat(beat);
      setDuration(beat.duration || 160);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [currentBeat, initAudio]);

  const togglePlay = useCallback(() => {
    initAudio();
    setIsPlaying((prev) => !prev);
  }, [initAudio]);

  const pause = useCallback(() => setIsPlaying(false), []);
  const resume = useCallback(() => {
    initAudio();
    setIsPlaying(true);
  }, [initAudio]);

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const nextTrack = useCallback(() => {
    if (!currentBeat) return;
    const currentIndex = INITIAL_BEATS.findIndex((b) => b.id === currentBeat.id);
    const nextIndex = (currentIndex + 1) % INITIAL_BEATS.length;
    setCurrentBeat(INITIAL_BEATS[nextIndex]);
    setCurrentTime(0);
    setDuration(INITIAL_BEATS[nextIndex].duration || 160);
    setIsPlaying(true);
  }, [currentBeat]);

  const prevTrack = useCallback(() => {
    if (!currentBeat) return;
    const currentIndex = INITIAL_BEATS.findIndex((b) => b.id === currentBeat.id);
    const prevIndex = (currentIndex - 1 + INITIAL_BEATS.length) % INITIAL_BEATS.length;
    setCurrentBeat(INITIAL_BEATS[prevIndex]);
    setCurrentTime(0);
    setDuration(INITIAL_BEATS[prevIndex].duration || 160);
    setIsPlaying(true);
  }, [currentBeat]);

  return (
    <AudioContext.Provider
      value={{
        currentBeat,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        visualizerData,
        playBeat,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        nextTrack,
        prevTrack,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
