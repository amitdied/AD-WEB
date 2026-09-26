'use client';

import { useActionState, useState } from 'react';
import { login } from '../actions';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(login, { error: '' as string });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative">
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
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-700">
            <Lock className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold">Admin Portal</h1>
          <p className="text-zinc-400 text-sm mt-2 text-center">Enter your administrator password to log in and manage beats and portfolio</p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                className="w-full bg-black border border-zinc-800 rounded-lg pl-4 pr-11 py-3 text-zinc-100 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                placeholder="Enter password (default: admin)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {state?.error && (
              <p className="text-red-500 text-sm mt-2">{state.error}</p>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              Default password: <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded font-mono">admin</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm font-bold"
          >
            {isPending ? 'Authenticating...' : 'Log In to Admin Panel'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
