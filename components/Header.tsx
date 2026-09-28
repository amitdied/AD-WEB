'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, Disc, Shield, Mail, ShoppingBag, Menu, X, ExternalLink } from 'lucide-react';
import { useAudio } from '@/lib/AudioContext';

export function Header() {
  const { isPlaying, currentBeat, togglePlay } = useAudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-zinc-900 flex items-center justify-center border border-red-500/30 group-hover:border-red-500 transition-colors">
            <span className="text-white font-black tracking-tighter text-lg font-mono">A†</span>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-wider text-white group-hover:text-red-500 transition-colors">
              AMITDIED
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              SOUND LAB // 2026
            </span>
          </div>
        </Link>

        {/* Live Audio Indicator Pill */}
        {currentBeat && (
          <button
            onClick={togglePlay}
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-red-500/50 transition-all text-xs"
          >
            <div className="flex items-center gap-0.5 h-3">
              <span className={`w-0.5 bg-red-500 rounded-full transition-all ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`}></span>
              <span className={`w-0.5 bg-red-500 rounded-full transition-all ${isPlaying ? 'h-4 animate-bounce' : 'h-2'}`}></span>
              <span className={`w-0.5 bg-red-500 rounded-full transition-all ${isPlaying ? 'h-2.5 animate-pulse' : 'h-1'}`}></span>
            </div>
            <span className="text-zinc-300 font-medium truncate max-w-[140px] font-mono">
              {currentBeat.title}
            </span>
            <span className="text-zinc-500 text-[10px]">
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </span>
          </button>
        )}

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-mono tracking-widest uppercase">
          <a href="#beats" className="text-zinc-300 hover:text-red-500 transition-colors">
            Beats Catalog
          </a>
          <a href="#licensing" className="text-zinc-300 hover:text-red-500 transition-colors">
            Licenses
          </a>
          <a href="#credits" className="text-zinc-300 hover:text-red-500 transition-colors">
            Portfolio
          </a>
          <a href="#contact" className="text-zinc-300 hover:text-red-500 transition-colors">
            Inquiries
          </a>
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
            Admin
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <a
            href="#beats"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-900/20 hover:shadow-red-700/40"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse Beats</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl px-4 py-6 space-y-4 font-mono text-sm tracking-widest uppercase">
          <a
            href="#beats"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-red-500"
          >
            Beats Catalog
          </a>
          <a
            href="#licensing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-red-500"
          >
            Licenses & Pricing
          </a>
          <a
            href="#credits"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-red-500"
          >
            Credits / Placements
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-300 hover:text-red-500"
          >
            Custom Production & Contact
          </a>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-zinc-500 hover:text-zinc-200"
          >
            Admin Dashboard
          </Link>
          <div className="pt-2">
            <a
              href="#beats"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 text-white font-bold tracking-wider"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>EXPLORE ALL BEATS</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
