"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Music,
  Video,
  LogOut,
  Plus,
  Trash2,
  Menu,
  X,
  Database,
  AlertTriangle,
  Pencil,
  ExternalLink,
  Radio,
  RefreshCw,
  FolderCheck,
  CheckCircle2,
  HardDrive,
  TableProperties,
  Upload,
  Eye,
  EyeOff,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { logout } from "./actions";
import {
  checkDbStatus,
  initializeDb,
  getCustomBeats,
  addBeat,
  updateBeat,
  deleteBeat,
  getCustomVideos,
  addVideo,
  updateVideo,
  toggleVideoVisibility,
  deleteVideo,
  uploadFile,
  getCustomTransmissions,
  addTransmission,
  updateTransmission,
  toggleTransmissionVisibility,
  deleteTransmission,
  syncWithGoogleSheet,
  getGoogleStatus,
} from "./data-actions";
import { uploadToSupabaseStorage, sanitizeStorageFilename } from "@/lib/supabase";
import { formatINR, parseBeatMp3Price, KEY_GROUPS } from "@/lib/utils";

type Tab = "songs" | "videos" | "cctv";

export default function AdminDashboardClient({ adminUser }: { adminUser?: any }) {
  const [activeTab, setActiveTab] = useState<Tab>("songs");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<any>(null);

  useEffect(() => {
    let active = true;
    checkDbStatus()
      .then((isInit) => {
        if (active) setIsDbInitialized(isInit);
      })
      .catch(() => {
        if (active) setIsDbInitialized(false);
      });

    getGoogleStatus()
      .then((status) => {
        if (active) setGoogleStatus(status);
      })
      .catch((err) => console.error("Error fetching Google status:", err));

    return () => {
      active = false;
    };
  }, []);

  const handleInitDb = async () => {
    setIsInitializing(true);
    try {
      await initializeDb();
      setIsDbInitialized(true);
      alert("Database and Google Sheet schema initialized successfully!");
    } catch (e: any) {
      alert("Failed to initialize database: " + (e?.message || "Unknown error"));
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSheetSync = async () => {
    setIsSyncingSheet(true);
    setSyncMessage(null);
    try {
      const result = await syncWithGoogleSheet();
      if (!result.ok) {
        alert("Google Sheet sync error: " + result.error);
        return;
      }
      setSyncMessage(result.message);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      alert("Google Sheet sync error: " + (err.message || "Unknown error"));
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const tabs = [
    {
      id: "songs" as Tab,
      label: "Beat Store",
      icon: <Music className="w-5 h-5" />,
    },
    {
      id: "videos" as Tab,
      label: "Portfolio Videos",
      icon: <Video className="w-5 h-5" />,
    },
    {
      id: "cctv" as Tab,
      label: "CCTV / Media Feeds",
      icon: <Radio className="w-5 h-5" />,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-red-500/30">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
        <div>
          <h1 className="text-lg font-display font-bold">AMITDIED Admin</h1>
          <span className="text-[10px] text-emerald-400 font-mono">Password Authenticated</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        fixed md:static inset-0 z-50 bg-zinc-950 border-r border-zinc-800 w-full md:w-72 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6 hidden md:block border-b border-zinc-900">
          <h1 className="text-2xl font-display font-bold tracking-tight text-white">
            AMITDIED <span className="text-red-600">ADMIN</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Google Drive & Sheets Studio Console
          </p>

          {/* Admin User Info */}
          <div className="mt-4 p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex items-center gap-3">
            {adminUser?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={adminUser.picture}
                alt="Admin Avatar"
                className="w-8 h-8 rounded-full border border-red-500/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 font-mono text-xs font-bold">
                AD
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                <span>{adminUser?.name || "AMITDIED"}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              </div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">
                {adminUser?.email || "AMITDIED69@gmail.com"}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu close button inside sidebar */}
        <div className="flex md:hidden justify-end p-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 py-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors text-xs font-medium group"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
              <span>View Public Website</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">↗</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm ${
                activeTab === tab.id
                  ? "bg-red-600/15 text-red-400 font-bold border border-red-600/30 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Google Integration Status Card */}
          <div className="mt-6 pt-4 border-t border-zinc-900 font-mono text-[11px] space-y-2.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-1 flex items-center justify-between">
              <span>Google Integrations</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYNCED
              </span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-2 text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <TableProperties className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Sheet</span>
                </span>
                <span className="text-[9px] text-zinc-500">BEATS • CCTV</span>
              </div>
              <div className="text-[9px] text-zinc-500 truncate" title={googleStatus?.sheetId || "1gnlLIweCywZ_5V__OLqGPNfDLjqKCB7Y1PHBQnfDBLA"}>
                ID: {googleStatus?.sheetId ? `${googleStatus.sheetId.slice(0, 12)}...` : "1gnlLIweCyw..."}
              </div>

              <div className="pt-1.5 border-t border-zinc-800/60 space-y-1">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Drive Folders</span>
                  </span>
                  <span className="text-[9px] text-emerald-400">3 CONNECTED</span>
                </div>
                <div className="text-[9px] text-zinc-500 space-y-0.5 pl-5">
                  <div>• AUDIO → Beat Audio</div>
                  <div>• COVERS → Beat Covers</div>
                  <div>• MEDIA → CCTV Video</div>
                </div>
              </div>

              <button
                onClick={handleSheetSync}
                disabled={isSyncingSheet}
                className="w-full mt-2 py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-[10px] font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-red-400 ${isSyncingSheet ? "animate-spin" : ""}`} />
                <span>{isSyncingSheet ? "Syncing..." : "Sync With Google Sheet"}</span>
              </button>

              {syncMessage && (
                <div className="text-[9px] text-emerald-400 leading-tight bg-emerald-950/40 p-1.5 rounded border border-emerald-900/60">
                  {syncMessage}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-900 space-y-2 bg-zinc-950">
          <button
            onClick={handleInitDb}
            disabled={isInitializing}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border transition-colors ${
              isDbInitialized
                ? "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                : "bg-yellow-950/30 border-yellow-800 text-yellow-400 hover:bg-yellow-900/40"
            }`}
            title="Re-synchronize and verify database"
          >
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbInitialized
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span>{isDbInitialized ? "DB Online" : "DB Missing"}</span>
            </span>
            <span className="text-[10px] text-zinc-500 underline hover:text-white">
              {isInitializing ? "Syncing..." : "Repair"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4 text-zinc-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-zinc-950/50 p-4 md:p-8">
        {!isDbInitialized && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-950/40 border border-yellow-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-yellow-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">
                  Database not initialized
                </h4>
                <p className="text-xs text-yellow-500/80">
                  Data/db.json does not exist. Click Initialize to seed your beats, portfolio, and Google Sheet schemas.
                </p>
              </div>
            </div>
            <button
              onClick={handleInitDb}
              disabled={isInitializing}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold text-xs rounded-lg transition-colors flex items-center space-x-2 flex-shrink-0"
            >
              <Database className="w-4 h-4" />
              <span>
                {isInitializing
                  ? "Initializing..."
                  : "Initialize Database"}
              </span>
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "songs" && <BeatsManager />}
            {activeTab === "videos" && <VideosManager />}
            {activeTab === "cctv" && <TransmissionsManager />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// BEATS MANAGER (AUDIO & COVERS UPLOAD TO DRIVE)
// ==========================================

function BeatsManager() {
  const [beats, setBeats] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit state
  const [editingBeat, setEditingBeat] = useState<any | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [newBeat, setNewBeat] = useState({
    title: "",
    producer: "AMITDIED",
    bpm: 120,
    key: "C Minor",
    genre: "Trap",
    moodTags: "",
    price: 799,
    coverUrl: "",
    audioUrl: "",
    buyLink: "",
    description: "",
  });

  const [isCustomPrice, setIsCustomPrice] = useState(false);
  const [customPriceValue, setCustomPriceValue] = useState("");
  const [isEditCustomPrice, setIsEditCustomPrice] = useState(false);
  const [editCustomPriceValue, setEditCustomPriceValue] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Supabase Storage Upload Progress and Status Tracking (0-100% per file)
  const [audioUploadProgress, setAudioUploadProgress] = useState<number>(0);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number>(0);
  const [audioUploadState, setAudioUploadState] = useState<'idle' | 'uploading' | 'complete' | 'failed'>('idle');
  const [coverUploadState, setCoverUploadState] = useState<'idle' | 'uploading' | 'complete' | 'failed'>('idle');
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [orphanedPaths, setOrphanedPaths] = useState<{ audioPath?: string; coverPath?: string } | null>(null);

  const loadBeats = useCallback(async () => {
    try {
      const data = await getCustomBeats();
      setBeats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCustomBeats()
      .then((data) => {
        if (active) {
          setBeats(data);
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadErrorMessage(null);
    setOrphanedPaths(null);

    if (!audioFile) {
      alert("Please select a beat audio file to upload.");
      return;
    }
    if (!coverFile) {
      alert("Please select a beat cover image to upload.");
      return;
    }

    setIsUploading(true);
    setAudioUploadProgress(0);
    setCoverUploadProgress(0);
    setAudioUploadState('uploading');
    setCoverUploadState('uploading');

    // 3. Unique file paths
    const uniqueId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const audioPath = `beats/${uniqueId}/audio-${sanitizeStorageFilename(audioFile.name)}`;
    const coverPath = `beats/${uniqueId}/cover-${sanitizeStorageFilename(coverFile.name)}`;

    let audioSuccess = false;
    let coverSuccess = false;
    let uploadFailReason = "";

    try {
      // 1 & 2. Upload audio and cover directly from client browser without converting to Node Buffers
      const [audioResult, coverResult] = await Promise.all([
        uploadToSupabaseStorage("audio", audioPath, audioFile, (pct) => {
          setAudioUploadProgress(pct);
        }),
        uploadToSupabaseStorage("covers", coverPath, coverFile, (pct) => {
          setCoverUploadProgress(pct);
        }),
      ]);

      if (audioResult.ok) {
        audioSuccess = true;
        setAudioUploadState('complete');
      } else {
        setAudioUploadState('failed');
        uploadFailReason += `Audio upload failed: ${audioResult.error || 'Unknown error'}. `;
      }

      if (coverResult.ok) {
        coverSuccess = true;
        setCoverUploadState('complete');
      } else {
        setCoverUploadState('failed');
        uploadFailReason += `Cover upload failed: ${coverResult.error || 'Unknown error'}. `;
      }

      // 11. If either upload fails, do NOT create the Firestore beat document.
      if (!audioSuccess || !coverSuccess) {
        setIsUploading(false);
        setUploadErrorMessage(uploadFailReason.trim());
        alert(`Upload failed! ${uploadFailReason.trim()}`);
        return;
      }

      // 8. Only create/save the Firestore beat metadata AFTER both files successfully upload.
      // 9. Save the Supabase storage paths in the beat metadata.
      // 10. Preserve the exact price entered by the admin.
      const safeAudioUrl = `/api/media/supabase?bucket=audio&path=${encodeURIComponent(audioPath)}`;
      const safeCoverUrl = `/api/media/supabase?bucket=covers&path=${encodeURIComponent(coverPath)}`;

      const beatPayload = {
        title: newBeat.title,
        producer: newBeat.producer || "AMITDIED",
        bpm: Number(newBeat.bpm) || 120,
        key: newBeat.key || "",
        genre: newBeat.genre || "Trap",
        moodTags: newBeat.moodTags,
        price: typeof newBeat.price === "number" ? newBeat.price : (parseFloat(String(newBeat.price)) || 0),
        buyLink: newBeat.buyLink || "",
        description: newBeat.description || "",
        audioUrl: safeAudioUrl,
        coverUrl: safeCoverUrl,
        audioStoragePath: audioPath,
        coverStoragePath: coverPath,
        storageProvider: "supabase",
        supabaseAudioBucket: "audio",
        supabaseCoversBucket: "covers",
      };

      const addRes = await addBeat(beatPayload);

      // 12. If Firestore saving fails after successful uploads, clearly show failure and return upload paths
      if (!addRes.ok) {
        const errorDetail = `Firestore metadata save failed: ${addRes.error}`;
        setOrphanedPaths({ audioPath, coverPath });
        setUploadErrorMessage(`${errorDetail} (Uploaded files: audio=${audioPath}, cover=${coverPath})`);
        alert(`Failed to save beat metadata to Firestore! \nUploaded Supabase paths:\nAudio: ${audioPath}\nCover: ${coverPath}\nError: ${addRes.error}`);
        setIsUploading(false);
        return;
      }

      const beatsAfter = await getCustomBeats();
      setBeats(beatsAfter);

      setIsAdding(false);
      setNewBeat({
        title: "",
        producer: "AMITDIED",
        bpm: 120,
        key: "C Minor",
        genre: "Trap",
        moodTags: "",
        price: 799,
        coverUrl: "",
        audioUrl: "",
        buyLink: "",
        description: "",
      });
      setIsCustomPrice(false);
      setCustomPriceValue("");
      setCoverFile(null);
      setAudioFile(null);
      setAudioUploadProgress(0);
      setCoverUploadProgress(0);
      setAudioUploadState('idle');
      setCoverUploadState('idle');
      setUploadErrorMessage(null);
      setOrphanedPaths(null);
      alert("Beat successfully uploaded to Supabase Storage and saved to database!");
    } catch (error: any) {
      console.error("Upload failed", error);
      const errMsg = error?.message || "Unknown error during upload process";
      setUploadErrorMessage(errMsg);
      if (audioSuccess || coverSuccess) {
        setOrphanedPaths({
          audioPath: audioSuccess ? audioPath : undefined,
          coverPath: coverSuccess ? coverPath : undefined,
        });
      }
      alert("Upload failed: " + errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const startEdit = (beat: any) => {
    const rawPrice = parseBeatMp3Price(beat.price);
    const isPreset = [799, 999, 2999, 5999].includes(rawPrice);
    setEditingBeat({
      ...beat,
      price: rawPrice,
      key: beat.key || "C Minor",
      moodTags: Array.isArray(beat.moodTags) ? beat.moodTags.join(", ") : beat.moodTags || "",
    });
    setIsEditCustomPrice(!isPreset);
    setEditCustomPriceValue(!isPreset ? String(rawPrice) : "");
    setEditCoverFile(null);
    setEditAudioFile(null);
    setIsAdding(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeat) return;
    setIsUpdating(true);

    let coverUrl = editingBeat.coverUrl;
    let audioUrl = editingBeat.audioUrl;
    let coverStoragePath = editingBeat.coverStoragePath;
    let audioStoragePath = editingBeat.audioStoragePath;

    try {
      // Upload replace cover to Supabase COVERS bucket
      if (editCoverFile) {
        const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
        const coverPath = `beats/${uniqueId}/cover-${sanitizeStorageFilename(editCoverFile.name)}`;
        const coverRes = await uploadToSupabaseStorage("covers", coverPath, editCoverFile);
        if (!coverRes.ok) {
          alert("Failed to update cover: " + coverRes.error);
          setIsUpdating(false);
          return;
        }
        coverUrl = `/api/media/supabase?bucket=covers&path=${encodeURIComponent(coverPath)}`;
        coverStoragePath = coverPath;
      }

      // Upload replace audio to Supabase AUDIO bucket
      if (editAudioFile) {
        const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
        const audioPath = `beats/${uniqueId}/audio-${sanitizeStorageFilename(editAudioFile.name)}`;
        const audioRes = await uploadToSupabaseStorage("audio", audioPath, editAudioFile);
        if (!audioRes.ok) {
          alert("Failed to update audio: " + audioRes.error);
          setIsUpdating(false);
          return;
        }
        audioUrl = `/api/media/supabase?bucket=audio&path=${encodeURIComponent(audioPath)}`;
        audioStoragePath = audioPath;
      }

      const updateRes = await updateBeat(editingBeat.id, {
        ...editingBeat,
        coverUrl,
        audioUrl,
        coverStoragePath,
        audioStoragePath,
        storageProvider: (coverStoragePath || audioStoragePath) ? "supabase" : editingBeat.storageProvider,
      });
      if (!updateRes.ok) {
        alert("Failed to update beat: " + updateRes.error);
        setIsUpdating(false);
        return;
      }

      const updated = await getCustomBeats();
      setBeats(updated);
      setEditingBeat(null);
      alert("Beat updated successfully!");
    } catch (error: any) {
      console.error("Update failed", error);
      alert("Failed to update beat: " + (error.message || "Unknown error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, e?: any) => {
    if (e) e.preventDefault();
    if (!confirm("Are you sure you want to delete this beat from the store & Google Sheet?")) return;
    try {
      const deleteRes = await deleteBeat(id);
      if (!deleteRes.ok) {
        alert("Failed to delete beat: " + deleteRes.error);
        return;
      }
      const updatedBeats = await getCustomBeats();
      setBeats(updatedBeats);
      if (editingBeat?.id === id) setEditingBeat(null);
      alert("Beat deleted from DB and Google Sheet.");
    } catch (err: any) {
      alert("Failed to delete beat: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Store Beats</span>
            <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded font-mono">
              {beats.length} TRACKS
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Synced with Google Sheet <code className="text-zinc-300">BEATS</code> tab & Drive Folders (AUDIO & COVERS)
          </p>
        </div>
        {!isAdding && !editingBeat && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Beat</span>
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editingBeat && (
        <form
          onSubmit={handleUpdate}
          className="bg-zinc-950 p-6 rounded-2xl border border-red-600/40 space-y-4 text-sm shadow-2xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Pencil className="w-4 h-4 text-red-500" />
              <span>Editing: <strong className="text-red-400">{editingBeat.title}</strong></span>
            </h4>
            <button
              type="button"
              onClick={() => setEditingBeat(null)}
              className="text-zinc-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Beat Title</label>
              <input
                required
                type="text"
                value={editingBeat.title}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, title: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Producer Name</label>
              <input
                type="text"
                value={editingBeat.producer || ""}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, producer: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">BPM</label>
              <input
                required
                type="number"
                value={editingBeat.bpm}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, bpm: Number(e.target.value) })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Key</label>
              <select
                value={editingBeat.key || "No Key"}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, key: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-red-600 outline-none font-mono text-xs cursor-pointer"
              >
                <option value="No Key">No Key / N/A</option>
                <optgroup label="MAJOR">
                  {KEY_GROUPS[0].keys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </optgroup>
                <optgroup label="MINOR">
                  {KEY_GROUPS[1].keys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">
                MP3 / BASE PRICE (₹)
              </label>
              <select
                value={isEditCustomPrice ? "custom" : String(editingBeat.price)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setIsEditCustomPrice(true);
                    const parsed = parseInt(editCustomPriceValue, 10) || 799;
                    setEditingBeat({ ...editingBeat, price: parsed });
                  } else {
                    setIsEditCustomPrice(false);
                    const num = Number(val);
                    setEditingBeat({ ...editingBeat, price: num });
                  }
                }}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-red-600 outline-none font-mono text-xs cursor-pointer"
              >
                <option value="799">₹799</option>
                <option value="999">₹999</option>
                <option value="2999">₹2,999</option>
                <option value="5999">₹5,999</option>
                <option value="custom">Custom</option>
              </select>

              {isEditCustomPrice && (
                <div className="mt-2">
                  <label className="block text-zinc-500 mb-1 text-[10px] uppercase tracking-wider font-mono">
                    CUSTOM PRICE (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">₹</span>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 1499"
                      value={editCustomPriceValue}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setEditCustomPriceValue(raw);
                        const parsed = parseInt(raw, 10);
                        if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
                          setEditingBeat({ ...editingBeat, price: parsed });
                        }
                      }}
                      className="w-full bg-black border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-white focus:border-red-600 outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {Number(editingBeat.price) > 999 && (
                <p className="mt-1.5 text-[10px] text-amber-400 font-mono leading-tight">
                  NOTE: MP3 price is higher than the standard WAV license price.
                </p>
              )}
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Genre</label>
              <input
                required
                type="text"
                value={editingBeat.genre}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, genre: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Mood Tags (comma separated)</label>
            <input
              type="text"
              value={editingBeat.moodTags}
              onChange={(e) =>
                setEditingBeat({ ...editingBeat, moodTags: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <label className="block text-zinc-300 mb-1.5 text-xs font-semibold flex items-center justify-between">
                <span>Replace Cover Image</span>
                <span className="text-[10px] text-blue-400 font-mono">→ DRIVE COVERS FOLDER</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:bg-red-600/20 file:text-red-400 font-mono text-xs cursor-pointer"
              />
            </div>
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <label className="block text-zinc-300 mb-1.5 text-xs font-semibold flex items-center justify-between">
                <span>Replace Beat Audio</span>
                <span className="text-[10px] text-blue-400 font-mono">→ DRIVE AUDIO FOLDER</span>
              </label>
              <input
                type="file"
                accept=".mp3,audio/mpeg,.wav,audio/wav"
                onChange={(e) => setEditAudioFile(e.target.files?.[0] || null)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:bg-red-600/20 file:text-red-400 font-mono text-xs cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Buy / Checkout Link (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={editingBeat.buyLink || ""}
              onChange={(e) =>
                setEditingBeat({ ...editingBeat, buyLink: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Description (Optional)</label>
            <textarea
              value={editingBeat.description || ""}
              onChange={(e) =>
                setEditingBeat({ ...editingBeat, description: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white h-20 focus:border-red-600 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingBeat(null)}
              className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors shadow-lg"
            >
              {isUpdating ? "Saving to Drive & Sheets..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Beats List */}
      <div className="space-y-3">
        {beats.map((beat) => (
          <div
            key={beat.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              {beat.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={beat.coverUrl}
                  alt={beat.title}
                  className="w-14 h-14 rounded-lg object-cover border border-zinc-800 flex-shrink-0 bg-zinc-950"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-cover.png";
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-600">
                  <Music className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white truncate">{beat.title}</h4>
                  <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded font-mono font-semibold">
                    {formatINR(beat.price)}
                  </span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                    {beat.genre || "Trap"}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {beat.bpm} BPM {beat.key ? `• ${beat.key}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400 flex-wrap">
                  {beat.producer && <span>Prod. {beat.producer}</span>}
                  <span className="flex items-center gap-1 font-mono">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        beat.audioUrl ? "bg-emerald-500" : "bg-zinc-600"
                      }`}
                    />
                    {beat.audioUrl ? "Audio Ready" : "No Audio"}
                  </span>
                  {beat.coverUrl?.includes("/api/drive") && (
                    <span className="text-[10px] bg-blue-950/60 text-blue-400 border border-blue-900/60 px-1.5 py-0.2 rounded font-mono">
                      Drive Asset
                    </span>
                  )}
                  {beat.buyLink && (
                    <a
                      href={beat.buyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-red-400 underline truncate max-w-[150px]"
                    >
                      Buy Link
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => startEdit(beat)}
                className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Edit Beat"
              >
                <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(beat.id, e)}
                className="p-2 text-red-500 hover:text-red-400 bg-red-950/30 hover:bg-red-900/50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Delete Beat"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Beat Form */}
      {isAdding ? (
        <form
          onSubmit={handleAdd}
          className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4 text-sm shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              <span>Add New Store Beat (Supabase Storage)</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Beat Title</label>
              <input
                required
                type="text"
                placeholder="Title"
                value={newBeat.title}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, title: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Producer Name</label>
              <input
                type="text"
                placeholder="Producer"
                value={newBeat.producer}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, producer: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">BPM</label>
              <input
                required
                type="number"
                placeholder="120"
                value={newBeat.bpm}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, bpm: Number(e.target.value) })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Key</label>
              <select
                value={newBeat.key || "C Minor"}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, key: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-red-600 outline-none font-mono text-xs cursor-pointer"
              >
                <option value="No Key">No Key / N/A</option>
                <optgroup label="MAJOR">
                  {KEY_GROUPS[0].keys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </optgroup>
                <optgroup label="MINOR">
                  {KEY_GROUPS[1].keys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">
                MP3 / BASE PRICE (₹)
              </label>
              <select
                value={isCustomPrice ? "custom" : String(newBeat.price)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setIsCustomPrice(true);
                    const parsed = parseInt(customPriceValue, 10) || 799;
                    setNewBeat({ ...newBeat, price: parsed });
                  } else {
                    setIsCustomPrice(false);
                    const num = Number(val);
                    setNewBeat({ ...newBeat, price: num });
                  }
                }}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-red-600 outline-none font-mono text-xs cursor-pointer"
              >
                <option value="799">₹799</option>
                <option value="999">₹999</option>
                <option value="2999">₹2,999</option>
                <option value="5999">₹5,999</option>
                <option value="custom">Custom</option>
              </select>

              {isCustomPrice && (
                <div className="mt-2">
                  <label className="block text-zinc-500 mb-1 text-[10px] uppercase tracking-wider font-mono">
                    CUSTOM PRICE (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">₹</span>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 1499"
                      value={customPriceValue}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setCustomPriceValue(raw);
                        const parsed = parseInt(raw, 10);
                        if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
                          setNewBeat({ ...newBeat, price: parsed });
                        }
                      }}
                      className="w-full bg-black border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-white focus:border-red-600 outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {Number(newBeat.price) > 999 && (
                <p className="mt-1.5 text-[10px] text-amber-400 font-mono leading-tight">
                  NOTE: MP3 price is higher than the standard WAV license price.
                </p>
              )}
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Genre</label>
              <input
                required
                type="text"
                placeholder="Trap / Rage / Drill"
                value={newBeat.genre}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, genre: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">
              Mood Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="Dark, Energetic, Bouncy..."
              value={newBeat.moodTags}
              onChange={(e) =>
                setNewBeat({ ...newBeat, moodTags: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <label className="block text-zinc-300 mb-1.5 text-xs font-semibold flex items-center justify-between">
                <span>Cover Image (jpg, png, webp)</span>
                <span className="text-[10px] text-emerald-400 font-mono">→ SUPABASE COVERS BUCKET</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setCoverFile(e.target.files?.[0] || null);
                  setCoverUploadProgress(0);
                  setCoverUploadState('idle');
                }}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:bg-red-600/20 file:text-red-400 font-mono text-xs cursor-pointer"
              />
            </div>
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
              <label className="block text-zinc-300 mb-1.5 text-xs font-semibold flex items-center justify-between">
                <span>Beat Audio (mp3, wav)</span>
                <span className="text-[10px] text-emerald-400 font-mono">→ SUPABASE AUDIO BUCKET</span>
              </label>
              <input
                type="file"
                accept=".mp3,audio/mpeg,.wav,audio/wav"
                onChange={(e) => {
                  setAudioFile(e.target.files?.[0] || null);
                  setAudioUploadProgress(0);
                  setAudioUploadState('idle');
                }}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:bg-red-600/20 file:text-red-400 font-mono text-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Supabase Storage Upload Progress & Status */}
          {(isUploading || audioUploadState !== 'idle' || coverUploadState !== 'idle' || uploadErrorMessage) && (
            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                <span>Supabase Storage Progress</span>
                {isUploading && <span className="text-red-400 animate-pulse">Uploading in progress...</span>}
              </div>

              {/* Cover Upload Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-zinc-300 text-xs">
                  <span className="flex items-center gap-2">
                    <span>Cover Image:</span>
                    {coverUploadState === 'uploading' && <span className="text-yellow-400">Uploading ({coverUploadProgress}%)</span>}
                    {coverUploadState === 'complete' && <span className="text-emerald-400 font-semibold">Upload complete ✓</span>}
                    {coverUploadState === 'failed' && <span className="text-red-400 font-semibold">Upload failed ✗</span>}
                  </span>
                  <span className="font-bold text-zinc-200">{coverUploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-200 ${
                      coverUploadState === 'failed'
                        ? 'bg-red-600'
                        : coverUploadState === 'complete'
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${coverUploadProgress}%` }}
                  />
                </div>
              </div>

              {/* Audio Upload Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-zinc-300 text-xs">
                  <span className="flex items-center gap-2">
                    <span>Beat Audio:</span>
                    {audioUploadState === 'uploading' && <span className="text-yellow-400">Uploading ({audioUploadProgress}%)</span>}
                    {audioUploadState === 'complete' && <span className="text-emerald-400 font-semibold">Upload complete ✓</span>}
                    {audioUploadState === 'failed' && <span className="text-red-400 font-semibold">Upload failed ✗</span>}
                  </span>
                  <span className="font-bold text-zinc-200">{audioUploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-200 ${
                      audioUploadState === 'failed'
                        ? 'bg-red-600'
                        : audioUploadState === 'complete'
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${audioUploadProgress}%` }}
                  />
                </div>
              </div>

              {/* Error and Orphaned Paths */}
              {uploadErrorMessage && (
                <div className="p-2.5 bg-red-950/60 border border-red-900 rounded-lg text-red-300 text-xs">
                  <div className="font-bold mb-0.5">Upload / Save Error:</div>
                  <div>{uploadErrorMessage}</div>
                  {orphanedPaths && (
                    <div className="mt-2 text-[10px] text-zinc-400 border-t border-red-900/60 pt-1.5 space-y-0.5">
                      <div className="font-semibold text-yellow-400">Orphaned files in Supabase:</div>
                      {orphanedPaths.coverPath && <div>• Cover: {orphanedPaths.coverPath}</div>}
                      {orphanedPaths.audioPath && <div>• Audio: {orphanedPaths.audioPath}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Buy Link</label>
            <input
              type="url"
              placeholder="https://..."
              value={newBeat.buyLink}
              onChange={(e) =>
                setNewBeat({ ...newBeat, buyLink: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-xs uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Beat description..."
              value={newBeat.description}
              onChange={(e) =>
                setNewBeat({ ...newBeat, description: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white h-24 focus:border-red-600 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors shadow-lg"
            >
              {isUploading ? "Uploading to Supabase..." : "Save Beat"}
            </button>
          </div>
        </form>
      ) : (
        !editingBeat && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-zinc-800 hover:border-red-600/50 text-zinc-500 hover:text-white rounded-2xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5 text-red-500" />
            <span>Add New Store Beat</span>
          </button>
        )
      )}
    </div>
  );
}

// ==========================================
// PORTFOLIO VIDEOS MANAGER (SUPABASE portfolio_items)
// ==========================================

function VideosManager() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ url: "", title: "", description: "" });
  const [actionError, setActionError] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    try {
      const data = await getCustomVideos(true);
      setVideos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error loading portfolio videos:", err);
      setActionError(err?.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const resetForm = () => {
    setForm({ url: "", title: "", description: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!form.url.trim()) {
      setActionError("Please paste a YouTube URL");
      return;
    }
    setSaving(true);
    try {
      const res = await addVideo({
        url: form.url.trim(),
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      resetForm();
      await loadVideos();
    } catch (err: any) {
      setActionError(err?.message || "Failed to add video");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setActionError(null);
    setSaving(true);
    try {
      const res = await updateVideo(editingId, {
        url: form.url.trim() || undefined,
        title: form.title,
        description: form.description,
      });
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      resetForm();
      await loadVideos();
    } catch (err: any) {
      setActionError(err?.message || "Failed to update video");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisible = async (id: string, current: boolean) => {
    setActionError(null);
    setBusyId(id);

    // Optimistic UI — instant change
    const nextVisible = !current;
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, visible: nextVisible } : v))
    );

    try {
      const res = await toggleVideoVisibility(id, nextVisible);
      if (!res.ok) {
        // Revert on failure
        setVideos((prev) =>
          prev.map((v) => (v.id === id ? { ...v, visible: current } : v))
        );
        setActionError(res.error || "Hide/Show failed");
        return;
      }
      // Confirm from server
      await loadVideos();
    } catch (err: any) {
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, visible: current } : v))
      );
      setActionError(err?.message || "Hide/Show failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video from portfolio? This cannot be undone.")) return;

    setActionError(null);
    setBusyId(id);

    // Optimistic remove
    const snapshot = videos;
    setVideos((prev) => prev.filter((v) => v.id !== id));

    try {
      const res = await deleteVideo(id);
      if (!res.ok) {
        setVideos(snapshot); // revert
        setActionError(res.error || "Delete failed");
        return;
      }
      await loadVideos();
    } catch (err: any) {
      setVideos(snapshot);
      setActionError(err?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (video: any) => {
    setEditingId(video.id);
    setIsAdding(false);
    setActionError(null);
    setForm({
      url: video.url || video.youtubeUrl || "",
      title: video.title || "",
      description: video.description || "",
    });
  };

  const getYtId = (video: any) => {
    if (video.youtubeId) return video.youtubeId;
    const url = video.url || "";
    const m = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    return m?.[1] || video.id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Portfolio YouTube Videos</span>
            <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded font-mono">
              {videos.length} VIDEOS
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Source: Supabase <code className="text-zinc-300">portfolio_items</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              loadVideos();
            }}
            className="inline-flex items-center gap-2 px-3 py-2 border border-zinc-700 text-zinc-400 hover:text-white text-xs uppercase tracking-wider rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
              setActionError(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/40 hover:bg-red-600/30 text-red-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs font-mono">
          {actionError}
        </div>
      )}

      {(isAdding || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleAdd}
          className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3"
        >
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            {editingId ? `Edit ${editingId}` : "Add YouTube Video"}
          </div>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-red-600"
            required
          />
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title (optional)"
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-red-600"
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-red-600"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Video"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-zinc-700 text-zinc-400 text-xs uppercase tracking-wider rounded hover:border-zinc-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs animate-pulse">
          Loading portfolio_items...
        </div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs">
          No videos found in portfolio_items.
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video, index) => {
            const ytId = getYtId(video);
            const ytUrl = video.url || `https://www.youtube.com/watch?v=${ytId}`;
            const isBusy = busyId === video.id;
            return (
              <div
                key={video.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border transition-colors ${
                  video.visible === false
                    ? "border-zinc-800 opacity-60"
                    : "border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-zinc-800 flex-shrink-0 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                      alt={video.title || "Thumbnail"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/80 px-1 rounded text-[9px] font-mono text-zinc-300">
                      #{String(video.order_index || index + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-white text-sm truncate">
                        {video.title || `Video ${video.order_index || index + 1}`}
                      </h4>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 rounded font-mono">
                        {video.id}
                      </span>
                      {video.visible === false && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700 px-1.5 rounded font-mono">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <a
                      href={ytUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-zinc-400 hover:text-red-400 truncate flex items-center gap-1.5"
                    >
                      <span className="truncate">{ytUrl}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    disabled={isBusy}
                    onClick={() => handleToggleVisible(video.id, video.visible !== false)}
                    className="p-2 border border-zinc-700 rounded hover:border-zinc-500 text-zinc-400 hover:text-white disabled:opacity-40"
                    title={video.visible === false ? "Show" : "Hide"}
                  >
                    {video.visible === false ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => startEdit(video)}
                    className="p-2 border border-zinc-700 rounded hover:border-zinc-500 text-zinc-400 hover:text-white disabled:opacity-40"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => handleDelete(video.id)}
                    className="p-2 border border-zinc-700 rounded hover:border-red-600 text-zinc-400 hover:text-red-400 disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Small client helper (same regex as server)
function extractYouTubeIdClient(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match?.[1] || null;
}

// ==========================================
// CCTV TRANSMISSIONS & MEDIA (DRIVE MEDIA UPLOAD + SHEETS)
// ==========================================

function TransmissionsManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<"instagram" | "video">("video");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "saving" | "saved" | "failed">("idle");

  const [form, setForm] = useState({
    url: "",
    title: "",
    label: "",
    location: "",
    snippet: "",
    status: "ONLINE",
  });

  const loadData = useCallback(async () => {
    try {
      const data = await getCustomTransmissions(true);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load CCTV:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({
      url: "",
      title: "",
      label: "",
      location: "",
      snippet: "",
      status: "ONLINE",
    });
    setMediaFile(null);
    setVideoUploadProgress(null);
    setUploadStatus("idle");
    setIsAdding(false);
    setActionError(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      let finalUrl = form.url.trim();

      // Custom video upload to Supabase Storage bucket 'cctv'
      if (addType === "video" && mediaFile) {
        setUploadStatus("uploading");
        setVideoUploadProgress(0);

        const uniqueId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const storagePath = `cctv/${uniqueId}/video-${sanitizeStorageFilename(mediaFile.name)}`;

        const uploadRes = await uploadToSupabaseStorage("cctv", storagePath, mediaFile, (pct) => {
          setVideoUploadProgress(pct);
        });

        if (!uploadRes.ok) {
          setUploadStatus("failed");
          setActionError(`Supabase Storage upload failed: ${uploadRes.error || "Unknown upload error"}`);
          setSaving(false);
          return;
        }

        setUploadStatus("uploaded");
        setVideoUploadProgress(100);

        // Safe URL for video streaming
        finalUrl = `/api/media/supabase?bucket=cctv&path=${encodeURIComponent(storagePath)}`;
      }

      if (!finalUrl) {
        setActionError("Please select a video file to upload or enter a valid URL.");
        setSaving(false);
        return;
      }

      setUploadStatus("saving");
      const res = await addTransmission({
        type: addType,
        url: finalUrl,
        title: form.title.trim() || (mediaFile ? mediaFile.name.replace(/\.[^/.]+$/, "") : undefined),
        label: form.label.trim() || undefined,
        location: form.location.trim() || undefined,
        snippet: form.snippet.trim() || undefined,
        status: form.status.trim() || "ONLINE",
      });

      if (!res.ok) {
        setUploadStatus("failed");
        setActionError(`Failed to save CCTV metadata to cctv_items: ${res.error}`);
        setSaving(false);
        return;
      }

      setUploadStatus("saved");
      setSuccessMessage("CCTV VIDEO SAVED SUCCESSFULLY");
      setTimeout(() => setSuccessMessage(null), 6000);
      resetForm();
      await loadData();
    } catch (err: any) {
      setUploadStatus("failed");
      setActionError(err?.message || "Failed to add CCTV video");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setBusyId(id);
    setActionError(null);
    const next = !current;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, visible: next } : x)));

    try {
      const res = await toggleTransmissionVisibility(id, next);
      if (!res.ok) {
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, visible: current } : x)));
        setActionError(res.error);
        return;
      }
      await loadData();
    } catch (err: any) {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, visible: current } : x)));
      setActionError(err?.message || "Toggle failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this CCTV item permanently?")) return;
    setBusyId(id);
    setActionError(null);
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== id));

    try {
      const res = await deleteTransmission(id);
      if (!res.ok) {
        setItems(snapshot);
        setActionError(res.error);
        return;
      }
      await loadData();
    } catch (err: any) {
      setItems(snapshot);
      setActionError(err?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            <span>CCTV Feed</span>
            <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded font-mono">
              {items.length} FEEDS
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Source: Supabase <code className="text-zinc-300">cctv_items</code> & Storage bucket <code className="text-zinc-300">cctv</code>
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/40 hover:bg-red-600/30 text-red-400 text-xs font-bold uppercase tracking-wider rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add Feed
        </button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs font-mono">
          {actionError}
        </div>
      )}

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 font-mono text-xs shadow-2xl"
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddType("video")}
              className={`px-3 py-2 rounded border text-[10px] uppercase tracking-wider ${
                addType === "video"
                  ? "border-red-600 text-red-400 bg-red-950/30"
                  : "border-zinc-700 text-zinc-500"
              }`}
            >
              Custom Video (Supabase Storage: cctv)
            </button>
            <button
              type="button"
              onClick={() => setAddType("instagram")}
              className={`px-3 py-2 rounded border text-[10px] uppercase tracking-wider ${
                addType === "instagram"
                  ? "border-red-600 text-red-400 bg-red-950/30"
                  : "border-zinc-700 text-zinc-500"
              }`}
            >
              Instagram Link
            </button>
          </div>

          {addType === "video" ? (
            <div className="space-y-3 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              <label className="block text-zinc-300 font-semibold flex items-center justify-between">
                <span>Select MP4 / Video File</span>
                <span className="text-[10px] text-red-400 font-mono">→ SUPABASE BUCKET: cctv</span>
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600/20 file:text-red-400 hover:file:bg-red-600/30 cursor-pointer"
              />

              {videoUploadProgress !== null && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">
                      {videoUploadProgress < 100
                        ? `Uploading CCTV video... ${videoUploadProgress}%`
                        : "CCTV VIDEO UPLOADED"}
                    </span>
                    <span className="text-white font-bold">{videoUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-600 h-full transition-all duration-150"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-1">
                <label className="block text-zinc-500 text-[10px] mb-1">Or Direct Video URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://... (optional if file selected above)"
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
                />
              </div>
            </div>
          ) : (
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://www.instagram.com/p/... or /reel/..."
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
            />
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="CAM_01"
              className="bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
            />
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="STUDIO_UNDERGROUND"
              className="bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
            />
            <input
              type="text"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              placeholder="ONLINE"
              className="bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
            />
          </div>

          <input
            type="text"
            value={form.snippet}
            onChange={(e) => setForm({ ...form, snippet: e.target.value })}
            placeholder="Short caption / snippet"
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded disabled:opacity-50"
            >
              {saving
                ? uploadStatus === "uploading"
                  ? `Uploading ${videoUploadProgress ?? 0}%...`
                  : uploadStatus === "uploaded"
                    ? "CCTV VIDEO UPLOADED"
                    : "Saving..."
                : "Add to CCTV"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-zinc-700 text-zinc-400 text-xs uppercase tracking-wider rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs animate-pulse">
          Loading cctv_items...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs">
          No CCTV feeds yet. Add an Instagram link or custom video.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((tx) => (
            <div
              key={tx.id}
              className={`bg-zinc-900/60 border rounded-xl overflow-hidden ${
                tx.visible === false ? "border-zinc-800 opacity-60" : "border-zinc-800"
              }`}
            >
              <div className="p-4 flex-1 flex flex-col justify-between font-mono">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] text-red-400 font-bold">{tx.label}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 rounded">
                      {tx.type}
                    </span>
                    <span className="text-[10px] text-zinc-600">{tx.id}</span>
                    {tx.visible === false && (
                      <span className="text-[10px] text-zinc-500">HIDDEN</span>
                    )}
                  </div>
                  <div className="text-xs text-white font-bold mb-1 truncate">
                    {tx.title || "UNTITLED"}
                  </div>

                  {tx.type === "video" && tx.url && (
                    <div className="relative w-full max-h-48 bg-black rounded-lg overflow-hidden border border-zinc-800 my-2">
                      <video
                        src={tx.url}
                        controls
                        controlsList="nodownload"
                        playsInline
                        preload="metadata"
                        className="w-full max-h-48 object-contain"
                      />
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                    {tx.snippet || tx.url}
                  </p>
                  <a
                    href={tx.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-zinc-500 hover:text-red-400 truncate block"
                  >
                    {tx.url}
                  </a>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">{tx.location}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={busyId === tx.id}
                      onClick={() => handleToggle(tx.id, tx.visible !== false)}
                      className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded"
                      title={tx.visible === false ? "Show" : "Hide"}
                    >
                      {tx.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={busyId === tx.id}
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}