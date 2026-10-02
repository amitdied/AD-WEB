"use client";

import { useEffect, useRef } from "react";

/**
 * Audio-Reactive Visual System for AMITDIED
 *
 * Connects the browser Web Audio API AnalyserNode to the existing audio element.
 * Analyzes real-time audio and derives four smoothed values:
 * 1. Low / Bass Energy
 * 2. Mid Energy
 * 3. High Frequency Energy
 * 4. Overall Audio Energy
 * Plus Kick / Transient peak detection.
 *
 * Uses requestAnimationFrame to set CSS custom properties on document.documentElement
 * without causing any React component re-renders.
 *
 * Respects `prefers-reduced-motion: reduce`.
 */
export function useAudioReactiveSystem(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isPlaying: boolean
) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Smoothed energy metrics
  const smoothedRef = useRef({
    bass: 0,
    mid: 0,
    high: 0,
    energy: 0,
    kickImpulse: 0,
    lastBass: 0,
    kickCooldown: 0,
  });

  // Track prefers-reduced-motion
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches && typeof document !== "undefined") {
        document.documentElement.style.setProperty("--audio-bass-scale", "1");
        document.documentElement.style.setProperty("--audio-crt-opacity", "0.20");
        document.documentElement.style.setProperty("--audio-glow-opacity", "0.20");
        document.documentElement.style.setProperty("--audio-orb-opacity", "0.30");
        document.documentElement.style.setProperty("--audio-grain-opacity", "0.15");
      }
    };

    mq.addEventListener("change", handleMotionChange);
    return () => {
      mq.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Set initial default CSS custom properties
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--audio-bass-scale", "1");
    root.style.setProperty("--audio-crt-opacity", "0.20");
    root.style.setProperty("--audio-glow-opacity", "0.20");
    root.style.setProperty("--audio-orb-opacity", "0.30");
    root.style.setProperty("--audio-grain-opacity", "0.15");
  }, []);

  // Setup Web Audio graph and requestAnimationFrame loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === "undefined") return;

    // Gracefully initialize Web Audio graph
    const initAudioGraph = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          audioCtxRef.current = new AudioContextClass();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        if (!analyserRef.current && ctx) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;
        }

        // Attach MediaElementSource only once per HTMLAudioElement
        if (!sourceNodeRef.current && (audio as any).__webAudioSource) {
          sourceNodeRef.current = (audio as any).__webAudioSource;
        } else if (!sourceNodeRef.current && analyserRef.current && ctx) {
          try {
            audio.crossOrigin = "anonymous";
          } catch {}

          const source = ctx.createMediaElementSource(audio);
          source.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
          sourceNodeRef.current = source;
          (audio as any).__webAudioSource = source;
        }
      } catch (err) {
        // Fallback gracefully so normal playback is NEVER interrupted
        console.warn("[AudioVisualizer] Web Audio analyzer initialization notice:", err);
      }
    };

    if (isPlaying) {
      initAudioGraph();
    }

    const root = document.documentElement;
    const frequencyData = new Uint8Array(256);

    const updateFrame = () => {
      const analyser = analyserRef.current;
      const metrics = smoothedRef.current;
      const isReduced = reducedMotionRef.current;

      let currentBass = 0;
      let currentMid = 0;
      let currentHigh = 0;
      let currentEnergy = 0;

      if (isPlaying && analyser && audioCtxRef.current?.state === "running") {
        analyser.getByteFrequencyData(frequencyData);

        // 1. LOW / BASS ENERGY (20Hz - 250Hz, bins 0 to 3)
        let bassSum = 0;
        const bassCount = 4;
        for (let i = 0; i < bassCount; i++) {
          bassSum += frequencyData[i];
        }
        currentBass = bassSum / (bassCount * 255);

        // 2. MID ENERGY (250Hz - 2000Hz, bins 4 to 23)
        let midSum = 0;
        const midCount = 20;
        for (let i = 4; i < 24; i++) {
          midSum += frequencyData[i];
        }
        currentMid = midSum / (midCount * 255);

        // 3. HIGH FREQUENCY ENERGY (2000Hz - 16000Hz, bins 24 to 180)
        let highSum = 0;
        const highCount = 156;
        for (let i = 24; i < 180; i++) {
          highSum += frequencyData[i];
        }
        currentHigh = highSum / (highCount * 255);

        // 4. OVERALL AUDIO ENERGY (average across audible spectrum)
        let totalSum = 0;
        for (let i = 0; i < 180; i++) {
          totalSum += frequencyData[i];
        }
        currentEnergy = totalSum / (180 * 255);

        // Kick / Transient peak detection
        const bassDelta = currentBass - metrics.lastBass;
        if (bassDelta > 0.16 && metrics.kickCooldown <= 0) {
          metrics.kickImpulse = 1.0;
          metrics.kickCooldown = 7; // ~110ms cooldown
        } else if (metrics.kickCooldown > 0) {
          metrics.kickCooldown--;
        }
        metrics.lastBass = currentBass;
      } else {
        // Smoothly decay to baseline when paused or stopped
        currentBass = 0;
        currentMid = 0;
        currentHigh = 0;
        currentEnergy = 0;
      }

      // Decay transient impulse
      metrics.kickImpulse *= 0.82;
      if (metrics.kickImpulse < 0.01) metrics.kickImpulse = 0;

      // Exponential moving average smoothing for cinematic, non-jittery feel
      const smoothFactor = isPlaying ? 0.14 : 0.08;
      metrics.bass += (currentBass - metrics.bass) * smoothFactor;
      metrics.mid += (currentMid - metrics.mid) * smoothFactor;
      metrics.high += (currentHigh - metrics.high) * smoothFactor;
      metrics.energy += (currentEnergy - metrics.energy) * smoothFactor;

      if (isReduced) {
        // Reduced motion: strictly disable scale movement and keep static values
        root.style.setProperty("--audio-bass-scale", "1");
        root.style.setProperty("--audio-crt-opacity", "0.20");
        root.style.setProperty("--audio-glow-opacity", "0.20");
        root.style.setProperty("--audio-orb-opacity", "0.30");
        root.style.setProperty("--audio-grain-opacity", "0.15");
      } else {
        // BASS: extremely subtle scale (1.000 -> 1.025 max)
        const scaleVal = 1 + metrics.bass * 0.025;
        root.style.setProperty("--audio-bass-scale", scaleVal.toFixed(4));

        // KICK / CRT TRANSIENT & HIGHS: 0.20 base -> max 0.28
        const crtVal = 0.20 + metrics.high * 0.04 + metrics.kickImpulse * 0.04;
        root.style.setProperty("--audio-crt-opacity", crtVal.toFixed(3));

        // OVERALL GLOW: 0.20 base -> max 0.28
        const glowVal = 0.20 + metrics.energy * 0.08;
        root.style.setProperty("--audio-glow-opacity", glowVal.toFixed(3));

        // AMBIENT ORBS: 0.30 base -> max 0.40
        const orbVal = 0.30 + (metrics.mid * 0.06 + metrics.energy * 0.04);
        root.style.setProperty("--audio-orb-opacity", orbVal.toFixed(3));

        // HIGH FREQUENCY GRAIN / NOISE: 0.15 base -> max 0.21
        const grainVal = 0.15 + metrics.high * 0.06;
        root.style.setProperty("--audio-grain-opacity", grainVal.toFixed(3));
      }

      rafIdRef.current = requestAnimationFrame(updateFrame);
    };

    rafIdRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [audioRef, isPlaying]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch {}
        audioCtxRef.current = null;
      }
    };
  }, []);
}
