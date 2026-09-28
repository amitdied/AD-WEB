'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const rawCode = searchParams.get('code') || searchParams.get('error');
  const rawDetail = searchParams.get('detail') || searchParams.get('attempted') || searchParams.get('message');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    window.location.href = '/api/auth/google/start';
  };

  // Derive normalized short safe reason code and description
  let errorCode: string | null = null;
  let errorDescription: string | null = null;

  if (rawCode) {
    if (rawCode === 'MISSING_ENV') {
      errorCode = 'MISSING_ENV';
      errorDescription = `Required environment variable is not configured: ${rawDetail || 'CONFIG'}`;
    } else if (rawCode === 'STATE_MISMATCH' || rawCode === 'csrf_validation_failed') {
      errorCode = 'STATE_MISMATCH';
      errorDescription = 'OAuth state/CSRF validation failed or login session expired. Please try signing in again.';
    } else if (rawCode === 'TOKEN_EXCHANGE_FAILED' || rawCode === 'token_exchange_failed') {
      errorCode = `TOKEN_EXCHANGE_FAILED${rawDetail ? ` (${rawDetail})` : ''}`;
      errorDescription = rawDetail
        ? `Google authorization error: ${rawDetail}. Verify client credentials and redirect URI.`
        : 'Google token exchange could not be completed. Please try again.';
    } else if (rawCode === 'EMAIL_NOT_ALLOWED' || rawCode === 'unauthorized_account') {
      errorCode = 'EMAIL_NOT_ALLOWED';
      errorDescription = `Account (${rawDetail || 'unauthorized'}) is not permitted. Only AMITDIED69@gmail.com may access the admin panel.`;
    } else if (rawCode === 'SESSION_FAILED' || rawCode === 'callback_error') {
      errorCode = 'SESSION_FAILED';
      errorDescription = 'Could not create or persist the admin session. Please try logging in again.';
    } else {
      errorCode = String(rawCode).toUpperCase().slice(0, 30);
      errorDescription = rawDetail
        ? `${rawCode}: ${rawDetail}`
        : `Authentication failed (${rawCode}). Please try again.`;
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative selection:bg-red-500/30">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10 text-center">
          <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800 shadow-inner">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            AMITDIED <span className="text-red-500">ADMIN</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-2 max-w-xs leading-relaxed">
            Restricted administrative system. Sign in with your authorized Google Account to manage beats, Drive assets, and Sheets database.
          </p>
        </div>

        {/* Dynamic Safe Reason Code Notification */}
        {errorCode && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-left space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Authentication Failure</span>
              </div>
              <span className="font-mono text-[10px] bg-red-900/60 text-red-200 border border-red-700/60 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                {errorCode}
              </span>
            </div>
            <p className="text-xs text-red-300/90 leading-relaxed font-mono">
              {errorDescription}
            </p>
          </div>
        )}

        {/* Security Policy Badge */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 mb-6 font-mono text-[11px] text-zinc-400 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-500 uppercase tracking-wider text-[10px]">
            <span>Security Policy</span>
            <span className="text-emerald-500 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              STRICT OAuth
            </span>
          </div>
          <div className="text-zinc-300">
            Authorized Email:{' '}
            <span className="text-red-400 font-bold">AMITDIED69@gmail.com</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            Server-side token verification with HTTP-only session cookies
          </div>
        </div>

        {/* Sign in with Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-red-500/10 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {isRedirecting ? (
            <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="text-sm font-bold tracking-tight">
            {isRedirecting ? 'Connecting to Google...' : 'Sign in with Google'}
          </span>
          {!isRedirecting && (
            <ArrowRight className="w-4 h-4 ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>

        <p className="text-[11px] text-zinc-500 text-center mt-6">
          Only the authorized producer email may access this panel. All login attempts are cryptographically verified.
        </p>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center font-mono text-xs">
          Loading login portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
