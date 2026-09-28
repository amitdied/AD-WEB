'use client';

import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from '../actions';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginContent() {
  const [state, formAction, isPending] = useActionState(login, { error: '' as string });
  const [showPassword, setShowPassword] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const attemptedEmail = searchParams.get('attempted');

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative font-sans">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Site</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-2xl relative"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-red-950/40 border border-red-800/80 rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-white uppercase">
            AMITDIED ADMIN
          </h1>
          <p className="text-zinc-400 text-xs mt-1 text-center font-mono">
            RESTRICTED CONTENT CONTROL SYSTEM
          </p>
        </div>

        {/* Error notification banner */}
        {errorParam && (
          <div className="mb-6 p-3.5 bg-red-950/50 border border-red-800/80 rounded-lg text-xs font-mono text-red-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              {errorParam === 'unauthorized' ? (
                <>
                  <p className="font-bold text-white">ACCESS DENIED</p>
                  <p className="text-red-400 mt-0.5">
                    Account {attemptedEmail ? `(${attemptedEmail})` : ''} is not authorized. Only the configured admin Google email has access.
                  </p>
                </>
              ) : errorParam === 'not_configured' ? (
                <>
                  <p className="font-bold text-white">OAUTH NOT CONFIGURED</p>
                  <p className="text-red-400 mt-0.5">
                    Google OAuth client credentials are not yet set in environment. Use developer login below to access configuration setup.
                  </p>
                </>
              ) : (
                <p>{errorParam}</p>
              )}
            </div>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="space-y-4">
          <a
            href="/api/auth/google/login"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold py-3 px-4 rounded-lg transition-all shadow-md active:scale-98"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Sign in with Google</span>
          </a>

          <p className="text-[11px] font-mono text-zinc-500 text-center">
            Private Admin Authorization • Google Drive & Sheets Access
          </p>
        </div>

        {/* Developer Password Fallback Toggle */}
        <div className="mt-8 pt-6 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => setShowDevLogin(!showDevLogin)}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 w-full text-center transition-colors underline underline-offset-4"
          >
            {showDevLogin ? 'Hide Password Fallback' : 'Developer / Emergency Password Login'}
          </button>

          {showDevLogin && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              action={formAction}
              className="mt-4 space-y-4 font-mono text-xs"
            >
              <div>
                <label className="block text-zinc-400 mb-1.5">Emergency Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="Enter password (default: admin)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {state?.error && (
                <p className="text-red-400 text-[11px]">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded uppercase tracking-wider text-xs transition-colors"
              >
                {isPending ? 'Verifying...' : 'Sign In With Password'}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}
