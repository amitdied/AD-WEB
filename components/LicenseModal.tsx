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
  Music2,
  Sliders,
  FileCheck,
  QrCode,
  Smartphone,
  CreditCard,
  Send,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Terminal,
} from 'lucide-react';

export interface LicenseTier {
  id: string;
  code: string;
  name: string;
  shortName: string;
  priceINR: number;
  formattedPrice: string;
  badge?: string;
  badgeType?: 'popular' | 'exclusive';
  tagline: string;
  features: string[];
  rights: string[];
}

export const UPI_ID = '8319145425-2@ybl';
export const UPI_NAME = 'AMITDIED';

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: 'mp3',
    code: '01',
    name: 'MP3 LEASE',
    shortName: 'MP3 LEASE',
    priceINR: 799,
    formattedPrice: '₹799',
    tagline: 'MP3 MASTER // COMMERCIAL USE',
    features: ['MP3 Master', 'Commercial use', 'Non-exclusive'],
    rights: [
      'Untagged 320kbps MP3 Master file',
      'Commercial streaming & YouTube monetization',
      'Distribution on Spotify, Apple Music & all platforms',
      'Instant untagged delivery after payment confirmation',
    ],
  },
  {
    id: 'wav',
    code: '02',
    name: 'WAV LEASE',
    shortName: 'WAV LEASE',
    priceINR: 999,
    formattedPrice: '₹999',
    badge: 'MOST USED',
    badgeType: 'popular',
    tagline: 'WAV MASTER + MP3 // COMMERCIAL USE',
    features: ['WAV Master', 'MP3 included', 'Commercial use', 'Non-exclusive'],
    rights: [
      'Lossless 24-Bit Master WAV + Untagged MP3 included',
      'Commercial streaming, radio airplay & music videos',
      'Industry standard quality for recording artists',
      'Instant untagged master delivery after payment confirmation',
    ],
  },
  {
    id: 'stems',
    code: '03',
    name: 'TRACKOUT STEMS',
    shortName: 'TRACKOUT STEMS',
    priceINR: 2999,
    formattedPrice: '₹2,999',
    tagline: 'INDIVIDUAL WAV STEMS // WAV + MP3',
    features: ['Individual WAV stems', 'WAV + MP3', 'Commercial use', 'Non-exclusive'],
    rights: [
      'Full separated multitrack stems (drums, bass, melodies, FX in 24-Bit WAV)',
      'Master 24-Bit WAV + 320kbps MP3 included',
      'Complete mixing, vocal arrangement & sound design freedom',
      'Instant trackout archive delivery after payment confirmation',
    ],
  },
  {
    id: 'exclusive',
    code: '04',
    name: 'EXCLUSIVE',
    shortName: 'EXCLUSIVE',
    priceINR: 5999,
    formattedPrice: '₹5,999',
    badge: 'OWN IT',
    badgeType: 'exclusive',
    tagline: 'FULL RIGHTS // ALL STEMS // BEAT REMOVED FROM STORE',
    features: [
      'Full exclusive rights',
      'All stems included',
      'Beat removed from public store',
      'Exclusive ownership/license',
    ],
    rights: [
      'Full exclusive ownership & master rights transfer',
      'Beat permanently removed from the public store catalog',
      'All individual multitrack stems + master WAV + MP3',
      'Unlimited distribution, sync licensing, broadcasting & live performance',
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
  // Step 1: License selection, Step 2: Payment checkout
  const [currentStep, setCurrentStep] = useState<'select' | 'payment'>('select');
  const [selectedTierId, setSelectedTierId] = useState<string>('wav');
  const [prevBeatId, setPrevBeatId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'instagram'>('upi');
  const [showDetailedTerms, setShowDetailedTerms] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedTxnNote, setCopiedTxnNote] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [senderUpiOrRef, setSenderUpiOrRef] = useState('');
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);

  // Sync state when a different beat is opened
  if (beat && beat.id !== prevBeatId) {
    setPrevBeatId(beat.id);
    setCurrentStep('select');
    setSelectedTierId('wav');
  }

  const handleClose = useCallback(() => {
    setCurrentStep('select');
    setSelectedTierId('wav');
    setCopiedUpi(false);
    setCopiedTxnNote(false);
    setCustomNote('');
    setSenderUpiOrRef('');
    setReceiptSubmitted(false);
    setShowDetailedTerms(false);
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

  // UPI deep-link standard URI (100% INR)
  const upiTransactionNote = `Beat ${beat.title} - ${selectedTier.name}`;
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${selectedTier.priceINR}&cu=INR&tn=${encodeURIComponent(upiTransactionNote)}`;

  // Dynamic QR Code generation for UPI URI
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  // Formatted Instagram DM message
  const formattedMessage = customNote.trim()
    ? `Yo Amit, I want to acquire "${beat.title}" under ${selectedTier.name} (${selectedTier.formattedPrice}). Note: ${customNote.trim()}`
    : `Yo Amit, I want to acquire "${beat.title}" under ${selectedTier.name} (${selectedTier.formattedPrice}).`;

  const copyToClipboard = async (text: string, setCopiedState: (v: boolean) => void) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 3000);
      return true;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  };

  const handleInstantDM = async () => {
    await copyToClipboard(formattedMessage, setCopiedTxnNote);
    const igDmUrl = 'https://ig.me/m/amitdied';
    window.open(igDmUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendPaymentConfirmation = () => {
    const confirmationMsg = `Yo Amit, I completed payment of ${selectedTier.formattedPrice} via UPI to ${UPI_ID} for "${beat.title}" (${selectedTier.name}). Reference/Sender: ${
      senderUpiOrRef.trim() || 'Payment completed'
    }. Please send untagged audio files.`;
    copyToClipboard(confirmationMsg, setCopiedTxnNote);
    setReceiptSubmitted(true);
    const igDmUrl = 'https://ig.me/m/amitdied';
    window.open(igDmUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto selection:bg-red-900 selection:text-white">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        />

        {/* Modal Terminal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 shadow-[0_0_60px_rgba(220,38,38,0.25)] z-10 overflow-hidden flex flex-col max-h-[92vh] font-mono text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Laser Accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

          {/* Terminal Title Bar */}
          <div className="px-3 sm:px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3 select-none text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
              <span className="font-mono font-bold tracking-widest text-zinc-300 truncate uppercase">
                AMITDIED // LICENSE TERMINAL
              </span>
              <span className="hidden sm:inline-block text-zinc-600">/</span>
              <span className="hidden sm:inline-block text-[10px] text-zinc-500 tracking-wider">
                SYSTEM / LICENSE / ACCESS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500/80 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 hidden sm:inline-block">
                SYS.ONLINE
              </span>
              <button
                onClick={handleClose}
                className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-red-600/20 hover:border-red-600 border border-zinc-800 text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1"
                aria-label="Close terminal"
              >
                <span>[ESC]</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dynamic Beat Header Banner */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 bg-black/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Artwork */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-zinc-900 border border-zinc-800 overflow-hidden group">
                {beat.coverUrl && beat.coverUrl.trim() !== '' ? (
                  <Image
                    src={beat.coverUrl}
                    alt={beat.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Music2 className="w-6 h-6 opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Dynamic Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap text-[10px] font-mono tracking-widest">
                  <span className="text-red-500 bg-red-950/60 border border-red-800/40 px-1.5 py-0.2 uppercase font-bold">
                    BEAT LICENSE
                  </span>
                  {beat.bpm && (
                    <span className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 uppercase">
                      {beat.bpm} BPM
                    </span>
                  )}
                  {beat.genre && (
                    <span className="text-zinc-500 border border-zinc-850 px-1.5 py-0.2 uppercase hidden sm:inline-block">
                      {beat.genre}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tighter truncate">
                  {beat.title}
                </h3>
              </div>
            </div>

            {/* Step indicator breadcrumb */}
            <div className="flex flex-col items-end flex-shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono">
                <button
                  onClick={() => setCurrentStep('select')}
                  className={`px-2 py-1 border transition-all cursor-pointer ${
                    currentStep === 'select'
                      ? 'border-red-600 text-red-400 bg-red-950/40 font-bold'
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  01. LICENSE
                </button>
                <span className="text-zinc-700">→</span>
                <button
                  onClick={() => setCurrentStep('payment')}
                  className={`px-2 py-1 border transition-all cursor-pointer ${
                    currentStep === 'payment'
                      ? 'border-red-600 text-red-400 bg-red-950/40 font-bold'
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  02. PAYMENT
                </button>
              </div>
              <div className="mt-1 text-[9px] text-zinc-500 font-mono tracking-widest">
                ACTIVE: {selectedTier.formattedPrice}
              </div>
            </div>
          </div>

          {/* Modal Content Area (Scrollable) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            <AnimatePresence mode="wait">
              {/* ========================================================= */}
              {/* STEP 01: CHOOSE LICENSE ACCESS */}
              {/* ========================================================= */}
              {currentStep === 'select' ? (
                <motion.div
                  key="step-select"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Section Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-850 pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-red-500" />
                      <span className="text-xs uppercase font-bold tracking-[0.2em] text-white">
                        SELECT YOUR ACCESS
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 tracking-widest">
                      [ CHOOSE TIER TO ACTIVATE ]
                    </span>
                  </div>

                  {/* 4 License Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {LICENSE_TIERS.map((tier) => {
                      const isSelected = selectedTierId === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedTierId(tier.id)}
                          className={`group relative p-3.5 sm:p-4 text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-red-950/30 border-red-600 shadow-[0_0_25px_rgba(220,38,38,0.25)] ring-1 ring-red-600/50'
                              : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                          }`}
                        >
                          {/* Corner accent for terminal feeling */}
                          {isSelected && (
                            <>
                              <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-red-600" />
                              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-600" />
                              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-red-600" />
                              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-red-600" />
                            </>
                          )}

                          {/* Badge (MOST USED or OWN IT) */}
                          {tier.badge && (
                            <div className="absolute -top-2.5 right-3 z-10">
                              {tier.badgeType === 'popular' ? (
                                <span className="bg-red-600 text-white text-[9px] font-mono uppercase tracking-[0.18em] px-2 py-0.5 font-bold shadow-md border border-red-500">
                                  {tier.badge}
                                </span>
                              ) : (
                                <span className="bg-zinc-100 text-black text-[9px] font-mono uppercase tracking-[0.18em] px-2 py-0.5 font-black shadow-md border border-white">
                                  {tier.badge}
                                </span>
                              )}
                            </div>
                          )}

                          <div>
                            {/* Code and Title */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] text-zinc-500 font-mono tracking-widest">
                                [{tier.code}]
                              </span>
                              <div
                                className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${
                                  isSelected ? 'text-red-400 font-bold' : 'text-zinc-500'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span>ACTIVE</span>
                                  </>
                                ) : (
                                  <span>IDLE</span>
                                )}
                              </div>
                            </div>

                            <h4
                              className={`font-mono text-xs font-black uppercase tracking-wider mb-2 ${
                                isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                              }`}
                            >
                              {tier.shortName}
                            </h4>

                            {/* Exact INR Price */}
                            <div className="mb-3">
                              <div className="font-mono text-2xl font-black tracking-tight text-white flex items-baseline gap-1">
                                <span>{tier.formattedPrice}</span>
                              </div>
                            </div>

                            {/* Compact Feature Summary */}
                            <div className="text-[10px] text-zinc-400 font-mono space-y-1 mb-4 border-t border-zinc-850 pt-2">
                              {tier.features.map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 leading-tight">
                                  <span className="text-red-500 font-bold mt-[-1px]">•</span>
                                  <span className="text-zinc-300">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Selection Button State */}
                          <div className="pt-2 border-t border-zinc-800/80 mt-auto">
                            <div
                              className={`w-full py-1.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-[0.18em] transition-colors border ${
                                isSelected
                                  ? 'bg-red-600 text-white border-red-500 shadow-sm'
                                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 group-hover:border-zinc-700 group-hover:text-zinc-200'
                              }`}
                            >
                              {isSelected ? '[ SELECTED ]' : '[ SELECT ]'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected License Dynamic Info & Breakdown */}
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 relative overflow-hidden">
                    {/* Subtle red scanline accent */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          ACCESS TYPE
                        </div>
                        <div className="text-sm sm:text-base font-mono font-bold text-white uppercase flex items-center gap-2">
                          <span>{selectedTier.name}</span>
                          <span className="text-zinc-500 text-xs">—</span>
                          <span className="text-red-500 font-black">{selectedTier.formattedPrice}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDetailedTerms(!showDetailedTerms)}
                          className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 flex items-center gap-1.5 transition-colors cursor-pointer bg-black/40"
                        >
                          <span>LICENSE DETAILS</span>
                          {showDetailedTerms ? (
                            <ChevronUp className="w-3 h-3 text-red-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-zinc-300">
                      {selectedTier.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expandable detailed license terms */}
                    {showDetailedTerms && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1.5"
                      >
                        <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">
                          FULL CONTRACT SPECIFICATIONS:
                        </div>
                        {selectedTier.rights.map((right, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-zinc-600 font-bold">[{idx + 1}]</span>
                            <span className="text-zinc-300">{right}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Proceed to Payment CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs font-mono text-zinc-400">
                      <span>SELECTED: </span>
                      <strong className="text-white">{selectedTier.name}</strong>
                      <span className="mx-2 text-zinc-600">|</span>
                      <span>TOTAL: </span>
                      <strong className="text-red-500">{selectedTier.formattedPrice}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentStep('payment')}
                      className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] cursor-pointer group"
                    >
                      <span>PROCEED TO PAYMENT →</span>
                      <span className="bg-black/30 px-2 py-0.5 text-[11px] font-bold">
                        {selectedTier.formattedPrice}
                      </span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ========================================================= */
                /* STEP 02: COMPLETE YOUR ACQUISITION (PAYMENT TERMINAL) */
                /* ========================================================= */
                <motion.div
                  key="step-payment"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Step Header & Back Link */}
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('select')}
                      className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
                      <span>← BACK TO LICENSES</span>
                    </button>

                    <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-950/50 border border-red-800/40 px-2 py-0.5 font-bold">
                      02 — COMPLETE YOUR ACQUISITION
                    </span>
                  </div>

                  {/* Order Summary Card */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        ACQUISITION TARGET
                      </div>
                      <div className="text-lg font-mono font-black text-white uppercase">
                        {beat.title}
                      </div>
                      <div className="text-xs font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="text-red-400">{selectedTier.name}</span>
                        <span>•</span>
                        <span>{beat.bpm || 140} BPM</span>
                      </div>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0 w-full sm:w-auto">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        TOTAL DUE
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-red-500 tracking-tight">
                        {selectedTier.formattedPrice}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Switcher Tabs */}
                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-red-500" />
                      <span>SELECT PAYMENT METHOD:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 border flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          paymentMethod === 'upi'
                            ? 'bg-red-950/40 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] font-bold'
                            : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-red-500" />
                        <span>INSTANT UPI (GPAY / PHONEPE / QR)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('instagram')}
                        className={`p-3 border flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          paymentMethod === 'instagram'
                            ? 'bg-red-950/40 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] font-bold'
                            : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span>INSTAGRAM DM / CUSTOM DEAL</span>
                      </button>
                    </div>

                    {/* ========================================================= */}
                    {/* UPI PAYMENT METHOD VIEW */}
                    {/* ========================================================= */}
                    {paymentMethod === 'upi' && (
                      <div className="bg-zinc-900/30 border border-zinc-800 p-4 sm:p-5 space-y-5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800/80 pb-2">
                          <span className="uppercase font-bold text-zinc-200 flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-red-500" />
                            PAYMENT TERMINAL // SCAN / PAY
                          </span>
                          <span className="text-emerald-400 text-[10px]">
                            INSTANT DELIVERY READY
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {/* QR Code Container */}
                          <div className="flex flex-col items-center bg-black border border-zinc-800 p-3.5 flex-shrink-0 shadow-lg">
                            <div className="relative w-40 h-40 sm:w-44 sm:h-44 bg-white p-2">
                              <Image
                                src={qrCodeUrl}
                                alt="UPI Payment QR Code"
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest text-center flex items-center gap-1.5">
                              <QrCode className="w-3 h-3 text-red-500" />
                              <span>SCAN WITH ANY UPI APP</span>
                            </div>
                          </div>

                          {/* UPI Details & Instructions */}
                          <div className="flex-1 w-full space-y-3 font-mono">
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                                OFFICIAL UPI ID (RECEIVER)
                              </div>
                              <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2.5">
                                <span className="text-white font-bold text-sm select-all flex-1 tracking-wider">
                                  {UPI_ID}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(UPI_ID, setCopiedUpi)}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  {copiedUpi ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-emerald-400 font-bold">COPIED</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>COPY UPI</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-black/60 border border-zinc-800/80 p-2.5">
                                <div className="text-zinc-500 text-[10px] uppercase tracking-widest">
                                  PAYABLE AMOUNT
                                </div>
                                <div className="text-red-500 font-black text-base mt-0.5">
                                  {selectedTier.formattedPrice}
                                </div>
                              </div>

                              <div className="bg-black/60 border border-zinc-800/80 p-2.5">
                                <div className="text-zinc-500 text-[10px] uppercase tracking-widest">
                                  TRANSACTION NOTE
                                </div>
                                <div className="text-zinc-200 text-xs truncate mt-0.5 font-bold">
                                  {upiTransactionNote}
                                </div>
                              </div>
                            </div>

                            {/* Deep link button for mobile */}
                            <a
                              href={upiDeepLink}
                              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono text-xs font-black uppercase tracking-[0.18em] py-3 px-4 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] transition-all cursor-pointer"
                            >
                              <Smartphone className="w-4 h-4" />
                              <span>PAY VIA UPI APP (MOBILE)</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          </div>
                        </div>

                        {/* Payment Confirmation Form */}
                        <div className="pt-4 border-t border-zinc-800/80 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-xs text-zinc-200 font-bold uppercase tracking-wider flex items-center gap-2 font-mono">
                              <Send className="w-3.5 h-3.5 text-red-500" />
                              CONFIRM PAYMENT TO RECEIVE FILES:
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              Avg Delivery &lt; 15 mins
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={senderUpiOrRef}
                              onChange={(e) => setSenderUpiOrRef(e.target.value)}
                              placeholder="Enter UPI Ref / Transaction ID or Sender UPI ID..."
                              className="bg-black border border-zinc-800 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 font-mono flex-1 focus:outline-none focus:border-red-600"
                            />
                            <button
                              type="button"
                              onClick={handleSendPaymentConfirmation}
                              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-xs uppercase font-bold tracking-wider px-4 py-2.5 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Instagram className="w-3.5 h-3.5 text-pink-400" />
                              <span>I HAVE COMPLETED PAYMENT</span>
                            </button>
                          </div>

                          {receiptSubmitted && (
                            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2.5 flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>
                                Payment confirmation copied! Instagram DM opened. Send the message or screenshot to receive your untagged files instantly.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* INSTAGRAM DM DIRECT / CUSTOM OPTION */}
                    {/* ========================================================= */}
                    {paymentMethod === 'instagram' && (
                      <div className="space-y-4 bg-zinc-900/30 border border-zinc-800 p-4 sm:p-5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800/80 pb-2">
                          <span className="uppercase font-bold text-zinc-200 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-red-500" />
                            CUSTOM DEAL // DIRECT CONTACT
                          </span>
                          <span className="text-zinc-500 text-[10px]">
                            @AMITDIED ON INSTAGRAM
                          </span>
                        </div>

                        <p className="text-xs font-mono text-zinc-400">
                          Need custom stems, bulk deals, stems bundles, or alternate payment methods? Reach out directly.
                        </p>

                        <div className="relative bg-black border border-zinc-800 p-3.5 font-mono text-xs text-zinc-200 space-y-3">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>DIRECT MESSAGE PREVIEW</span>
                          </div>

                          <div className="text-white font-medium break-words select-all bg-zinc-950 p-3 border border-zinc-850">
                            &ldquo;{formattedMessage}&rdquo;
                          </div>

                          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                              ADD NOTE (OPTIONAL):
                            </span>
                            <input
                              type="text"
                              value={customNote}
                              onChange={(e) => setCustomNote(e.target.value)}
                              placeholder="e.g. need urgent stem pack, custom bpm change, etc."
                              className="bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono w-full focus:outline-none focus:border-red-600"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                          <button
                            type="button"
                            onClick={handleInstantDM}
                            className="flex-1 relative overflow-hidden bg-red-600 hover:bg-red-500 text-white font-mono text-xs sm:text-sm font-black uppercase tracking-[0.2em] py-3.5 px-6 flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] group cursor-pointer"
                          >
                            <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>DM AMITDIED</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          </button>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(formattedMessage, setCopiedTxnNote)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 font-mono text-xs uppercase tracking-widest py-3.5 px-5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            {copiedTxnNote ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">COPIED!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>COPY TEXT</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terminal Status Bar & Guarantees */}
            <div className="border-t border-zinc-850 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] font-mono text-zinc-500">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>
                  VERIFIED MERCHANT: <strong className="text-zinc-200">{UPI_ID}</strong> • DIRECT DISPATCH BY @AMITDIED
                </span>
              </div>
              <a
                href="https://www.instagram.com/amitdied/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors uppercase tracking-wider"
              >
                <span>INSTAGRAM.COM/AMITDIED</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
