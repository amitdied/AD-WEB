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
} from 'lucide-react';

export interface LicenseTier {
  id: string;
  name: string;
  shortName: string;
  priceUSD: string;
  priceINR: number;
  recommended?: boolean;
  features: string[];
}

export const UPI_ID = '8319145425-2@ybl';
export const UPI_NAME = 'AMITDIED';

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: 'mp3',
    name: 'MP3 Lease',
    shortName: 'MP3 Lease',
    priceUSD: '$29.99',
    priceINR: 2499,
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
    priceUSD: '$49.99',
    priceINR: 3999,
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
    priceUSD: '$99.99',
    priceINR: 7999,
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
    priceUSD: '$299+',
    priceINR: 24999,
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
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'instagram'>('upi');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedTxnNote, setCopiedTxnNote] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [senderUpiOrRef, setSenderUpiOrRef] = useState('');
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);

  const handleClose = useCallback(() => {
    setCopiedUpi(false);
    setCopiedTxnNote(false);
    setCustomNote('');
    setSenderUpiOrRef('');
    setReceiptSubmitted(false);
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

  // UPI deep-link standard URI
  const upiTransactionNote = `Beat ${beat.title} - ${selectedTier.name}`;
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${selectedTier.priceINR}&cu=INR&tn=${encodeURIComponent(upiTransactionNote)}`;

  // Dynamic QR Code SVG generator using Google Chart API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  // Formatted Instagram DM message
  const formattedMessage = customNote.trim()
    ? `Yo Amit, I want to acquire ${beat.title} under the ${selectedTier.name} license. (${customNote.trim()})`
    : `Yo Amit, I want to acquire ${beat.title} under the ${selectedTier.name} license.`;

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
    const confirmationMsg = `Yo Amit, I paid ₹${selectedTier.priceINR} via UPI to ${UPI_ID} for "${beat.title}" (${selectedTier.name}). Reference/UPI: ${
      senderUpiOrRef.trim() || 'Payment completed'
    }. Please send untagged files.`;
    copyToClipboard(confirmationMsg, setCopiedTxnNote);
    setReceiptSubmitted(true);
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
                      className={`relative p-3.5 text-left border transition-all flex flex-col justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/30 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.25)]'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                      }`}
                    >
                      {tier.recommended && (
                        <span className="absolute -top-2.5 right-3 bg-red-600 text-white text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 font-bold shadow-sm">
                          Popular
                        </span>
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
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="font-mono text-lg sm:text-xl font-black text-white">
                            ₹{tier.priceINR.toLocaleString('en-IN')}
                          </span>
                          <span className="font-mono text-xs text-zinc-500">
                            ({tier.priceUSD})
                          </span>
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
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-red-500 font-bold">
                    ₹{selectedTier.priceINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-zinc-500 text-xs">/ {selectedTier.priceUSD}</span>
                </div>
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

            {/* Step 2: Payment Method Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-red-500" />
                  2. Choose Payment Method
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Instant UPI or Instagram DM
                </span>
              </div>

              {/* Method Switcher Tabs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 border flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-red-950/40 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-red-500" />
                  <span className="font-bold">Instant UPI (GPay / PhonePe / Paytm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('instagram')}
                  className={`p-3 border flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    paymentMethod === 'instagram'
                      ? 'bg-red-950/40 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span className="font-bold">Instagram DM / Custom</span>
                </button>
              </div>

              {/* UPI PAYMENT METHOD VIEW */}
              {paymentMethod === 'upi' && (
                <div className="bg-zinc-900/40 border border-zinc-800 p-4 sm:p-5 space-y-5">
                  <div className="flex flex-col md:flex-row items-center gap-5">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center bg-black border border-zinc-800 p-3 flex-shrink-0">
                      <div className="relative w-40 h-40 sm:w-44 sm:h-44 bg-white p-2">
                        {/* QR Code preview */}
                        <Image
                          src={qrCodeUrl}
                          alt="UPI QR Code"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest text-center flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-red-500" />
                        <span>Scan with any UPI app</span>
                      </div>
                    </div>

                    {/* UPI Details & Quick Pay Links */}
                    <div className="flex-1 w-full space-y-3 font-mono">
                      <div>
                        <div className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1">
                          Official UPI ID (Verified Merchant / Receiver)
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
                                <span className="text-emerald-400 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Copy UPI</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-black/60 border border-zinc-800/80 p-2.5">
                          <div className="text-zinc-500 text-[10px] uppercase tracking-widest">
                            Payable Amount
                          </div>
                          <div className="text-red-500 font-black text-base mt-0.5">
                            ₹{selectedTier.priceINR.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="bg-black/60 border border-zinc-800/80 p-2.5">
                          <div className="text-zinc-500 text-[10px] uppercase tracking-widest">
                            Transaction Note
                          </div>
                          <div className="text-zinc-200 text-xs truncate mt-0.5 font-bold">
                            {upiTransactionNote}
                          </div>
                        </div>
                      </div>

                      {/* Deep-link button for mobile devices */}
                      <a
                        href={upiDeepLink}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono text-xs font-black uppercase tracking-[0.18em] py-3 px-4 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.35)] transition-all cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Pay via Installed UPI App (GPay / PhonePe / Paytm)</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    </div>
                  </div>

                  {/* Payment Verification / Screenshot Confirmation Step */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Send className="w-3.5 h-3.5 text-red-500" />
                        Notify @amitdied to receive untagged files:
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Avg Delivery: &lt; 15 mins
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={senderUpiOrRef}
                        onChange={(e) => setSenderUpiOrRef(e.target.value)}
                        placeholder="Enter your UPI Ref ID / Transaction ID or UPI ID..."
                        className="bg-black border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-600 font-mono flex-1 focus:outline-none focus:border-red-600"
                      />
                      <button
                        type="button"
                        onClick={handleSendPaymentConfirmation}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-xs uppercase tracking-wider px-4 py-2 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        <span>Send Proof via DM</span>
                      </button>
                    </div>

                    {receiptSubmitted && (
                      <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          Payment details copied! Instagram DM opened. Send the message or screenshot to receive your download link instantly.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* INSTAGRAM DM DIRECT OPTION */}
              {paymentMethod === 'instagram' && (
                <div className="space-y-3 bg-zinc-900/40 border border-zinc-800 p-4">
                  <div className="relative bg-black/60 border border-zinc-800 p-4 font-mono text-sm text-zinc-200">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Direct Message Preview
                    </div>
                    <div className="text-white font-medium break-words select-all bg-zinc-950 p-3 border border-zinc-850 rounded-sm">
                      &ldquo;{formattedMessage}&rdquo;
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                        Add Note:
                      </span>
                      <input
                        type="text"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Optional (e.g. need stems today, international card, release date...)"
                        className="bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono w-full focus:outline-none focus:border-red-600"
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
                      <span>Instant DM to Buy</span>
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
                </div>
              )}
            </div>

            {/* Trust & Guarantee Info Footer */}
            <div className="border-t border-zinc-800/80 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-zinc-500">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>
                  UPI ID: <strong className="text-white">{UPI_ID}</strong> • Untagged WAV/MP3 delivery handled directly by @amitdied
                </span>
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
