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
} from "lucide-react";
import {
  getAllAdminBeats,
  saveBeat,
  uploadBeatMedia,
  togglePublishBeat,
  toggleFeaturedBeat,
  deleteBeat,
  checkSupabaseConnection,
} from "./actions";

interface BeatItem {
  id: string;
  title: string;
  producer?: string;
  bpm: number;
  key?: string;
  genre: string;
  moodTags: string[];
  price: number;
  coverUrl: string;
  audioUrl: string;
  buyLink?: string;
  description?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

export function AdminBeatsManagerClient() {
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);

  // Audio playback test inside admin
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form states
  const [editingBeat, setEditingBeat] = useState<BeatItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form inputs
  const [title, setTitle] = useState("");
  const [producer, setProducer] = useState("AMITDIED");
  const [bpm, setBpm] = useState<number>(140);
  const [genre, setGenre] = useState("Trap");
  const [keyScale, setKeyScale] = useState("");
  const [price, setPrice] = useState<number>(29.99);
  const [tagsInput, setTagsInput] = useState("Dark, Hard, Heavy");
  const [description, setDescription] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Media files & uploads
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [coverFileName, setCoverFileName] = useState("");

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
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
        checkSupabaseConnection(),
      ]);
      setBeats(beatsData || []);
      setSupabaseStatus(conn);
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
    let mounted = true;
    (async () => {
      try {
        const [beatsData, conn] = await Promise.all([
          getAllAdminBeats(),
          checkSupabaseConnection(),
        ]);
        if (mounted) {
          setBeats(beatsData || []);
          setSupabaseStatus(conn);
        }
      } catch (err: any) {
        if (mounted) {
          setStatusMessage({
            type: "error",
            text: err?.message || "Failed to load beats list",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePlayToggle = (beat: BeatItem) => {
    if (!beat.audioUrl) {
      alert("No audio file attached to this beat yet.");
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

  const resetForm = () => {
    setEditingBeat(null);
    setTitle("");
    setProducer("AMITDIED");
    setBpm(140);
    setGenre("Trap");
    setKeyScale("");
    setPrice(29.99);
    setTagsInput("Dark, Hard, Heavy");
    setDescription("");
    setBuyLink("");
    setIsPublished(true);
    setIsFeatured(false);
    setAudioUrl("");
    setCoverUrl("");
    setAudioFileName("");
    setCoverFileName("");
    setIsFormOpen(false);
  };

  const handleEditClick = (beat: BeatItem) => {
    setEditingBeat(beat);
    setTitle(beat.title);
    setProducer(beat.producer || "AMITDIED");
    setBpm(beat.bpm);
    setGenre(beat.genre);
    setKeyScale(beat.key || "");
    setPrice(beat.price);
    setTagsInput(Array.isArray(beat.moodTags) ? beat.moodTags.join(", ") : "");
    setDescription(beat.description || "");
    setBuyLink(beat.buyLink || "");
    setIsPublished(beat.isPublished !== false);
    setIsFeatured(Boolean(beat.isFeatured));
    setAudioUrl(beat.audioUrl || "");
    setCoverUrl(beat.coverUrl || "");
    setAudioFileName(beat.audioUrl ? "Existing Attached Audio" : "");
    setCoverFileName(beat.coverUrl ? "Existing Attached Cover" : "");
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Direct Audio Upload handler
  const handleAudioUpload = async (file: File) => {
    setIsUploadingAudio(true);
    setAudioUploadProgress(20);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "audio");

      setAudioUploadProgress(50);
      const res = await uploadBeatMedia(formData);
      setAudioUploadProgress(100);

      setAudioUrl(res.url);
      setAudioFileName(file.name);
      setStatusMessage({
        type: "success",
        text: `Audio "${file.name}" uploaded successfully (${res.storage === "supabase" ? "Supabase Storage" : "Local Storage"})!`,
      });
    } catch (err: any) {
      console.error("Audio upload error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to upload audio file",
      });
    } finally {
      setIsUploadingAudio(false);
      setTimeout(() => setAudioUploadProgress(0), 1000);
    }
  };

  // Direct Cover Upload handler
  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    setCoverUploadProgress(20);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "cover");

      setCoverUploadProgress(50);
      const res = await uploadBeatMedia(formData);
      setCoverUploadProgress(100);

      setCoverUrl(res.url);
      setCoverFileName(file.name);
      setStatusMessage({
        type: "success",
        text: `Cover artwork uploaded successfully (${res.storage === "supabase" ? "Supabase Storage" : "Local Storage"})!`,
      });
    } catch (err: any) {
      console.error("Cover upload error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to upload cover image",
      });
    } finally {
      setIsUploadingCover(false);
      setTimeout(() => setCoverUploadProgress(0), 1000);
    }
  };

  // Submit / Publish Beat
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a beat title." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const beatPayload = {
        id: editingBeat ? editingBeat.id : `beat-${Date.now()}`,
        title: title.trim(),
        producer: producer.trim() || "AMITDIED",
        bpm: Number(bpm) || 120,
        key: keyScale.trim(),
        genre: genre.trim(),
        moodTags: tagsArray.length > 0 ? tagsArray : ["Dark"],
        price: Number(price) || 29.99,
        coverUrl: coverUrl || "/placeholder-cover.png",
        audioUrl: audioUrl || "",
        buyLink: buyLink.trim(),
        description: description.trim(),
        isPublished: isPublished,
        isFeatured: isFeatured,
        createdAt: editingBeat?.createdAt,
      };

      const result = await saveBeat(beatPayload);

      setStatusMessage({
        type: "success",
        text: editingBeat
          ? `Beat "${beatPayload.title}" updated successfully!`
          : `Beat "${beatPayload.title}" published live directly to store! ${result.savedInSupabase ? "(Supabase Synced)" : "(Local Resilient Storage)"}`,
      });

      resetForm();
      await loadData();
    } catch (err: any) {
      console.error("Save beat error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save beat",
      });
    } finally {
      setIsSubmitting(false);
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
    if (!confirm(`Are you sure you want to permanently delete beat "${beat.title}"?`)) {
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
        text: `Beat "${beat.title}" deleted successfully.`,
      });
    } catch (err: any) {
      alert("Error deleting beat: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24 selection:bg-red-600 selection:text-white">
      {/* Hidden Audio Player for Previewing */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />

      {/* Top Bar */}
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
              DIRECT BEAT UPLOADER
            </h1>
            <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-red-950/60 border border-red-800 text-red-400">
              Live DB
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
                setIsFormOpen(true);
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

        {/* Database & Storage Status Banner */}
        <div className="mb-6 p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                supabaseStatus?.connected
                  ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                  : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              }`}
            />
            <div>
              <span className="font-semibold text-zinc-200">
                {supabaseStatus?.connected
                  ? "Active Storage: Supabase Cloud (Storage + Database)"
                  : "Active Storage: Resilient Server Storage (Local DB & /public/uploads)"}
              </span>
              <p className="text-zinc-500 mt-0.5">
                {supabaseStatus?.connected
                  ? "Beats published here are saved in Supabase and instantly visible on the live website without rebuilding."
                  : "Configured to instantly serve beats to your live store. Connect NEXT_PUBLIC_SUPABASE_URL anytime for seamless cloud migration."}
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
            <span>Refresh Data</span>
          </button>
        </div>

        {/* UPLOAD / EDIT BEAT FORM */}
        {isFormOpen && (
          <div className="mb-10 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-5 border-b border-zinc-800 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  {editingBeat ? `Edit Beat: ${editingBeat.title}` : "Upload & Publish New Beat"}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Upload MP3/WAV, add artwork, fill in BPM &amp; price, and hit Publish to immediately show on your website.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-zinc-500 hover:text-white p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Media Uploads Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Audio Upload Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-red-500" />
                      Audio Track (MP3 / WAV) *
                    </span>
                    {audioUrl && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </label>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleAudioUpload(file);
                    }}
                    onClick={() => audioInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      audioUrl
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
                        if (file) handleAudioUpload(file);
                      }}
                    />

                    {isUploadingAudio ? (
                      <div className="py-4 space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
                        <p className="text-xs text-zinc-300 font-medium">
                          Uploading audio to storage... ({audioUploadProgress}%)
                        </p>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${audioUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : audioUrl ? (
                      <div className="py-2 space-y-2">
                        <FileAudio className="w-10 h-10 mx-auto text-emerald-400" />
                        <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">
                          {audioFileName || "Audio track uploaded"}
                        </p>
                        <p className="text-xs text-zinc-400 truncate max-w-sm mx-auto font-mono">
                          {audioUrl}
                        </p>
                        <span className="inline-block text-[11px] text-zinc-400 hover:text-white underline">
                          Click to replace audio file
                        </span>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-zinc-500 group-hover:text-red-500 transition-colors" />
                        <p className="text-xs font-semibold text-zinc-200">
                          Drag &amp; drop your beat file here, or browse
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Supports MP3 &amp; WAV (up to 150MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Manual Audio URL input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Or direct URL:</span>
                    <input
                      type="text"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://.../beat.mp3"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Cover Image Upload Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-red-500" />
                      Cover Artwork *
                    </span>
                    {coverUrl && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </label>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleCoverUpload(file);
                    }}
                    onClick={() => coverInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      coverUrl
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
                        if (file) handleCoverUpload(file);
                      }}
                    />

                    {isUploadingCover ? (
                      <div className="py-4 space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
                        <p className="text-xs text-zinc-300 font-medium">
                          Uploading image to storage... ({coverUploadProgress}%)
                        </p>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${coverUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : coverUrl ? (
                      <div className="flex items-center justify-center gap-4 py-1">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0">
                          <Image
                            src={coverUrl}
                            alt="Cover preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                            {coverFileName || "Artwork Attached"}
                          </p>
                          <span className="text-[11px] text-zinc-400 underline">
                            Click to replace artwork
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <ImageIcon className="w-8 h-8 mx-auto text-zinc-500 group-hover:text-red-500 transition-colors" />
                        <p className="text-xs font-semibold text-zinc-200">
                          Drag &amp; drop cover artwork, or browse
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          PNG, JPG or WEBP (Square 1:1 recommended)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Manual Cover URL input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Or direct URL:</span>
                    <input
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://.../cover.jpg or /placeholder-cover.png"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              </div>

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
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Producer
                  </label>
                  <input
                    type="text"
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    placeholder="AMITDIED"
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
                    Musical Key
                  </label>
                  <input
                    type="text"
                    value={keyScale}
                    onChange={(e) => setKeyScale(e.target.value)}
                    placeholder="e.g. C min, F# min, D maj"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
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
                  <label className="text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                    <span>License Base Price ($ USD) *</span>
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

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-red-500" />
                    Mood Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Dark, Aggressive, Fast, 808"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Description & Optional Buy Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Custom Buy / Instant Purchase Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={buyLink}
                    onChange={(e) => setBuyLink(e.target.value)}
                    placeholder="e.g. Stripe, BeatStars, or Gumroad link"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Beat Description / Production Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Hard synth lead, saturated 808s, inspired by Playboi Carti &amp; Ken Carson"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Toggles & Publish CTA */}
              <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  {/* Publish Immediately Toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 bg-zinc-900 border-zinc-700 focus:ring-red-500"
                    />
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      Publish immediately to Live Store
                    </span>
                  </label>

                  {/* Featured Toggle */}
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
                    disabled={isSubmitting || isUploadingAudio || isUploadingCover}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-transform active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Beat...</span>
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
                All beats active in your database. Changes here reflect immediately on your live storefront.
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
                Click &quot;+ Upload Beat&quot; above to upload your first audio track and cover artwork.
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
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
                      {/* Play Preview button over cover */}
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
                          {beat.isPublished !== false ? (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                              Live
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                              Unpublished (Draft)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
                          <span>{beat.bpm} BPM</span>
                          <span>•</span>
                          <span>{beat.genre}</span>
                          {beat.key && (
                            <>
                              <span>•</span>
                              <span>{beat.key}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold font-sans">
                            ${beat.price.toFixed(2)}
                          </span>
                        </div>

                        {beat.moodTags && beat.moodTags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {beat.moodTags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto flex-wrap">
                      {/* Play preview toggle */}
                      {beat.audioUrl && (
                        <button
                          onClick={() => handlePlayToggle(beat)}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                            isItemPlaying
                              ? "bg-red-600/20 border-red-600 text-red-400"
                              : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                          }`}
                          title="Preview audio in browser"
                        >
                          {isItemPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-mono">Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-mono">Test Audio</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Featured button */}
                      <button
                        onClick={() => handleToggleFeatured(beat)}
                        className={`p-2 rounded-lg border text-xs transition-colors ${
                          beat.isFeatured
                            ? "bg-yellow-950/40 border-yellow-800 text-yellow-400"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-yellow-400"
                        }`}
                        title={beat.isFeatured ? "Unmark featured" : "Mark as featured beat"}
                      >
                        <Star className={`w-4 h-4 ${beat.isFeatured ? "fill-yellow-400" : ""}`} />
                      </button>

                      {/* Publish / Unpublish button */}
                      <button
                        onClick={() => handleTogglePublish(beat)}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                          beat.isPublished !== false
                            ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-red-400"
                            : "bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/40"
                        }`}
                        title={beat.isPublished !== false ? "Click to unpublish" : "Click to publish live"}
                      >
                        {beat.isPublished !== false ? (
                          <>
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] hidden md:inline">Live</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-zinc-500" />
                            <span className="text-[11px] hidden md:inline">Draft</span>
                          </>
                        )}
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => handleEditClick(beat)}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        title="Edit beat details & media"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(beat)}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950/50 border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete beat permanently"
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

        {/* Instructions for Supabase Credentials */}
        <div className="mt-10 p-6 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
          <div className="flex items-start gap-4">
            <Database className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div className="space-y-2 text-xs text-zinc-400">
              <h4 className="text-sm font-bold text-white">
                How Supabase Connects Directly To Your Live Website
              </h4>
              <p>
                1. Your app already has real persistent uploading active. When you add beats above, they are saved and visible in the Beat Store immediately without needing a code redeploy.
              </p>
              <p>
                2. When you want to use Supabase cloud storage and Postgres, add these environment variables in your Vercel or cloud project settings:
              </p>
              <pre className="p-3 bg-black rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUz..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUz..."`}
              </pre>
              <p>
                3. The full SQL database schema with Row Level Security (RLS) is ready in <span className="font-mono text-zinc-200">supabase_schema.sql</span> in your project root.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
