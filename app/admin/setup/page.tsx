'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Layers,
  Database,
  Shield,
  Folder,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ConfigItem {
  key: string;
  label: string;
  isConfigured: boolean;
  helpText: string;
  valueMasked?: string;
}

interface StatusData {
  adminSession: {
    email: string;
    isDevPasswordAuth: boolean;
  } | null;
  checks: ConfigItem[];
  summary: {
    isOAuthConfigured: boolean;
    isDriveConfigured: boolean;
    isSheetsConfigured: boolean;
    allConfigured: boolean;
    sheetConnected: boolean;
    sheetError: string | null;
    detectedTabs: string[];
    hasBeatsTab: boolean;
    hasPortfolioTab: boolean;
    hasCctvTab: boolean;
    allTabsDetected: boolean;
  };
}

export default function AdminSetupPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializingSheets, setInitializingSheets] = useState(false);
  const [initMessage, setInitMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/config-status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load config status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/config-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleInitSheets = async () => {
    setInitializingSheets(true);
    setInitMessage(null);
    try {
      const res = await fetch('/api/admin/init-sheets', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setInitMessage('✓ Successfully synchronized BEATS, PORTFOLIO, and CCTV tabs!');
        fetchStatus();
      } else {
        setInitMessage(`✗ ${json.error || 'Failed to initialize sheet tabs'}`);
      }
    } catch (e: any) {
      setInitMessage(`✗ Request failed: ${e.message}`);
    } finally {
      setInitializingSheets(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO CONTENT CONTROL</span>
          </Link>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>RE-CHECK STATUS</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-red-500" />
            <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight uppercase">
              AMITDIED SYSTEM CONFIGURATION STATUS
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Verification status of Google OAuth, Google Drive folders, and Google Sheets database.
          </p>
          {data?.adminSession && (
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className="text-zinc-500">Authenticated Admin:</span>
              <span className="text-white font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {data.adminSession.email}
              </span>
              {data.adminSession.isDevPasswordAuth && (
                <span className="text-amber-400 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
                  Emergency Password Auth
                </span>
              )}
            </div>
          )}
        </div>

        {/* 7-Point System Checklist */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-zinc-300">CORE SYSTEM REQUIREMENTS</span>
            <span className="text-zinc-500">7 VERIFICATION CHECKS</span>
          </div>

          <div className="divide-y divide-zinc-900">
            {/* 1. Google OAuth configured */}
            <div className="p-4 sm:p-5 flex items-start gap-4">
              {data?.summary.isOAuthConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-white">Google OAuth configured</h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      data?.summary.isOAuthConfigured
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80'
                        : 'bg-red-950/50 text-red-400 border border-red-800/80'
                    }`}
                  >
                    {data?.summary.isOAuthConfigured ? 'CONFIGURED' : 'ACTION NEEDED'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {data?.summary.isOAuthConfigured
                    ? 'Google OAuth 2.0 Web Client credentials and authorized admin email are set.'
                    : 'Provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from your Google Cloud Console OAuth 2.0 credentials.'}
                </p>
              </div>
            </div>

            {/* 2. Drive API configured */}
            <div className="p-4 sm:p-5 flex items-start gap-4">
              {data?.summary.isDriveConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-white">Drive API configured</h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      data?.summary.isDriveConfigured
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80'
                        : 'bg-red-950/50 text-red-400 border border-red-800/80'
                    }`}
                  >
                    {data?.summary.isDriveConfigured ? 'READY' : 'ACTION NEEDED'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {data?.summary.isDriveConfigured
                    ? 'Google Drive media upload pipelines and target folder IDs are connected.'
                    : 'Configure Google Drive folder IDs for AUDIO, COVERS, and MEDIA.'}
                </p>
              </div>
            </div>

            {/* 3. Audio folder configured */}
            <div className="p-4 sm:p-5 flex items-start gap-4">
              {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_AUDIO_FOLDER_ID')?.isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-white">
                    Audio folder configured (AMITDIED BEATS/AUDIO)
                  </h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_AUDIO_FOLDER_ID')?.isConfigured
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80'
                        : 'bg-red-950/50 text-red-400 border border-red-800/80'
                    }`}
                  >
                    {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_AUDIO_FOLDER_ID')?.isConfigured
                      ? 'CONFIGURED'
                      : 'MISSING'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_AUDIO_FOLDER_ID')?.helpText}
                </p>
              </div>
            </div>

            {/* 4. Covers folder configured */}
            <div className="p-4 sm:p-5 flex items-start gap-4">
              {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_COVERS_FOLDER_ID')?.isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-white">
                    Covers folder configured (AMITDIED BEATS/COVERS)
                  </h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_COVERS_FOLDER_ID')?.isConfigured
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80'
                        : 'bg-red-950/50 text-red-400 border border-red-800/80'
                    }`}
                  >
                    {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_COVERS_FOLDER_ID')?.isConfigured
                      ? 'CONFIGURED'
                      : 'MISSING'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_COVERS_FOLDER_ID')?.helpText}
                </p>
              </div>
            </div>

            {/* 5. Media folder configured */}
            <div className="p-4 sm:p-5 flex items-start gap-4">
              {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_MEDIA_FOLDER_ID')?.isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-white">
                    Media folder configured (AMITDIED MEDIA/CCTV)
                  </h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_MEDIA_FOLDER_ID')?.isConfigured
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80'
                        : 'bg-red-950/50 text-red-400 border border-red-800/80'
                    }`}
                  >
                    {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_MEDIA_FOLDER_ID')?.isConfigured
                      ? 'CONFIGURED'
                      : 'MISSING'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {data?.checks.find((c) => c.key === 'GOOGLE_DRIVE_MEDIA_FOLDER_ID')?.helpText}
                </p>
              </div>
            </div>

            {/* 6. Google Sheet configured */}
            <div className="p-4 sm:p-5 flex items-start gap-4">
              {data?.summary.isSheetsConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-white">Google Sheet configured</h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      data?.summary.isSheetsConfigured
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80'
                        : 'bg-red-950/50 text-red-400 border border-red-800/80'
                    }`}
                  >
                    {data?.summary.isSheetsConfigured ? 'CONFIGURED' : 'MISSING'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {data?.checks.find((c) => c.key === 'GOOGLE_SHEET_ID')?.helpText}
                </p>
              </div>
            </div>

            {/* 7. Sheet tabs detected */}
            <div className="p-4 sm:p-5 flex items-start gap-4">
              {data?.summary.allTabsDetected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-white">Sheet tabs detected</h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      data?.summary.allTabsDetected
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80'
                        : 'bg-amber-950/50 text-amber-400 border border-amber-800/80'
                    }`}
                  >
                    {data?.summary.allTabsDetected
                      ? 'ALL 3 TABS READY'
                      : data?.summary.sheetConnected
                      ? 'TABS MISSING'
                      : 'NOT DETECTED'}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-2 space-y-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span>• BEATS tab:</span>
                    <span className={data?.summary.hasBeatsTab ? 'text-emerald-400' : 'text-zinc-500'}>
                      {data?.summary.hasBeatsTab ? '✓ Detected' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>• PORTFOLIO tab:</span>
                    <span className={data?.summary.hasPortfolioTab ? 'text-emerald-400' : 'text-zinc-500'}>
                      {data?.summary.hasPortfolioTab ? '✓ Detected' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>• CCTV tab:</span>
                    <span className={data?.summary.hasCctvTab ? 'text-emerald-400' : 'text-zinc-500'}>
                      {data?.summary.hasCctvTab ? '✓ Detected' : '✗ Missing'}
                    </span>
                  </div>
                </div>

                {/* Auto Tab Creation Button */}
                {data?.summary.sheetConnected && !data?.summary.allTabsDetected && (
                  <div className="mt-3">
                    <button
                      onClick={handleInitSheets}
                      disabled={initializingSheets}
                      className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold px-4 py-2 rounded transition-colors"
                    >
                      {initializingSheets ? 'Creating Tabs...' : 'AUTO-CREATE MISSING SHEET TABS'}
                    </button>
                  </div>
                )}
                {initMessage && (
                  <p className="mt-2 text-xs font-mono text-amber-300">{initMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variable Reference Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 font-mono text-xs">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            <span>ENVIRONMENT VARIABLES CHECKLIST</span>
          </h2>
          <div className="space-y-3">
            {data?.checks.map((item) => (
              <div
                key={item.key}
                className="p-3 bg-zinc-900/60 rounded border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">{item.key}</span>
                    {item.isConfigured ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                        SET
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-400 bg-red-950/60 px-1.5 py-0.2 rounded border border-red-800">
                        MISSING
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 font-sans">{item.helpText}</p>
                </div>
                {item.valueMasked && (
                  <span className="text-[10px] text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800 shrink-0 font-mono">
                    {item.valueMasked}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
