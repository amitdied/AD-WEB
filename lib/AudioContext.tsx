"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { useAudioReactiveSystem } from "./audio-visualizer";

type Track = {
  id: string;
  title: string;
  bpm: number;
  coverUrl: string;
  price: number;
  audioUrl?: string;
};

type AudioContextType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  seek: (progress: number) => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fixingDurationRef = useRef(false);

  // Audio-reactive visual system connected to the existing audio element
  useAudioReactiveSystem(audioRef, isPlaying);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    let isMounted = true;

    const handleTimeUpdate = () => {
      if (!isMounted || !audioRef.current) return;
      const currTime = audio.currentTime;
      const dur = audio.duration;

      if (Number.isNaN(currTime)) return;

      if (Number.isNaN(dur) || dur <= 0 || !Number.isFinite(dur)) {
        if (!fixingDurationRef.current && audio.readyState > 0) {
          fixingDurationRef.current = true;
          const resumeTime = currTime;

          const handleFixedDuration = () => {
            audio.removeEventListener("durationchange", handleFixedDuration);
            audio.currentTime = resumeTime;
            fixingDurationRef.current = false;
          };

          audio.addEventListener("durationchange", handleFixedDuration);
          audio.currentTime = Number.MAX_SAFE_INTEGER;
        }
        return;
      }

      const calcProgress = (currTime / dur) * 100;
      setProgress(Math.max(0, Math.min(100, calcProgress)));
    };

    const handleLoadedMetadata = () => {
      if (!isMounted || !audioRef.current) return;
      handleTimeUpdate();
    };

    const handleDurationChange = () => {
      if (!isMounted || !audioRef.current) return;
      handleTimeUpdate();
    };

    const handleEnded = () => {
      if (!isMounted) return;
      setIsPlaying(false);
      setProgress(100);
    };

    const handlePlay = () => {
      if (!isMounted) return;
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (!isMounted) return;
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      isMounted = false;
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.src && audio.paused) {
        audio.play().catch((e) => {
          console.error("Audio playback failed", e);
          setIsPlaying(false);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const playTrack = (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    setCurrentTrack(track);
    setProgress(0);
    audio.currentTime = 0;

    if (track.audioUrl) {
      audio.src = track.audioUrl;
      audio.load();
      setIsPlaying(true);
      audio.play().catch((e) => {
        console.error("Playback prevented", e);
        setIsPlaying(false);
      });
    } else {
      audio.removeAttribute("src");
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTrack && !currentTrack.audioUrl) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack]);

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (newProgress: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    setProgress(clampedProgress);

    if (currentTrack?.audioUrl && audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (clampedProgress / 100) * audio.duration;
    }
  };

  return (
    <AudioContext.Provider
      value={{ currentTrack, isPlaying, progress, playTrack, togglePlay, seek }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
