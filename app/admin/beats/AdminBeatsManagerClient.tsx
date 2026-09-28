"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Loader2,
  FileAudio,
  DollarSign,
  Tag,
  Hash,
  Database,
  RefreshCw,
  X,
  Play,
  Pause,
  LogIn,
  LogOut,
  FolderSync,
} from "lucide-react";
import {
  getAllAdminBeats,
  togglePublishBeat,
  toggleFeaturedBeat,
  deleteBeat,
  checkGoogleWorkspaceConnection,
} from "./actions";

interface BeatItem {
  id: string;
  title: string;
  slug?: string;
  bpm: number;
  genre: string;
  mood?: string;
  moodTags: string[];
  tags?: string[];
  price: number;
  currency?: string;
  coverUrl: string;
  audioUrl: string;
  audioFileId?: string;
  coverFileId?: string;
  description?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

export function AdminBeatsManagerClient() {
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceStatus, setWorkspaceStatus] = useState<{
    authenticated: boolean;
    adminEmail: string | null;
    adminName?: string;
    adminPicture?: string | null;
    loginMethod?: string;
    missingVariables?: string[];
    isFullyConfigured?: boolean;
    sheetStatus?: string;
    message: string;
  } | null>(null);

  // Audio test player inside admin
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form states
  const [editingBeat, setEditingBeat] = useState<BeatItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Metadata states
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState<number>(140);
  const [genre, setGenre] = useState("Trap");
  const [mood, setMood] = useState("Dark");
  const [price, setPrice] = useState<number>(29.99);
  const [currency, setCurrency] = useState("INR");
  const [tagsInput, setTagsInput] = useState("Dark, Hard, Heavy");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Files & IDs
  const [beatId, setBeatId] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingAudioFileId, setExistingAudioFileId] = useState("");
  const [existingCoverFileId, setExistingCoverFileId] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // File input refs
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [beatsData, conn] = await Promise.all([
        getAllAdminBeats(),
        checkGoogleWorkspaceConnection(),
      ]);
      setBeats(beatsData || []);
      setWorkspaceStatus(conn);
    } catch (err: any) {
      console.error("Error loading beats:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to load beats list",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [beatsData, conn] = await Promise.all([
          getAllAdminBeats(),
          checkGoogleWorkspaceConnection(),
        ]);
        if (active) {
          setBeats(beatsData || []);
          setWorkspaceStatus(conn);
        }
      } catch (err: any) {
        if (active) {
          setStatusMessage({
            type: "error",
            text: err?.message || "Failed to load beats list",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Audio Playback test
  const handlePlayToggle = (beat: BeatItem) => {
    if (!beat.audioUrl) {
      alert("No audio file attached to this beat.");
      return;
    }
    if (playingId === beat.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = beat.audioUrl;
        audioRef.current.play().catch(() => {});
        setPlayingId(beat.id);
      }
    }
  };

  const startNewBeat = () => {
    const newId = crypto.randomUUID();
    setBeatId(newId);
    setEditingBeat(null);
    setTitle("");
    setBpm(140);
    setGenre("Trap");
    setMood("Dark");
    setPrice(29.99);
    setCurrency("INR");
    setTagsInput("Dark, Hard, Heavy");
    setDescription("");
    setIsPublished(true);
    setIsFeatured(false);
    setAudioFile(null);
    setCoverFile(null);
    setExistingAudioFileId("");
    setExistingCoverFileId("");
    setUploadProgress(0);
    setUploadStatusText("");
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingBeat(null);
    setIsFormOpen(false);
    setUploadProgress(0);
    setUploadStatusText("");
  };

  const handleEditClick = (beat: BeatItem) => {
    setEditingBeat(beat);
    setBeatId(beat.id);
    setTitle(beat.title);
    setBpm(beat.bpm);
    setGenre(beat.genre);
    setMood(beat.mood || "Dark");
    setPrice(beat.price);
    setCurrency(beat.currency || "INR");
    setTagsInput(Array.isArray(beat.tags) ? beat.tags.join(", ") : "");
    setDescription(beat.description || "");
    setIsPublished(beat.isPublished !== false);
    setIsFeatured(Boolean(beat.isFeatured));
    setExistingAudioFileId(beat.audioFileId || "");
    setExistingCoverFileId(beat.coverFileId || "");
    setAudioFile(null);
    setCoverFile(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dedicated upload through /api/admin/beats/upload
  const handlePublishBeat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Beat title is required." });
      return;
    }

    if (!editingBeat && !audioFile && !existingAudioFileId) {
      setStatusMessage({ type: "error", text: "Please attach an MP3 or WAV audio track." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatusText("Uploading... 10%");
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("id", beatId || crypto.randomUUID());
    formData.append("title", title.trim());
    formData.append("bpm", String(bpm));
    formData.append("genre", genre.trim());
    formData.append("mood", mood.trim());
    formData.append("price", String(price));
    formData.append("currency", currency.trim());
    formData.append("description", description.trim());
    formData.append("tags", tagsInput);
    formData.append("isPublished", String(isPublished));
    formData.append("isFeatured", String(isFeatured));

    if (existingAudioFileId) formData.append("existingAudioFileId", existingAudioFileId);
    if (existingCoverFileId) formData.append("existingCoverFileId", existingCoverFileId);

    if (audioFile) {
      formData.append("audioFile", audioFile);
    }
    if (coverFile) {
      formData.append("coverFile", coverFile);
    }

    try {
      setUploadProgress(35);
      setUploadStatusText("Uploading to Google Drive... 35%");

      // Simulate step increments while server streams to Google Drive
      const progressTimer = setInterval(() => {
        setUploadProgress((p) => {
          if (p < 85) return p + 15;
          return p;
        });
      }, 700);

      const res = await fetch("/api/admin/beats/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload beat to Google Workspace.");
      }

      setUploadProgress(100);
      setUploadStatusText("Upload successful!");

      setStatusMessage({
        type: "success",
        text: `Beat "${title}" saved to Google Drive and Google Sheets! Reflected live without redeployment.`,
      });

      resetForm();
      await loadData();
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to process beat upload.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async (beat: BeatItem) => {
    const nextState = !beat.isPublished;
    try {
      await togglePublishBeat(beat.id, nextState);
      setBeats((prev) =>
        prev.map((b) => (b.id === beat.id ? { ...b, isPublished: nextState } : b))
      );
    } catch (err: any) {
      alert("Error toggling publish state: " + err.message);
    }
  };

  const handleToggleFeatured = async (beat: BeatItem) => {
    const nextState = !beat.isFeatured;
    try {
      await toggleFeaturedBeat(beat.id, nextState);
      setBeats((prev) =>
        prev.map((b) => (b.id === beat.id ? { ...b, isFeatured: nextState } : b))
      );
    } catch (err: any) {
      alert("Error toggling featured state: " + err.message);
    }
  };

  const handleDelete = async (beat: BeatItem) => {
    if (!confirm(`Are you sure you want to permanently delete beat "${beat.title}" from Google Drive & Sheets?`)) {
      return;
    }
    try {
      await deleteBeat(beat.id);
      setBeats((prev) => prev.filter((b) => b.id !== beat.id));
      if (editingBeat?.id === beat.id) {
        resetForm();
      }
      setStatusMessage({
        type: "success",
        text: `Beat "${beat.title}" deleted from Google Drive & Google Sheets.`,
      });
    } catch (err: any) {
      alert("Error deleting beat: " + err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24 selection:bg-red-600 selection:text-white">
      {/* Hidden Audio Player for Previewing */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Hub</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              AMITDIED BEAT BACKEND
            </h1>
            <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-400">
              Google Drive &amp; Sheets
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {workspaceStatus?.loginMethod === "google_oauth" ? (
            <form action="/api/admin/auth/google/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Google Logout</span>
              </button>
            </form>
          ) : (
            <a
              href="/api/admin/auth/google/login"
              className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect Google Account</span>
            </a>
          )}

          <Link
            href="/#beats"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3 h-3 text-red-500" />
          </Link>

          <button
            onClick={() => {
              if (isFormOpen) {
                resetForm();
              } else {
                startNewBeat();
              }
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-transform active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            {isFormOpen ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Close Editor</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>+ Upload Beat</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Status notification */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
              statusMessage.type === "success"
                ? "bg-emerald-950/50 border-emerald-800/80 text-emerald-300"
                : "bg-red-950/50 border-red-800/80 text-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Google Workspace Connection Banner */}
        <div className="mb-6 p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                workspaceStatus?.loginMethod === "google_oauth"
                  ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                  : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              }`}
            />
            <div>
              <span className="font-semibold text-zinc-200">
                {workspaceStatus?.loginMethod === "google_oauth"
                  ? `Google OAuth Active: ${workspaceStatus.adminEmail}`
                  : `Admin Session: ${workspaceStatus?.adminEmail || "Authenticated"}`}
              </span>
              <p className="text-zinc-500 mt-0.5">
                {workspaceStatus?.message}
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors self-start md:self-auto"
          >
            <RefreshCw
              className={`w-3 h-3 ${loading ? "animate-spin text-red-500" : ""}`}
            />
            <span>Refresh Backend</span>
          </button>
        </div>

        {/* UPLOAD / EDIT BEAT FORM */}
        {isFormOpen && (
          <div className="mb-10 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-5 border-b border-zinc-800 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  {editingBeat ? `Edit Beat: ${editingBeat.title}` : "Upload Beat to Google Drive"}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Audio &amp; covers will be saved into your configured Google Drive folders. Beat details are stored in your Google Sheets database.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-zinc-500 hover:text-white p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishBeat} className="space-y-6">
              {/* Media Dropzones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Audio Upload Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-red-500" />
                      Audio Track (MP3 / WAV) *
                    </span>
                    {(audioFile || existingAudioFileId) && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </label>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) setAudioFile(file);
                    }}
                    onClick={() => audioInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      audioFile || existingAudioFileId
                        ? "border-emerald-600/60 bg-emerald-950/10 hover:border-emerald-500"
                        : "border-zinc-800 hover:border-red-600/60 bg-zinc-900/30 hover:bg-zinc-900/60"
                    }`}
                  >
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept=".mp3,.wav,.m4a,.aac,.flac,audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAudioFile(file);
                      }}
                    />

                    {audioFile ? (
                      <div className="py-2 space-y-2">
                        <FileAudio className="w-10 h-10 mx-auto text-emerald-400" />
                        <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">
                          {audioFile.name}
                        </p>
                        <p className="text-xs text-zinc-400 font-mono">
                          {formatFileSize(audioFile.size)} • Ready to upload to Google Drive
                        </p>
                        <span className="inline-block text-[11px] text-zinc-400 hover:text-white underline">
                          Click to select a different audio file
                        </span>
                      </div>
                    ) : existingAudioFileId ? (
                      <div className="py-2 space-y-2">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                        <p className="text-sm font-semibold text-white">Audio Attached</p>
                        <p className="text-xs text-zinc-400 font-mono truncate max-w-sm mx-auto">
                          Google Drive File ID: {existingAudioFileId}
                        </p>
                        <span className="inline-block text-[11px] text-zinc-400 hover:text-white underline">
                          Click to replace audio file
                        </span>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-zinc-500 group-hover:text-red-500 transition-colors" />
                        <p className="text-xs font-semibold text-zinc-200">
                          Drag &amp; drop MP3/WAV here, or click to browse
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Destination: AMITDIED BEATS/AUDIO/
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Image Upload Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-red-500" />
                      Cover Artwork (PNG / JPG / WEBP)
                    </span>
                    {(coverFile || existingCoverFileId) && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </label>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) setCoverFile(file);
                    }}
                    onClick={() => coverInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      coverFile || existingCoverFileId
                        ? "border-emerald-600/60 bg-emerald-950/10 hover:border-emerald-500"
                        : "border-zinc-800 hover:border-red-600/60 bg-zinc-900/30 hover:bg-zinc-900/60"
                    }`}
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCoverFile(file);
                      }}
                    />

                    {coverFile ? (
                      <div className="flex items-center justify-center gap-4 py-1">
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                            {coverFile.name}
                          </p>
                          <p className="text-xs text-zinc-400 font-mono">
                            {formatFileSize(coverFile.size)} • Ready to upload to Google Drive
                          </p>
                          <span className="text-[11px] text-zinc-400 underline">
                            Click to replace artwork
                          </span>
                        </div>
                      </div>
                    ) : existingCoverFileId ? (
                      <div className="flex items-center justify-center gap-4 py-1">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0">
                          <Image
                            src={`/api/media/${existingCoverFileId}`}
                            alt="Cover preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">Cover Attached</p>
                          <span className="text-[11px] text-zinc-400 underline">
                            Click to replace artwork
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <ImageIcon className="w-8 h-8 mx-auto text-zinc-500 group-hover:text-red-500 transition-colors" />
                        <p className="text-xs font-semibold text-zinc-200">
                          Drag &amp; drop artwork, or browse
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Destination: AMITDIED BEATS/COVERS/
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Display */}
              {isUploading && (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      {uploadStatusText || "Uploading..."}
                    </span>
                    <span className="font-mono text-zinc-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Beat Metadata Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Beat Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. VENOM, CATACOMBS, RAGE"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                    <span>Tempo (BPM) *</span>
                    <Hash className="w-3.5 h-3.5 text-zinc-500" />
                  </label>
                  <input
                    type="number"
                    required
                    min={40}
                    max={260}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Genre *
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="Trap">Trap</option>
                    <option value="Rage">Rage</option>
                    <option value="Drill">Drill</option>
                    <option value="Dark Trap">Dark Trap</option>
                    <option value="Experimental">Experimental</option>
                    <option value="Emotional">Emotional</option>
                    <option value="Hyperpop">Hyperpop</option>
                    <option value="Boom Bap">Boom Bap</option>
                    <option value="Ambient">Ambient</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Mood
                  </label>
                  <input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="e.g. Dark, Aggressive, Energetic"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                    <span>License Base Price *</span>
                    <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-red-500" />
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Dark, 808, Distorted, Ken Carson, Hard"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Description / Production Notes (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Heavy 808s, distorted synths, master tape processed"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Toggles & Publish CTA */}
              <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 bg-zinc-900 border-zinc-700 focus:ring-red-500"
                    />
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      Publish directly to Live Store
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 bg-zinc-900 border-zinc-700 focus:ring-red-500"
                    />
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-400" />
                      Mark as Featured
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-transform active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading to Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>
                          {editingBeat ? "Save Changes" : "Publish Beat Live"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* BEATS CATALOG LIST */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-red-500" />
                Live Beat Catalog ({beats.length})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Managed in your Google Sheets database. Changes appear immediately on the storefront.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-mono">
                {beats.filter((b) => b.isPublished !== false).length} Published ·{" "}
                {beats.filter((b) => b.isPublished === false).length} Drafts
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500 mb-3" />
              <p className="text-xs text-zinc-400 font-mono">Loading beats from database...</p>
            </div>
          ) : beats.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Music className="w-12 h-12 text-zinc-700 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">No beats in database yet</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Click &quot;+ Upload Beat&quot; above to upload your first audio track and artwork.
              </p>
              <button
                onClick={startNewBeat}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Beat Now</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 overflow-x-auto">
              {beats.map((beat) => {
                const isItemPlaying = playingId === beat.id;
                return (
                  <div
                    key={beat.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors"
                  >
                    {/* Left: Artwork + Title + Tags */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0 group">
                        <Image
                          src={beat.coverUrl || "/placeholder-cover.png"}
                          alt={beat.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          onClick={() => handlePlayToggle(beat)}
                          title={isItemPlaying ? "Pause audio preview" : "Play audio preview"}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          {isItemPlaying ? (
                            <Pause className="w-6 h-6 text-red-500 fill-red-500" />
                          ) : (
                            <Play className="w-6 h-6 text-white fill-white" />
                          )}
                        </button>
                        {isItemPlaying && (
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white truncate">
                            {beat.title}
                          </h3>
                          {beat.isFeatured && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-yellow-950/60 border border-yellow-800/80 text-yellow-400 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-yellow-400" />
                              Featured
                            </span>
                          )}
                          <span
                            className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                              beat.isPublished !== false
                                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-400"
                                : "bg-zinc-800 border border-zinc-700 text-zinc-400"
                            }`}
                          >
                            {beat.isPublished !== false ? "Live" : "Draft"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                          <span className="font-mono text-zinc-300">{beat.bpm} BPM</span>
                          <span>•</span>
                          <span>{beat.genre}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-400 font-mono">
                            {beat.currency === "INR" ? "₹" : "$"}{beat.price}
                          </span>
                        </div>

                        {beat.moodTags && beat.moodTags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {beat.moodTags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
                              >
                                #{tag.replace(/^#/, "")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      <button
                        onClick={() => handleTogglePublish(beat)}
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          beat.isPublished !== false
                            ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                            : "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                        }`}
                        title={beat.isPublished !== false ? "Unpublish from store" : "Publish to store"}
                      >
                        {beat.isPublished !== false ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Unpublish</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Publish</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleFeatured(beat)}
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          beat.isFeatured
                            ? "bg-yellow-950/60 border border-yellow-800 text-yellow-400 hover:bg-yellow-900/60"
                            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                        }`}
                        title="Toggle featured status"
                      >
                        <Star className={`w-3.5 h-3.5 ${beat.isFeatured ? "fill-yellow-400" : ""}`} />
                        <span className="hidden md:inline">Featured</span>
                      </button>

                      <button
                        onClick={() => handleEditClick(beat)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
                        title="Edit beat details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDelete(beat)}
                        className="p-2 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg transition-colors flex items-center gap-1 text-xs"
                        title="Delete beat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Setup instructions & guidance */}
        <div className="mt-10 p-6 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
          <div className="flex items-start gap-4">
            <Database className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div className="space-y-2 text-xs text-zinc-400">
              <h4 className="text-sm font-bold text-white">
                Google Workspace Backend Architecture
              </h4>
              <p>
                Beats and artworks are stored in Google Drive folders, and track details are recorded in your Google Sheet (<strong>BEATS</strong>).
              </p>
              <pre className="p-3 bg-black rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
{`GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/admin/auth/google/callback"
GOOGLE_DRIVE_AUDIO_FOLDER_ID="your_drive_folder_id_for_audio"
GOOGLE_DRIVE_COVERS_FOLDER_ID="your_drive_folder_id_for_covers"
GOOGLE_SHEET_ID="your_google_sheet_id_here"
GOOGLE_SHEET_NAME="BEATS"
ADMIN_GOOGLE_EMAIL="amitdied69@gmail.com"`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
