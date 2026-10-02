"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Instagram,
  Radio,
  ExternalLink,
  Wifi,
  ArrowUpRight,
  Terminal,
} from "lucide-react";

export interface AmitdiedInstagramPost {
  id: string;
  url: string;
  label: string;
  location: string;
  captionTitle: string;
  snippet: string;
  status: string;
  date: string;
  type?: "instagram" | "video";
}

// Fallback posts if API is empty
export const AMITDIED_INSTAGRAM_POSTS: AmitdiedInstagramPost[] = [
  {
    id: "reel-tu-harak",
    url: "https://www.instagram.com/amitdied/reel/DcHBlPJTFBB/",
    label: "CAM_01",
    location: "STUDIO_UNDERGROUND",
    captionTitle: "TU HARAK",
    snippet: "New transmission from @amitdied.",
    status: "ONLINE",
    date: "LATEST",
    type: "instagram",
  },
  {
    id: "post-1",
    url: "https://www.instagram.com/p/DF7n4yqT3lE/",
    label: "CAM_02",
    location: "STUDIO_UNDERGROUND",
    captionTitle: "AMITDIED // LATE_NIGHT_SESSION",
    snippet: "Analog pedals and 808 saturation test straight from the rack console.",
    status: "ONLINE",
    date: "ARCHIVE",
    type: "instagram",
  },
  {
    id: "post-2",
    url: "https://www.instagram.com/p/DFzL12oSo7G/",
    label: "CAM_03",
    location: "MASTERING_LAB",
    captionTitle: "OFFICIAL_PLACEMENT_RELEASE",
    snippet: "New production landed worldwide.",
    status: "TRANSMITTING",
    date: "RECENT",
    type: "instagram",
  },
];

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

