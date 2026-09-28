'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Music,
  Video,
  Radio,
  LogOut,
  Settings,
  ExternalLink,
  ShieldCheck,
  Database,
  ArrowRight,
  Layers,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  sessionUserEmail: string;
  isDevAuth: boolean;
}

export default function AdminDashboardClient({ sessionUserEmail, isDevAuth }: Props) {
  const [stats, setStats] = useState({
    beatsCount: 0,
    videosCount: 0,
    cctvCount: 0,
  });
  const [systemReady, setSystemReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [beatsRes, vidsRes, cctvRes, configRes] = await Promise.all([
          fetch('/api/admin/beats').catch(() => null),
          fetch('/api/admin/portfolio').catch(() => null),
          fetch('/api/admin/cctv').catch(() => null),
          fetch('/api/admin/config-status').catch(() => null),
        ]);

        let bCount = 0;
        let vCount = 0;
        let cCount = 0;

        if (beatsRes && beatsRes.ok) {
          const bData = await beatsRes.json();
          bCount = Array.isArray(bData)
            ? bData.filter(
                (b: any) =>
                  String(b.is_published).toLowerCase() === 'true' ||
                  String(b.is_published) === '1'
              ).length
            : 0;
        }

        if (vidsRes && vidsRes.ok) {
          const vData = await vidsRes.json();
          vCount = Array.isArray(vData)
            ? vData.filter(
                (v: any) =>
                  String(v.is_published).toLowerCase() === 'true' ||
                  String(v.is_published) === '1'
              ).length
            : 0;
        }

        if (cctvRes && cctvRes.ok) {
          const cData = await cctvRes.json();
          cCount = Array.isArray(cData)
            ? cData.filter(
                (c: any) =>
                  String(c.is_published).toLowerCase() === 'true' ||
                  String(c.is_published) === '1'
              ).length
            : 0;
        }

        if (configRes && configRes.ok) {
          const cfg = await configRes.json();
          setSystemReady(cfg.summary?.allConfigured && cfg.summary?.allTabsDetected);
        }

        setStats({
          beatsCount: bCount,
          videosCount: vCount,
          cctvCount: cCount,
        });
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-red-500/30">
      {/* Top Admin Navigation Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="font-display font-black text-white text-lg tracking-tight uppercase">
            AMITDIED <span className="text-red-600">{'//'} CONTROL</span>
          </span>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <span className="hidden sm:inline text-[11px] font-mono text-zinc-400">
            PRIVATE CONTENT MANAGEMENT
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {/* User Email Pill */}
          <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[11px]">{sessionUserEmail}</span>
            {isDevAuth && (
              <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-800/80 px-1.5 py-0.2 rounded">
                DEV
              </span>
            )}
          </div>

          {/* Setup / Config Status Link */}
          <Link
            href="/admin/setup"
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">SETUP &amp; STATUS</span>
          </Link>

          {/* Visit Live Website */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">VIEW SITE</span>
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Hero Banner */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-red-500 uppercase tracking-widest mb-2 font-bold">
                <span>SURVEILLANCE NODE ONLINE</span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-400">GOOGLE DRIVE + SHEETS BACKEND</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white uppercase">
                AMITDIED CONTENT CONTROL
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-2 max-w-2xl leading-relaxed">
                Add, edit, and organize Beats, YouTube Portfolio Videos, and CCTV Feeds in real-time. Changes update the deployed website instantly without touching code or redeploying.
              </p>
            </div>

            {/* Quick Status Pill */}
            <Link
              href="/admin/setup"
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex items-center gap-3 shrink-0 transition-colors group"
            >
              {systemReady === false ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              <div className="font-mono text-xs">
                <div className="text-zinc-400 text-[10px] uppercase tracking-wider">
                  SYSTEM STATUS
                </div>
                <div className="text-white font-bold group-hover:text-red-400 transition-colors">
                  {systemReady === false ? 'Configuration Warning' : 'Database Ready'}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ml-2" />
            </Link>
          </div>
        </div>

        {/* 3 Main Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: BEATS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="group relative bg-zinc-950 border border-zinc-800/90 hover:border-red-600/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_35px_rgba(220,38,38,0.2)]"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
                  <Music className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  DRIVE AUDIO + SHEETS
                </span>
              </div>

              <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight">
                BEATS
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1.5 leading-relaxed">
                Upload MP3/WAV files to Google Drive, set BPM, genre, pricing, and tag metadata.
              </p>

              <div className="mt-6 pt-5 border-t border-zinc-900 flex items-baseline gap-2">
                <span className="text-4xl font-display font-black text-white">
                  {loading ? '...' : stats.beatsCount}
                </span>
                <span className="font-mono text-xs text-zinc-500 uppercase">
                  PUBLISHED BEATS
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/admin/beats"
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg group-hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              >
                <span>MANAGE BEATS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Section 2: PORTFOLIO */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-zinc-950 border border-zinc-800/90 hover:border-red-600/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_35px_rgba(220,38,38,0.2)]"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  YOUTUBE EMBED
                </span>
              </div>

              <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight">
                PORTFOLIO
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1.5 leading-relaxed">
                Paste YouTube video links. Auto-extracts video IDs, manages order, titles, and placement tags.
              </p>

              <div className="mt-6 pt-5 border-t border-zinc-900 flex items-baseline gap-2">
                <span className="text-4xl font-display font-black text-white">
                  {loading ? '...' : stats.videosCount}
                </span>
                <span className="font-mono text-xs text-zinc-500 uppercase">
                  PUBLISHED VIDEOS
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/admin/portfolio"
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg group-hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              >
                <span>MANAGE PORTFOLIO</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Section 3: CCTV FEED */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group relative bg-zinc-950 border border-zinc-800/90 hover:border-red-600/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_35px_rgba(220,38,38,0.2)]"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  MULTI-SOURCE NET
                </span>
              </div>

              <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight">
                CCTV FEED
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1.5 leading-relaxed">
                Curate YouTube BTS videos, documentary videos, or upload direct Drive videos and surveillance photos.
              </p>

              <div className="mt-6 pt-5 border-t border-zinc-900 flex items-baseline gap-2">
                <span className="text-4xl font-display font-black text-white">
                  {loading ? '...' : stats.cctvCount}
                </span>
                <span className="font-mono text-xs text-zinc-500 uppercase">
                  PUBLISHED ITEMS
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/admin/cctv"
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg group-hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              >
                <span>MANAGE CCTV</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Quick Help & Architecture Summary */}
        <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-6 font-mono text-xs text-zinc-400 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Layers className="w-4 h-4 text-red-500" />
            <span>ARCHITECTURAL GUIDELINES</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            • Audio and video media files are stored securely in Google Drive (<code className="text-zinc-200">AMITDIED BEATS/</code> and <code className="text-zinc-200">AMITDIED MEDIA/</code>).
            <br />
            • All database metadata, tags, and publish states reside in your Google Spreadsheet in the <code className="text-zinc-200">BEATS</code>, <code className="text-zinc-200">PORTFOLIO</code>, and <code className="text-zinc-200">CCTV</code> tabs.
            <br />
            • The public frontend reads directly from Google Sheets so updates are live instantly without redeploying.
          </p>
        </div>
      </main>
    </div>
  );
}
