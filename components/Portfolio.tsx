"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Maximize2,
  Minus,
  X,
  Play,
  Folder,
  Terminal,
  Volume2,
} from "lucide-react";

import { YOUTUBE_LINKS } from "@/lib/data";
export { YOUTUBE_LINKS };

interface Project {
  id: string;
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  author: string;
  isCorrupted?: boolean;
}

export function Portfolio() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["100px", "-100px"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState(50);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        let finalLinks = YOUTUBE_LINKS;
        try {
          const res = await fetch("/api/videos");
          if (res.ok) {
            const apiData = await res.json();
            if (Array.isArray(apiData) && apiData.length > 0) {
              finalLinks = apiData;
            }
          }
        } catch (e) {
          console.error("API read failed, using fallback", e);
        }

        const data = await Promise.all(
          finalLinks.map(async (item: any) => {
            const url = typeof item === "string" ? item : item.url;
            const match = url ? url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/) : null;
            const videoId = match ? match[1] : (url?.split("v=")[1]?.split("&")[0] || url);
            const uniqueId =
              typeof item === "object" && item.id ? item.id : videoId;
            try {
              const res = await fetch(`https://noembed.com/embed?url=${url}`);
              if (!res.ok) throw new Error("Network response was not ok");
              const json = await res.json();
              if (json.error) throw new Error(json.error);
              return {
                id: uniqueId,
                videoId,
                url,
                title: json.title || "UNNAMED_ARCHIVE",
                thumbnail:
                  json.thumbnail_url ||
                  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                author: json.author_name || "AMITDIED",
                isCorrupted: false,
              };
            } catch (e) {
              return {
                id: uniqueId,
                videoId,
                url,
                title: typeof item === "object" && item.title ? item.title : "ARCHIVE_VIDEO",
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                author: "AMITDIED",
                isCorrupted: false,
              };
            }
          }),
        );
        setProjects(data);
      } catch (error) {
        console.error("Critical error fetching videos", error);
        setProjects([
          {
            id: "error",
            videoId: "",
            url: "",
            title: "FILE CORRUPTED",
            thumbnail: "",
            author: "SYSTEM_ERROR",
            isCorrupted: true,
          },
        ]);
      }
    };
    fetchVideos();
  }, []);

  const openProject = (id: string) => {
    if (!openWindows.includes(id)) {
      setOpenWindows([...openWindows, id]);
    }
    setZIndexCounter((z) => z + 1);
    setActiveWindow(id);
  };

  const closeProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenWindows(openWindows.filter((w) => w !== id));
    if (activeWindow === id) setActiveWindow(null);
  };

  const focusWindow = (id: string) => {
    setZIndexCounter((z) => z + 1);
    setActiveWindow(id);
  };

  return (
    <section
      id="portfolio"
      ref={ref}
      className="py-32 px-6 bg-zinc-950/90 relative border-b border-zinc-900 overflow-hidden min-h-[120vh]"
    >
      {/* Cinematic Blur Background & CRT Lines */}
      <div className="absolute inset-0 bg-black z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0 pointer-events-none" />
      <div className="absolute -left-[10%] top-[30%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] z-0 pointer-events-none" />
      <div className="absolute right-[0%] top-[10%] w-[30%] h-[30%] bg-red-900/10 blur-[120px] z-0 pointer-events-none" />

      <motion.div
        style={{ y, opacity }}
        className="max-w-7xl mx-auto relative z-10 w-full h-full flex flex-col"
      >
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-6 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500" />

          <div>
            <h2 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2 flex items-center gap-4 text-white">
              <Terminal className="w-10 h-10 text-red-600" /> ARCHIVE_OS
            </h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em] pl-1 border-l-2 border-red-600">
              Secure Visual Vault System
            </p>
          </div>
          <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em] text-right">
            <p className="mb-1 text-red-500 animate-pulse">
              Connection: Secure
            </p>
            <p>Dir: /sys/amitdied/works</p>
          </div>
        </div>

        {/* Desktop Folders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 place-items-start p-8 border border-zinc-800/30 bg-zinc-900/10 backdrop-blur-sm min-h-[60vh] relative overflow-hidden">
          {/* Scanline inside desktop */}
          <div className="absolute inset-x-0 h-1 bg-red-500/10 top-0 animate-[scan_4s_linear_infinite] z-0 mix-blend-screen pointer-events-none" />

          {projects.length === 0 && (
            <div className="col-span-full h-full flex items-center justify-center text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse w-full">
              Fetching Data Blocks...
            </div>
          )}

          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group flex flex-col items-center justify-center gap-3 cursor-pointer z-10 w-full"
              onClick={() => openProject(project.id)}
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-2 transition-transform duration-300 group-hover:scale-105">
                {/* Desktop Icon style */}
                <div className="absolute inset-0 bg-zinc-800 border-2 border-zinc-700 shadow-lg shadow-black/50 z-10 p-1 flex flex-col">
                  <div
                    className={`flex-1 relative overflow-hidden bg-black ${project.isCorrupted ? "animate-pulse" : ""}`}
                  >
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className={`object-cover w-full h-full transition-all duration-300 ${project.isCorrupted ? "grayscale opacity-40 mix-blend-difference" : "grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100"}`}
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className={`absolute inset-0 transition-colors ${project.isCorrupted ? "bg-red-900/40 mix-blend-overlay" : "bg-red-900/20 mix-blend-color-burn group-hover:bg-transparent"}`}
                    />

                    {project.isCorrupted && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-1">
                        <span className="text-red-500 font-mono text-[10px] leading-none text-center bg-black/60 px-1 border border-red-500/50 uppercase tracing-tighter scale-75 group-hover:scale-100 transition-transform">
                          CORRUPT
                          <br />
                          DATA
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-6 bg-zinc-300 text-black flex items-center justify-between px-2 w-full shrink-0">
                    <Volume2 className="w-3 h-3" />
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 px-2 py-1 text-center max-w-[140px] truncate">
                <span className="font-mono text-[10px] text-zinc-300 uppercase tracking-wider group-hover:text-red-400 group-hover:bg-red-900/30 transition-all text-center">
                  {project.title}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating Media Players (Windows) */}
      <AnimatePresence>
        {openWindows.map((id) => {
          const project = projects.find((p) => p.id === id);
          if (!project) return null;
          const isActive = activeWindow === id;

          return (
            <motion.div
              key={id}
              drag
              dragMomentum={false}
              onMouseDown={() => focusWindow(id)}
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 50,
                x: ((id.charCodeAt(0) * 13) % 50) - 25,
              }}
              animate={{
                opacity: 1,
                scale: isActive ? 1.02 : 1,
                zIndex: isActive ? zIndexCounter : 10,
              }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
              className="fixed top-1/4 left-[5%] sm:left-1/4 w-[90vw] sm:w-[600px] bg-zinc-900 border-2 border-zinc-700 shadow-2xl flex flex-col overflow-hidden"
              style={{
                boxShadow: isActive
                  ? "0 30px 60px rgba(0,0,0,0.8), 0 0 20px rgba(220,38,38,0.2)"
                  : "0 20px 40px rgba(0,0,0,0.8)",
                filter: isActive ? "none" : "brightness(0.7) blur(1px)",
              }}
            >
              {/* Old Windows Title Bar */}
              <div
                className={`h-10 px-3 flex items-center justify-between border-b-2 border-zinc-700 cursor-grab active:cursor-grabbing ${isActive ? "bg-gradient-to-r from-red-900 to-zinc-900" : "bg-zinc-800"}`}
              >
                <div className="flex items-center gap-2 overflow-hidden pr-4">
                  <Play
                    className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-500"}`}
                  />
                  <span
                    className={`font-mono text-xs uppercase tracking-widest truncate ${isActive ? "text-white font-bold" : "text-zinc-400"}`}
                  >
                    {project.title} - Media Player
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="w-6 h-6 bg-zinc-300 border border-zinc-400 hover:bg-zinc-200 flex items-center justify-center text-black">
                    <Minus className="w-3 h-3" />
                  </button>
                  <button className="w-6 h-6 bg-zinc-300 border border-zinc-400 hover:bg-zinc-200 flex items-center justify-center text-black">
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    className="w-6 h-6 bg-red-600 border border-red-500 hover:bg-red-500 flex items-center justify-center text-white"
                    onClick={(e) => closeProject(id, e)}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="h-8 bg-zinc-300 border-b border-zinc-400 flex items-center px-4 text-[10px] text-black font-mono gap-4 tracking-widest uppercase">
                <span className="hover:bg-zinc-400 px-2 cursor-pointer">
                  File
                </span>
                <span className="hover:bg-zinc-400 px-2 cursor-pointer">
                  View
                </span>
                <span className="hover:bg-zinc-400 px-2 cursor-pointer">
                  Play
                </span>
              </div>

              {/* Video Container */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center group/video overflow-hidden">
                {/* Decorative Equalizer Overlay on Hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/video:opacity-20 transition-opacity z-10 flex items-end gap-1 p-4 pb-12 mix-blend-screen">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-red-500 rounded-t-sm"
                      animate={{
                        height: isActive
                          ? ["10%", "100%", "20%", "80%", "30%"]
                          : "10%",
                      }}
                      transition={{
                        duration: 0.5 + (i % 5) * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube-nocookie.com/embed/${project.videoId || project.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={project.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="relative z-20"
                ></iframe>
              </div>

              {/* Status Bar */}
              <div className="h-6 bg-zinc-300 flex items-center justify-between px-4 text-[9px] text-zinc-700 font-mono uppercase tracking-widest border-t border-zinc-400">
                <span>Status: Playing</span>
                <span>{project.author}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
