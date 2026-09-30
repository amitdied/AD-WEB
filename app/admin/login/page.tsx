'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err: any) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10 text-center">
          <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800 shadow-inner">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            AMITDIED <span className="text-red-500">ADMIN</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-2 max-w-xs leading-relaxed">
            Enter administrator password to access the dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-left flex items-center gap-2 text-red-300 text-xs font-mono">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 font-mono text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verifying...' : 'Login to Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
