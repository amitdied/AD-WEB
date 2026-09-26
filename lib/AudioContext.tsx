"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

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

  useEffect(() => {
    // Client-side initialization of audio element
    audioRef.current = new Audio();

    const audio = audioRef.current;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
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
      audio.pause();
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

    if (track.audioUrl) {
      audio.src = track.audioUrl;
      audio.load();
      setIsPlaying(true);
      audio.play().catch((e) => {
        console.error("Playback prevented", e);
        setIsPlaying(false);
      });
    } else {
      // Mock progress fallback if no audio URL is provided
      audio.removeAttribute("src");
      setIsPlaying(true);
    }
  };

  // Mock progress simulation for tracks without audio URL
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTrack && !currentTrack.audioUrl) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 0.1;
        });
      }, 100);
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

    setProgress(newProgress);

    if (currentTrack?.audioUrl && audio.duration) {
      audio.currentTime = (newProgress / 100) * audio.duration;
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
