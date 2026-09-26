'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Instagram,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Music2,
  Sliders,
  Flame,
  FileCheck,
} from 'lucide-react';

export interface LicenseTier {
  id: string;
  name: string;
  shortName: string;
  price: string;
  recommended?: boolean;
  features: string[];
}

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: 'mp3',
    name: 'MP3 Lease',
    shortName: 'MP3 Lease',
    price: '$29.99',
    features: [
      'Untagged 320kbps MP3 Master',
      'Up to 100,000 Spotify & Apple Streams',
      '1 Music Video / YouTube Monetization',
      'Instant Untagged Delivery',
    ],
  },
  {
    id: 'wav',
    name: 'WAV Lease',
    shortName: 'WAV Lease',
    price: '$49.99',
    recommended: true,
    features: [
      'Lossless 24-Bit Master WAV + MP3',
      'Up to 500,000 Total Streams',
      'Radio Airplay & Commercial Monetization',
      'Best Value For Recording Artists',
    ],
  },
  {
    id: 'stems',
    name: 'Trackout Stems',
    shortName: 'Trackout Stems',
    price: '$99.99',
    features: [
      'Full Multi-Track Stems (Individual WAVs)',
      'Master 24-Bit WAV + MP3 Included',
      'Unlimited Streams & Global Distribution',
      'Complete Mixing & Vocal Arranging Freedom',
    ],
  },
  {
    id: 'exclusive',
    name: 'Exclusive Rights',
    shortName: 'Exclusive',
    price: '$299+',
    features: [
      'Full Sole Ownership & Master Rights Transfer',
      'Beat Removed From Store Catalog Permanently',
      'Unlimited Everything (Sync, TV, Radio, Shows)',
      'Official Signed Ownership Contract',
    ],
  },
];

interface LicenseModalProps {
  beat: {
    id: string;
    title: string;
    genre?: string;
    bpm?: number | string;
    coverUrl?: string;
    price?: number | string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LicenseModal({ beat, isOpen, onClose }: LicenseModalProps) {
  const [selectedTierId, setSelectedTierId] = useState<string>('wav');
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');

  const handleClose = useCallback(() => {
    setCopied(false);
    setCustomNote('');
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !beat) return null;

  const selectedTier =
    LICENSE_TIERS.find((t) => t.id === selectedTierId) || LICENSE_TIERS[1];

  // Pre-format the exact message requested:
  // "Yo Amit, I want to acquire [Beat Title] under the [WAV Lease / Exclusive] license."
  const formattedMessage = customNote.trim()
    ? `Yo Amit, I want to acquire ${beat.title} under the ${selectedTier.name} license. (${customNote.trim()})`
    : `Yo Amit, I want to acquire ${beat.title} under the ${selectedTier.name} license.`;

  const copyToClipboard = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(formattedMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = formattedMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      return true;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  };

  const handleInstantDM = async () => {
    await copyToClipboard();
    // Direct Instagram DM link: opens native app chat or web direct inbox with @amitdied
    const igDmUrl = 'https://ig.me/m/amitdied';
    window.open(igDmUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-none shadow-[0_0_60px_rgba(220,38,38,0.25)] z-10 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top red laser accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-600 to-transparent" />

          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-zinc-900 border border-zinc-800 overflow-hidden">
                {beat.coverUrl && beat.coverUrl.trim() !== '' ? (
                  <Image
                    src={beat.coverUrl}
                    alt={beat.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Music2 className="w-8 h-8 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-950/60 px-2 py-0.5 border border-red-800/40">
                    Acquire License
                  </span>
                  {beat.genre && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                      {beat.genre}
                    </span>
                  )}
                  {beat.bpm && (
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400">
                      {beat.bpm} BPM
                    </span>
                  )}
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tighter truncate">
                  {beat.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700 flex-shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Step 1: Select License Tier */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-500" />
                  1. Select License Tier
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Instant untagged delivery
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LICENSE_TIERS.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`relative p-3.5 text-left border transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-red-950/30 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.25)]'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                      }`}
                    >
                      {tier.recommended && (
                        <div className="absolute -top-2.5 right-2 bg-red-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" /> Popular
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-mono text-xs font-bold uppercase tracking-wider ${
                              isSelected ? 'text-red-400' : 'text-zinc-300'
                            }`}
                          >
                            {tier.shortName}
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-red-500 bg-red-500 text-black'
                                : 'border-zinc-700'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </div>
                        <div className="font-mono text-xl font-black text-white mb-2">
                          {tier.price}
                        </div>
                      </div>

                      <div className="border-t border-zinc-800/80 pt-2 mt-1 space-y-1">
                        {tier.features.slice(0, 2).map((feat, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] text-zinc-400 font-mono leading-tight flex items-start gap-1"
                          >
                            <span className="text-red-500/80 mt-0.5">•</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected License Features Breakdown */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-red-500" />
                  Included in {selectedTier.name}:
                </span>
                <span className="font-mono text-xs text-red-500 font-bold">
                  {selectedTier.price}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 font-mono">
                {selectedTier.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: 1-Click Pre-Filled Instagram Message */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-red-500" />
                  2. Pre-Formatted Instagram DM
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Auto-formatted for @amitdied
                </span>
              </div>

              {/* Message Display Box */}
              <div className="relative bg-black/60 border border-zinc-800 p-4 font-mono text-sm text-zinc-200">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Direct Message Preview
                </div>
                <div className="text-white font-medium break-words select-all bg-zinc-950 p-3 border border-zinc-850 rounded-sm">
                  &ldquo;{formattedMessage}&rdquo;
                </div>

                {/* Optional artist note */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                    Add Note:
                  </span>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Optional (e.g. need stems today, release date next month...)"
                    className="bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono w-full focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {/* 1-Click Instant DM Action Button */}
                <button
                  type="button"
                  onClick={handleInstantDM}
                  className="flex-1 relative overflow-hidden bg-red-600 hover:bg-red-500 text-white font-mono text-xs sm:text-sm font-black uppercase tracking-[0.2em] py-3.5 px-6 flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] group"
                >
                  <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Instant DM to Buy</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* Copy Message Only Button */}
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 font-mono text-xs uppercase tracking-widest py-3.5 px-5 flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Alert */}
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-mono p-2.5 text-center flex items-center justify-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Message copied to clipboard! Paste it directly into your Instagram DM with{' '}
                    <strong>@amitdied</strong>.
                  </span>
                </motion.div>
              )}
            </div>

            {/* Trust & Guarantee Info Footer */}
            <div className="border-t border-zinc-800/80 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-zinc-500">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>Handled personally by @amitdied • Instant link transfer</span>
              </div>
              <a
                href="https://www.instagram.com/amitdied/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <span>View Instagram Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
