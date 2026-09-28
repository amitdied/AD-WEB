'use client';

import React, { useState } from 'react';
import { X, Check, ShieldCheck, Download, FileText, Zap, Music, ArrowRight, Lock } from 'lucide-react';
import { Beat, LICENSE_TIERS, LicenseTier } from '@/lib/data';

interface LicenseModalProps {
  beat: Beat | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LicenseModal({ beat, isOpen, onClose }: LicenseModalProps) {
  const [selectedTier, setSelectedTier] = useState<LicenseTier>(LICENSE_TIERS[1]); // default to WAV
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [email, setEmail] = useState('');

  if (!isOpen || !beat) return null;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setIsPurchased(true);
    }, 1200);
  };

  const handleReset = () => {
    setIsPurchased(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={beat.coverUrl} 
              alt={beat.title} 
              className="w-12 h-12 rounded-lg object-cover border border-zinc-700" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-red-500 font-bold">Select License</span>
                <span className="text-zinc-600 text-xs">•</span>
                <span className="text-xs font-mono text-zinc-400">{beat.bpm} BPM // {beat.key}</span>
              </div>
              <h2 className="text-xl font-display font-black text-white">{beat.title}</h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {!isPurchased ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {LICENSE_TIERS.map((tier) => {
                const isSelected = selectedTier.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`cursor-pointer rounded-xl p-4 transition-all relative border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-950/20 border-red-500 shadow-lg shadow-red-950/50 ring-1 ring-red-500'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                    }`}
                  >
                    {tier.recommended && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <h4 className="font-display font-bold text-white text-base mb-1">{tier.name}</h4>
                      <div className="text-2xl font-black font-display text-red-400 mb-3">
                        ${tier.price}
                      </div>

                      <div className="space-y-2 text-xs text-zinc-300 font-mono mb-4 border-t border-zinc-800/80 pt-3">
                        <div className="text-[11px] text-zinc-400">
                          <strong className="text-zinc-200">Files:</strong> {tier.fileTypes[0]}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          <strong className="text-zinc-200">Streams:</strong> {tier.streamsLimit}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          <strong className="text-zinc-200">Videos:</strong> {tier.musicVideos}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {isSelected ? 'SELECTED' : 'SELECT'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected License Breakdown & Checkout Bar */}
            <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-mono uppercase text-zinc-400 tracking-wider">
                    Included with <span className="text-white font-bold">{selectedTier.name}</span>:
                  </h4>
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 font-mono">
                    {selectedTier.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shrink-0 md:text-right border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                  <div className="text-xs text-zinc-400 font-mono">TOTAL DUE</div>
                  <div className="text-3xl font-display font-black text-white">${selectedTier.price}</div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your artist email for instant download..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isCheckingOut}
                  className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isCheckingOut ? 'PROCESSING...' : `ACQUIRE LICENSE ($${selectedTier.price})`}</span>
                </button>
              </form>
              <p className="text-[11px] text-zinc-500 font-mono mt-2 text-center sm:text-left">
                🔒 Secure 256-bit checkout • Instant automatic delivery of untagged files & contract agreement.
              </p>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-500">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-red-500 tracking-widest font-bold">
                PAYMENT CONFIRMED & LICENSE ISSUED
              </span>
              <h3 className="text-2xl font-display font-black text-white">
                Thank you for producing with AMITDIED
              </h3>
              <p className="text-sm text-zinc-400 font-mono max-w-md mx-auto">
                A copy of your license receipt and uncompressed master files have been sent to{' '}
                <span className="text-zinc-200 underline">{email || 'your email'}</span>.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-md mx-auto text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                <span>Beat:</span>
                <span className="text-white font-bold">{beat.title}</span>
              </div>
              <div className="flex justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                <span>Tier:</span>
                <span className="text-red-400 font-bold">{selectedTier.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Contract ID:</span>
                <span className="text-zinc-300">AMT-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  alert(`Starting instant download for: ${beat.title} (${selectedTier.name} Master Files)`);
                }}
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD UNTAGGED FILES (.ZIP)</span>
              </button>

              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider"
              >
                DONE & RETURN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