function CCTVMonitor({
  post,
  index,
}: {
  post: AmitdiedInstagramPost;
  index: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "140px 0px" });
  const [isHovered, setIsHovered] = useState(false);
  const [timeGlitch, setTimeGlitch] = useState("12:48:32.4");

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      const ms = Math.floor(d.getMilliseconds() / 100);
      setTimeGlitch(`${h}:${m}:${s}.${ms}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isInView || post.type === "video") return;
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && window.instgrm?.Embeds) {
          window.instgrm.Embeds.process();
        }
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [isInView, post.type]);

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 30 }}
        transition={{
          duration: 0.65,
          delay: (index % 3) * 0.12,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`group relative flex flex-col bg-zinc-950 border transition-all duration-300 overflow-hidden ${
          isHovered
            ? "border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.45)] ring-1 ring-red-500/50"
            : "border-zinc-800/90 hover:border-zinc-700 shadow-[0_0_25px_rgba(0,0,0,0.85)]"
        }`}
      >
        {/* Header */}
        <div className="bg-zinc-900/95 border-b border-zinc-800/90 px-3.5 py-2.5 flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-wider z-20">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            <span className="font-black text-white tracking-widest">{post.label}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-red-500 font-bold tracking-widest">● REC</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px]">
            <span className="text-zinc-500 hidden sm:inline">{post.location}</span>
            <span className="bg-zinc-950 px-1.5 py-0.5 border border-zinc-800 text-zinc-300 font-mono">
              {timeGlitch}
            </span>
          </div>
        </div>

        {/* Screen */}
        <div className="relative w-full min-h-[380px] sm:min-h-[420px] bg-black overflow-hidden flex flex-col items-center justify-center">
          <div
            className={`pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] ${
              isHovered ? "opacity-40" : "opacity-25"
            }`}
          />
          <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]" />
          <div className="pointer-events-none absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-red-500/80 z-20" />
          <div className="pointer-events-none absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-red-500/80 z-20" />
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-red-500/80 z-20" />
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-red-500/80 z-20" />

          <div className="absolute top-2.5 left-8 z-20 flex items-center gap-1.5 pointer-events-none">
            <span className="bg-black/85 backdrop-blur-md px-2 py-0.5 border border-zinc-800 text-[9px] font-mono text-zinc-300">
              AMITDIED_NETWORK
            </span>
            <span className="bg-red-950/90 text-red-400 border border-red-800/80 text-[8px] font-mono uppercase px-1.5 py-0.5">
              {post.status}
            </span>
          </div>

          <div className="absolute bottom-2.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
            <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 border border-zinc-800 text-[9px] font-mono text-zinc-400 flex items-center gap-1.5">
              <Wifi className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
              <span>SIGNAL 99.2%</span>
            </div>
            <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 border border-zinc-800 text-[9px] font-mono text-red-400 font-bold">
              {post.date}
            </div>
          </div>

          {isInView ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 relative z-0">
              {post.type === "video" ? (
                <video
                  src={post.url}
                  controls
                  playsInline
                  className="w-full h-full max-h-[420px] object-contain bg-black"
                />
              ) : (
                <blockquote
                  className="instagram-media w-full"
                  data-instgrm-permalink={post.url}
                  data-instgrm-version="14"
                  style={{
                    background: "#000",
                    border: "1px solid #27272a",
                    borderRadius: "0px",
                    boxShadow: "none",
                    margin: "0 auto",
                    maxWidth: "540px",
                    minWidth: "280px",
                    padding: "0",
                    width: "100%",
                  }}
                >
                  <div className="p-6 text-center font-mono flex flex-col items-center justify-center space-y-4 my-auto">
                    <div className="w-12 h-12 rounded-full border border-red-600/60 bg-red-950/30 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                      <Instagram className="w-6 h-6 text-pink-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-white text-xs font-bold uppercase tracking-wider">
                        {post.captionTitle}
                      </div>
                      <div className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                        {post.snippet}
                      </div>
                    </div>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2.5 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                    >
                      <span>VIEW ON INSTAGRAM</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </blockquote>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-600 font-mono text-[10px] space-y-2">
              <span className="w-3 h-3 rounded-full bg-zinc-800 animate-ping" />
              <span>SYNCING {post.label}...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-zinc-950 font-mono flex flex-col justify-between border-t border-zinc-800/80">
          <div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5 uppercase tracking-wider">
              <span className="text-red-500 font-bold flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                <span>@amitdied</span>
              </span>
              <span className="text-zinc-600">{post.location}</span>
            </div>
            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3">
              {post.snippet}
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between font-mono text-[11px]">
            <a
              href="https://www.instagram.com/amitdied/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 text-[10px] uppercase tracking-wider flex items-center gap-1"
            >
              <Instagram className="w-3 h-3 text-pink-500" />
              <span>AMITDIED PROFILE</span>
            </a>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:text-white transition-colors flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest"
            >
              <span>VIEW TRANSMISSION</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function InstagramTeaser() {
  const [posts, setPosts] = useState<AmitdiedInstagramPost[]>(AMITDIED_INSTAGRAM_POSTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    const existingScript = document.getElementById("instagram-embed-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "instagram-embed-script";
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.instgrm?.Embeds?.process();
      };
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/instagram", { cache: "no-store" });
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        if (!active || !Array.isArray(data) || data.length === 0) {
          setLoading(false);
          return;
        }

        const mapped: AmitdiedInstagramPost[] = data
  .filter((item: any) => item && item.visible !== false)
  .map((item: any, i: number) => {
    const url = String(
      item.url || item.postUrl || item.youtubeUrl || item.imageUrl || ""
    );

    const reallyVideo =
      item.type === "video" ||
      /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ||
      (url.length > 0 && !url.includes("instagram.com"));

    const mappedPost: AmitdiedInstagramPost = {
      id: String(item.id || `feed-${i}`),
      url,
      label: String(
        item.label || item.camCode || `CAM_${String(i + 1).padStart(2, "0")}`
      ),
      location: String(item.location || "STUDIO_UNDERGROUND"),
      captionTitle: String(
        item.title || item.captionTitle || item.videoSnippetTitle || "TRANSMISSION"
      ),
      snippet: String(item.snippet || item.caption || ""),
      status: String(item.status || "ONLINE"),
      date: String(item.date || "LIVE"),
      type: reallyVideo ? "video" : "instagram",
    };
    return mappedPost;
  })
  .filter((p) => !!p.url);

        if (mapped.length > 0) setPosts(mapped);
      } catch (err) {
        console.warn("CCTV live load failed, using fallback:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try {
        window.instgrm?.Embeds?.process();
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [posts, loading]);

  return (
    <section
      id="cctv-feed"
      className="relative py-24 sm:py-32 bg-black border-t border-zinc-900 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-800/90 pb-8">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
              </span>
              <span className="text-red-500 font-bold">LIVE FROM THE UNDERGROUND</span>
              <span className="text-zinc-700">|</span>
              <span className="hidden sm:inline">AMITDIED SURVEILLANCE NETWORK</span>
            </div>
            <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tighter uppercase leading-none">
              CCTV FEED <span className="text-red-600">{"//"} NET</span>
            </h2>
            <p className="font-mono text-xs sm:text-sm text-zinc-400 mt-3 max-w-2xl leading-relaxed">
              YOU ARE BEING WATCHED BY THE AMITDIED NETWORK. Live surveillance feeds from{" "}
              <a
                href="https://www.instagram.com/amitdied/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:text-white underline underline-offset-4 font-bold"
              >
                @amitdied
              </a>
              .
            </p>
          </div>
          <a
            href="https://www.instagram.com/amitdied/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-950/80 via-zinc-900 to-purple-950/60 border border-red-800/80 hover:border-red-500 text-white px-4 py-2.5 text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(220,38,38,0.25)] self-start"
          >
            <Instagram className="w-4 h-4 text-pink-500" />
            <span>@amitdied</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-zinc-500 animate-pulse">
            SYNCING CCTV NETWORK...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {posts.map((post, idx) => (
              <CCTVMonitor key={post.id || idx} post={post} index={idx} />
            ))}
          </div>
        )}

        <div className="mt-12 p-4 bg-zinc-950 border border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-zinc-400">AMITDIED_ENCRYPTED_STREAM_NODE_ONLINE</span>
          </div>
          <a
            href="https://www.instagram.com/amitdied/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-red-500 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            <span>CONNECT VIA INSTAGRAM</span>
            <ArrowUpRight className="w-3 h-3 text-red-500" />
          </a>
        </div>
      </div>
    </section>
  );
}