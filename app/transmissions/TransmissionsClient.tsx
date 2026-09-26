'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Instagram,
  Radio,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Volume2,
  Layers,
  Sparkles,
  Sliders,
  Send,
  Copy,
  Check,
  Compass,
  Monitor,
  Flame,
  Film,
  Camera,
  RotateCw,
} from 'lucide-react';
import { InstagramTransmission, AMITDIED_IG_PROFILE } from '@/lib/data';

export function TransmissionsClient({ initialData }: { initialData: InstagramTransmission[] }) {
  const [transmissions, setTransmissions] = useState<InstagramTransmission[]>(initialData);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'surveillance' | 'carousel'>('carousel');
  const [inspectModal, setInspectModal] = useState<InstagramTransmission | null>(null);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [soundEffectActive, setSoundEffectActive] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Fetch updated records from API
  useEffect(() => {
    fetch('/api/instagram')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTransmissions(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load transmissions from API, using defaults', err);
      });
  }, []);

  const filtered = transmissions.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  const currentItem = filtered[activeIndex] || filtered[0] || transmissions[0];

  // Auto rotate carousel if enabled
  useEffect(() => {
    if (!autoRotate || filtered.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [autoRotate, filtered.length]);

  const handlePrev = () => {
    triggerGlitch();
    setActiveIndex((prev) => (prev === 0 ? filtered.length - 1 : prev - 1));
  };

  const handleNext = () => {
    triggerGlitch();
    setActiveIndex((prev) => (prev + 1) % filtered.length);
  };

  const triggerGlitch = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 220);
  };

  const handleCopyDM = async (tx: InstagramTransmission) => {
    const text = `Yo Amit, saw your transmission "${tx.videoSnippetTitle || tx.camCode}" on Instagram. Let's work on something together.`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      window.open('https://ig.me/m/amitdied', '_blank', 'noopener,noreferrer');
    } catch {
      window.open(tx.postUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative selection:bg-red-900/60 selection:text-red-200">
      {/* CCTV CRT Scanlines & Screen Vignette Overlay */}
      <div className="fixed inset-0 pointer-events-none z-30 opacity-35 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px]" />
      <div className="fixed inset-0 pointer-events-none z-30 shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]" />

      {/* Top HUD Banner */}
      <div className="relative z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-display font-black text-lg tracking-[0.2em] text-white hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <span>AMIT</span>
            <span className="text-red-600">DIED</span>
          </Link>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/60 px-2.5 py-1 text-[11px] font-mono tracking-widest text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
            <span>CCTV_SURVEILLANCE_INTERCEPT</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <a
            href="https://www.instagram.com/amitdied/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-900/40 via-red-950/50 to-pink-900/30 border border-zinc-700 hover:border-red-500 px-3 py-1.5 transition-all text-zinc-300 hover:text-white"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-500" />
            <span className="tracking-wider">@amitdied</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              onClick={() => {
                triggerGlitch();
                setViewMode('carousel');
              }}
              className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
                viewMode === 'carousel'
                  ? 'bg-red-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span className="hidden sm:inline">3D Rolodex</span>
            </button>
            <button
              onClick={() => {
                triggerGlitch();
                setViewMode('surveillance');
              }}
              className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
                viewMode === 'surveillance'
                  ? 'bg-red-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span className="hidden sm:inline">CCTV Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative z-20 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Instagram Profile Surveillance Banner */}
        <div className="mb-6 p-4 sm:p-5 bg-zinc-950/80 border border-zinc-800 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-red-600 p-0.5 flex-shrink-0 overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <Image
                src={AMITDIED_IG_PROFILE.avatarUrl}
                alt={AMITDIED_IG_PROFILE.username}
                fill
                className="object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 bg-red-600 w-4 h-4 rounded-full border border-black flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </div>
            </div>

            <div className="font-mono">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-white font-black text-lg sm:text-xl tracking-tight">
                  @{AMITDIED_IG_PROFILE.username}
                </span>
                <span className="bg-red-950/80 text-red-400 text-[10px] font-bold px-2 py-0.5 border border-red-800/60 uppercase tracking-widest flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> VERIFIED PRODUCER
                </span>
                <span className="text-[10px] text-zinc-500 tracking-widest hidden sm:inline">
                  OFFICIAL TRANSMISSION HUB
                </span>
              </div>
              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                {AMITDIED_IG_PROFILE.bio}
              </p>
            </div>
          </div>

          {/* Profile Stats & Direct Link */}
          <div className="flex items-center gap-4 sm:gap-6 font-mono self-start md:self-auto border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-5 text-center">
              <div>
                <span className="block text-white font-black text-sm sm:text-base">
                  {transmissions.length}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase">Feeds</span>
              </div>
              <div>
                <span className="block text-white font-black text-sm sm:text-base">
                  {AMITDIED_IG_PROFILE.followersCount}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase">Followers</span>
              </div>
              <div>
                <span className="block text-white font-black text-sm sm:text-base">
                  {AMITDIED_IG_PROFILE.followingCount}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase">Following</span>
              </div>
            </div>

            <a
              href="https://www.instagram.com/amitdied/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase tracking-widest font-black px-4 py-2.5 flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Follow</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>

        {/* Terminal Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>LIVE FREQUENCY • DECRYPTED INSTAGRAM TRANSMISSIONS</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tighter uppercase">
              STUDIO ARCHIVE <span className="text-red-600">{'//'} CCTV</span>
            </h1>
            <p className="font-mono text-xs text-zinc-400 mt-1 max-w-xl">
              Real-time studio intercepts, cookups, synthesizer patches, and placement announcements
              synced straight from the underground console of @amitdied.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Transmissions' },
              { id: 'cookup', label: 'Studio Cookups' },
              { id: 'placement', label: 'Placements' },
              { id: 'session', label: 'Vocals & Gear' },
              { id: 'lore', label: 'Aesthetic / Lore' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  triggerGlitch();
                  setActiveCategory(cat.id);
                  setActiveIndex(0);
                }}
                className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 border transition-all ${
                  activeCategory === cat.id
                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===================== VIEW MODE 1: 3D CYBERPUNK ROLODEX ===================== */}
        {viewMode === 'carousel' && (
          <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
            {/* Holographic Stage */}
            <div className="relative w-full max-w-4xl h-[460px] sm:h-[540px] flex items-center justify-center perspective-[1200px] overflow-hidden my-auto">
              {/* Floor grid / Hologram projector rings */}
              <div className="absolute bottom-4 w-96 h-96 rounded-full border border-red-600/20 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15),transparent_70%)] pointer-events-none transform -rotate-x-60" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent pointer-events-none" />

              {/* 3D Carousel Cards */}
              <div className="relative w-full h-full flex items-center justify-center">
                {filtered.map((item, idx) => {
                  const offset = idx - activeIndex;
                  const absOffset = Math.abs(offset);

                  // Keep only 2 cards visible on each side
                  if (absOffset > 2) return null;

                  const zIndex = 20 - absOffset;
                  const translateX = offset * 260; // Spread on X axis
                  const translateZ = -absOffset * 160; // Push back on Z axis
                  const rotateY = offset * -28; // Face inward toward center
                  const scale = 1 - absOffset * 0.15;
                  const opacity = 1 - absOffset * 0.35;
                  const isCenter = offset === 0;

                  return (
                    <motion.div
                      key={item.id}
                      animate={{
                        x: translateX,
                        z: translateZ,
                        rotateY: rotateY,
                        scale: scale,
                        opacity: opacity,
                      }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        zIndex,
                        transformStyle: 'preserve-3d',
                      }}
                      onClick={() => {
                        if (!isCenter) {
                          triggerGlitch();
                          setActiveIndex(idx);
                        } else {
                          setInspectModal(item);
                        }
                      }}
                      className={`absolute w-[290px] sm:w-[340px] h-[400px] sm:h-[460px] bg-zinc-950 border transition-colors cursor-pointer select-none overflow-hidden group ${
                        isCenter
                          ? 'border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.35)] ring-1 ring-red-500/50'
                          : 'border-zinc-800 hover:border-zinc-600 opacity-60'
                      }`}
                    >
                      {/* CCTV Camera Header Bar */}
                      <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCenter ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'
                            }`}
                          />
                          <span className="text-white font-bold">{item.camCode}</span>
                        </div>
                        <span className="text-zinc-500 tracking-wider">REC 🔴</span>
                      </div>

                      {/* Main Image Frame with scanlines & Glitch */}
                      <div className="relative w-full h-[220px] sm:h-[260px] bg-zinc-900 overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.caption}
                          fill
                          className={`object-cover transition-transform duration-700 ${
                            isCenter ? 'group-hover:scale-105 filter contrast-125' : 'grayscale'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />

                        {/* Top Left Watermark */}
                        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 border border-zinc-800 font-mono text-[9px] text-red-400">
                          {item.category.toUpperCase()}
                        </div>

                        {/* Timestamp watermark */}
                        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 border border-zinc-800 font-mono text-[9px] text-zinc-300">
                          {item.timestamp}
                        </div>

                        {/* Center Hover Action Icon */}
                        {isCenter && (
                          <div className="absolute inset-0 bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="bg-red-600 text-white font-mono text-xs uppercase tracking-widest px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                              <Maximize2 className="w-3.5 h-3.5" /> Intercept
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Post Metadata Card Footer */}
                      <div className="p-3.5 flex flex-col justify-between h-[135px] sm:h-[155px] font-mono">
                        <div>
                          <div className="text-[11px] text-white font-bold line-clamp-1 mb-1 text-red-400 flex items-center gap-1.5">
                            <Film className="w-3 h-3 text-red-500" />
                            {item.videoSnippetTitle || 'TRANSMISSION_FEED'}
                          </div>
                          <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                            {item.caption}
                          </p>
                        </div>

                        <div className="border-t border-zinc-800/80 pt-2 flex items-center justify-between text-[11px] text-zinc-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-red-400">
                              <Heart className="w-3 h-3 fill-red-500/20 text-red-500" />
                              {item.likes}
                            </span>
                            <span className="flex items-center gap-1 text-zinc-400">
                              <MessageCircle className="w-3 h-3" />
                              {item.comments}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                            {isCenter ? 'CLICK TO OPEN' : 'TAP TO FOCUS'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 bg-zinc-950/90 border border-zinc-800 hover:border-red-600 p-3 sm:p-4 text-white hover:text-red-500 transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                aria-label="Previous transmission"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 bg-zinc-950/90 border border-zinc-800 hover:border-red-600 p-3 sm:p-4 text-white hover:text-red-500 transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                aria-label="Next transmission"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom HUD Carousel Control Bar */}
            <div className="mt-4 flex items-center justify-center gap-4 font-mono text-xs">
              <span className="text-zinc-500 uppercase tracking-widest">
                STREAM {activeIndex + 1} / {filtered.length}
              </span>

              <div className="flex items-center gap-1">
                {filtered.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      triggerGlitch();
                      setActiveIndex(i);
                    }}
                    className={`h-1.5 transition-all ${
                      activeIndex === i
                        ? 'w-6 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]'
                        : 'w-2 bg-zinc-800 hover:bg-zinc-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] transition-colors ${
                  autoRotate
                    ? 'border-red-600 text-red-400 bg-red-950/40'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
                <span>Auto Scan</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== VIEW MODE 2: SURVEILLANCE CCTV GRID ===================== */}
        {viewMode === 'surveillance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-4">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setInspectModal(item)}
                className="relative bg-zinc-950 border border-zinc-800 hover:border-red-600/80 transition-all group cursor-pointer overflow-hidden flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]"
              >
                {/* Surveillance Camera Header */}
                <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span className="text-white font-bold">{item.camCode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span>{item.timestamp}</span>
                    <span className="text-red-500">🔴 LIVE</span>
                  </div>
                </div>

                {/* CCTV Monitor Image */}
                <div className="relative h-60 w-full bg-zinc-900 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.caption}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-110"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle scanline line within camera feed */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Corner Targets */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-red-500 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-red-500 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-red-500 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-red-500 pointer-events-none" />

                  {/* Center Action Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                    <Eye className="w-8 h-8 text-red-500 mb-1" />
                    <span className="font-mono text-xs uppercase tracking-widest font-bold">
                      Open Surveillance Feed
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Tap to inspect metadata & DM
                    </span>
                  </div>
                </div>

                {/* Caption / Details Footer */}
                <div className="p-4 font-mono flex flex-col justify-between flex-1">
                  <div>
                    <div className="text-xs font-bold text-red-400 mb-1.5 truncate">
                      {item.videoSnippetTitle || 'CCTV_RECORDING_01'}
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3">
                      {item.caption}
                    </p>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-2.5 flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-red-400">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
                        {item.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {item.comments}
                      </span>
                    </div>

                    <a
                      href={item.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-500 hover:text-white flex items-center gap-1 text-[11px] uppercase tracking-wider"
                    >
                      <Instagram className="w-3 h-3 text-pink-500" />
                      <span>Instagram</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ===================== HOLOGRAPHIC INSPECT MODAL ===================== */}
      <AnimatePresence>
        {inspectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectModal(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-zinc-950 border border-red-600/70 shadow-[0_0_60px_rgba(220,38,38,0.35)] z-10 overflow-hidden flex flex-col my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <span className="text-white text-xs font-bold tracking-wider">
                    {inspectModal.camCode}
                  </span>
                  <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 border border-red-800/60 uppercase">
                    {inspectModal.category}
                  </span>
                </div>
                <button
                  onClick={() => setInspectModal(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Visual Monitor View */}
                <div className="relative h-72 md:h-full min-h-[300px] bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 overflow-hidden">
                  <Image
                    src={inspectModal.imageUrl}
                    alt={inspectModal.caption}
                    fill
                    className="object-cover filter contrast-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 font-mono text-[10px] text-zinc-300 border border-zinc-800">
                    INTERCEPT TIME: {inspectModal.timestamp}
                  </div>
                </div>

                {/* Metadata & Actions Panel */}
                <div className="p-6 font-mono flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs text-red-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5" />
                      {inspectModal.videoSnippetTitle || 'TRANSMISSION_INTEL'}
                    </div>

                    <p className="text-sm text-zinc-200 leading-relaxed mb-4">
                      {inspectModal.caption}
                    </p>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {inspectModal.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-800/80 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Engagement</span>
                        <span className="text-red-400 font-bold flex items-center gap-1 mt-0.5">
                          <Heart className="w-3.5 h-3.5 fill-red-500/20 text-red-500" />
                          {inspectModal.likes} Likes
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Comments</span>
                        <span className="text-zinc-300 font-bold flex items-center gap-1 mt-0.5">
                          <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                          {inspectModal.comments} Comments
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleCopyDM(inspectModal)}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase tracking-[0.2em] py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)]"
                    >
                      <Send className="w-4 h-4" />
                      <span>DM Amit On Instagram</span>
                    </button>

                    <a
                      href={inspectModal.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-mono text-xs uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span>View Original Post on Instagram</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    </a>

                    {copiedLink && (
                      <div className="text-[11px] text-emerald-400 text-center font-mono py-1">
                        ✓ Inquired message copied to clipboard & opening Instagram!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
