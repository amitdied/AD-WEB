"use client";

import { useState, useRef, useEffect } from "react";

export default function SmokeSessionPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  const toggle = () => setIsPlaying((prev) => !prev);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Back button */}
      <a
        href="/"
        className="absolute top-6 left-6 text-sm tracking-widest uppercase hover:text-red-500 transition-colors z-50"
      >
        ← Back
      </a>

      {/* Video + Button */}
      <div className="relative flex flex-col items-center">
        <video
          ref={videoRef}
          src="/smoking-loop.mp4"
          muted
          loop
          playsInline
          className="w-full max-w-[420px] h-auto object-contain"
          style={{ maxHeight: "70vh" }}
        />

        <button
          onClick={toggle}
          className={`mt-10 px-8 py-3 text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 border ${
            isPlaying
              ? "border-orange-500 text-orange-400 hover:bg-orange-500/10"
              : "border-white/40 text-white hover:border-white hover:bg-white/5"
          }`}
        >
          {isPlaying ? "PUT OUT" : "MAKE HIM SMOKE"}
        </button>
      </div>
    </div>
  );
}