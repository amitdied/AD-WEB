'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ArrowLeft, Shield, HardDrive, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { clearConnectCookie } from './actions';

export default function ConnectGoogleClient({
  initialRefreshToken,
  errorMessage,
}: {
  initialRefreshToken?: string | null;
  errorMessage?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Consume the cookie immediately on mount so it is shown only once
  useEffect(() => {
    if (initialRefreshToken) {
      clearConnectCookie().catch(() => {});
    }
  }, [initialRefreshToken]);

  const handleCopy = () => {
    if (!initialRefreshToken) return;
    navigator.clipboard.writeText(initialRefreshToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = '/api/auth/google/start?mode=connect';
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative selection:bg-red-500/30">
      <div className="absolute top-6 left-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin</span>
        </Link>
      </div>

      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800 shadow-inner">
            <HardDrive className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">
            Google Drive & Sheets Connection
          </h1>
          <p className="text-zinc-400 text-xs mt-1.5 max-w-sm">
            Generate an offline refresh token for persistent cloud uploads and spreadsheet synchronizations.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-left space-y-1">
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Connection Notice: {errorMessage}
            </div>
            <p className="text-xs text-red-300/80">
              Google did not return a refresh token. Click the button below to re-consent with offline access.
            </p>
          </div>
        )}

        {initialRefreshToken ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>One-Time Refresh Token Generated</span>
              </div>
              <p className="text-xs text-zinc-300 font-mono font-bold">
                Copy this into Vercel as GOOGLE_REFRESH_TOKEN
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  value={initialRefreshToken}
                  rows={3}
                  className="w-full bg-black/90 border border-zinc-700 rounded-lg p-3 text-xs font-mono text-zinc-200 select-all outline-none resize-none break-all"
                />
              </div>

              <button
                onClick={handleCopy}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Refresh Token'}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 text-center font-mono">
              The temporary cookie has now been deleted. Add this token in Vercel Project Settings &gt; Environment Variables.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 text-xs text-zinc-400 font-mono">
              <div className="text-zinc-200 font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Authorized Account: AMITDIED69@gmail.com</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Clicking the button will open Google OAuth consent screen with offline access. Once granted, your refresh token will be displayed once for you to add to Vercel.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Google Drive and Sheets'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
