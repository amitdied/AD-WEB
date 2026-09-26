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
  Instagram,
  Radio,
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
  deleteVideo,
  uploadFile,
  getCustomTransmissions,
  addTransmission,
  deleteTransmission,
} from "./data-actions";

type Tab = "songs" | "videos";

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>("songs");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    let active = true;
    checkDbStatus()
      .then((isInit) => {
        if (active) setIsDbInitialized(isInit);
      })
      .catch(() => {
        if (active) setIsDbInitialized(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleInitDb = async () => {
    setIsInitializing(true);
    try {
      await initializeDb();
      setIsDbInitialized(true);
      alert("Database initialized and verified successfully!");
    } catch (e: any) {
      alert("Failed to initialize database: " + (e?.message || "Unknown error"));
    } finally {
      setIsInitializing(false);
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
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
        <h1 className="text-xl font-display font-bold">AMITDIED Admin</h1>
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
        fixed md:static inset-0 z-50 bg-zinc-950 border-r border-zinc-800 w-full md:w-64 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-display font-bold tracking-tight text-white">
            ADMIN<span className="text-red-600">PANEL</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage beats, prices & portfolio</p>
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

        <div className="px-4 mb-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors text-xs font-medium group"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
              <span>View Live Website</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">↗</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-red-600/10 text-red-500 font-medium border border-red-600/20"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-3">
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
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
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
                  Data/db.json does not exist. Click Initialize to seed your beats and portfolio.
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
                  : "Initialize / Repair Database"}
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
            {activeTab === "songs" ? (
              <BeatsManager />
            ) : (
              <VideosManager />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

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
    producer: "",
    bpm: 120,
    key: "",
    genre: "Trap",
    moodTags: "",
    price: 29.99,
    coverUrl: "",
    audioUrl: "",
    buyLink: "",
    description: "",
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

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
    setIsUploading(true);

    let coverUrl = newBeat.coverUrl;
    let audioUrl = newBeat.audioUrl;

    try {
      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        coverUrl = await uploadFile(formData);
      }

      if (audioFile) {
        const formData = new FormData();
        formData.append("file", audioFile);
        audioUrl = await uploadFile(formData);
      }

      await addBeat({ ...newBeat, coverUrl, audioUrl });

      const beatsAfter = await getCustomBeats();
      setBeats(beatsAfter);

      setIsAdding(false);
      setNewBeat({
        title: "",
        producer: "",
        bpm: 120,
        key: "",
        genre: "Trap",
        moodTags: "",
        price: 29.99,
        coverUrl: "",
        audioUrl: "",
        buyLink: "",
        description: "",
      });
      setCoverFile(null);
      setAudioFile(null);
      alert("Beat saved successfully!");
    } catch (error: any) {
      console.error("Upload failed", error);
      alert("Failed to upload files: " + (error.message || "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  const startEdit = (beat: any) => {
    setEditingBeat({
      ...beat,
      moodTags: Array.isArray(beat.moodTags) ? beat.moodTags.join(", ") : beat.moodTags || "",
    });
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

    try {
      if (editCoverFile) {
        const formData = new FormData();
        formData.append("file", editCoverFile);
        coverUrl = await uploadFile(formData);
      }

      if (editAudioFile) {
        const formData = new FormData();
        formData.append("file", editAudioFile);
        audioUrl = await uploadFile(formData);
      }

      await updateBeat(editingBeat.id, {
        ...editingBeat,
        coverUrl,
        audioUrl,
      });

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
    if (!confirm("Are you sure you want to delete this beat?")) return;
    try {
      await deleteBeat(id);
      const updatedBeats = await getCustomBeats();
      setBeats(updatedBeats);
      if (editingBeat?.id === id) setEditingBeat(null);
      alert("Beat deleted successfully");
    } catch (err: any) {
      console.error("delete result", "error", err);
      alert("Failed to delete beat: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-white">Store Beats ({beats.length})</h3>
          <p className="text-xs text-zinc-400">Add, edit pricing, change tags, or remove tracks from the public store</p>
        </div>
        {!isAdding && !editingBeat && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
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
          className="bg-zinc-950 p-6 rounded-xl border border-red-600/40 space-y-4 text-sm shadow-2xl"
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
              <label className="block text-zinc-400 mb-1">Beat Title</label>
              <input
                required
                type="text"
                value={editingBeat.title}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, title: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Producer Name</label>
              <input
                type="text"
                value={editingBeat.producer || ""}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, producer: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">BPM</label>
              <input
                required
                type="number"
                value={editingBeat.bpm}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, bpm: Number(e.target.value) })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Key</label>
              <input
                type="text"
                value={editingBeat.key || ""}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, key: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Price ($)</label>
              <input
                required
                type="number"
                step="0.01"
                value={editingBeat.price}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, price: Number(e.target.value) })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Genre</label>
              <input
                required
                type="text"
                value={editingBeat.genre}
                onChange={(e) =>
                  setEditingBeat({ ...editingBeat, genre: e.target.value })
                }
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Mood Tags (comma separated)</label>
            <input
              type="text"
              value={editingBeat.moodTags}
              onChange={(e) =>
                setEditingBeat({ ...editingBeat, moodTags: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">Replace Cover Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-zinc-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-red-600/20 file:text-red-500 hover:file:bg-red-600/30 font-mono text-xs cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Replace Audio Track (Optional)</label>
              <input
                type="file"
                accept=".mp3,audio/mpeg,.wav,audio/wav"
                onChange={(e) => setEditAudioFile(e.target.files?.[0] || null)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-zinc-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-red-600/20 file:text-red-500 hover:file:bg-red-600/30 font-mono text-xs cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Buy / Checkout Link (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={editingBeat.buyLink || ""}
              onChange={(e) =>
                setEditingBeat({ ...editingBeat, buyLink: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Description (Optional)</label>
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
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Beats List */}
      <div className="space-y-3">
        {beats.map((beat) => (
          <div
            key={beat.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/60 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              {beat.coverUrl ? (
                <img
                  src={beat.coverUrl}
                  alt={beat.title}
                  className="w-14 h-14 rounded-lg object-cover border border-zinc-800 flex-shrink-0 bg-zinc-900"
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
                    ${Number(beat.price).toFixed(2)}
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
          className="bg-black/80 p-6 rounded-xl border border-zinc-800 space-y-4 text-sm shadow-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              <span>Add New Store Beat</span>
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
              <label className="block text-zinc-400 mb-1">Beat Title</label>
              <input
                required
                type="text"
                placeholder="Title"
                value={newBeat.title}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, title: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Producer Name</label>
              <input
                type="text"
                placeholder="Producer"
                value={newBeat.producer}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, producer: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">BPM</label>
              <input
                required
                type="number"
                placeholder="120"
                value={newBeat.bpm}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, bpm: Number(e.target.value) })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Key</label>
              <input
                type="text"
                placeholder="e.g. C Min"
                value={newBeat.key}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, key: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Price ($)</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="29.99"
                value={newBeat.price}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, price: Number(e.target.value) })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Genre</label>
              <input
                required
                type="text"
                placeholder="Trap / Rage / Drill"
                value={newBeat.genre}
                onChange={(e) =>
                  setNewBeat({ ...newBeat, genre: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">
              Mood Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="Dark, Energetic, Bouncy..."
              value={newBeat.moodTags}
              onChange={(e) =>
                setNewBeat({ ...newBeat, moodTags: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">
                Cover Image (jpg, png, webp)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-red-600/20 file:text-red-500 hover:file:bg-red-600/30 font-mono text-xs cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">
                Beat Audio (mp3, wav)
              </label>
              <input
                type="file"
                accept=".mp3,audio/mpeg,.wav,audio/wav"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-red-600/20 file:text-red-500 hover:file:bg-red-600/30 font-mono text-xs cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Buy Link</label>
            <input
              type="url"
              placeholder="https://..."
              value={newBeat.buyLink}
              onChange={(e) =>
                setNewBeat({ ...newBeat, buyLink: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Description</label>
            <textarea
              placeholder="Beat description..."
              value={newBeat.description}
              onChange={(e) =>
                setNewBeat({ ...newBeat, description: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white h-24 focus:border-red-600 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
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
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
            >
              {isUploading ? "Uploading..." : "Save Beat"}
            </button>
          </div>
        </form>
      ) : (
        !editingBeat && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-zinc-800 hover:border-red-600/50 text-zinc-500 hover:text-white rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5 text-red-500" />
            <span>Add New Store Beat</span>
          </button>
        )
      )}
    </div>
  );
}

function VideosManager() {
  const [videos, setVideos] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);

  const [newVideo, setNewVideo] = useState({
    title: "",
    url: "",
    description: "",
  });

  const loadVideos = useCallback(async () => {
    try {
      const data = await getCustomVideos();
      setVideos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCustomVideos()
      .then((data) => {
        if (active) {
          setVideos(data);
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
    if (newVideo.url) {
      await addVideo(newVideo);
      setIsAdding(false);
      setNewVideo({ title: "", url: "", description: "" });
      loadVideos();
    }
  };

  const startEditVideo = (video: any) => {
    setEditingVideo({ ...video });
    setIsAdding(false);
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setIsUpdatingVideo(true);
    try {
      await updateVideo(editingVideo.id, editingVideo);
      const updated = await getCustomVideos();
      setVideos(updated);
      setEditingVideo(null);
      alert("Video updated successfully!");
    } catch (err: any) {
      alert("Failed to update video: " + (err.message || "Unknown error"));
    } finally {
      setIsUpdatingVideo(false);
    }
  };

  const handleDelete = async (id: string, e?: any) => {
    if (e) e.preventDefault();
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      await deleteVideo(id);
      const updatedVideos = await getCustomVideos();
      setVideos(updatedVideos);
      if (editingVideo?.id === id) setEditingVideo(null);
      alert("Video deleted successfully");
    } catch (err: any) {
      console.error("delete result", "error", err);
      alert("Failed to delete video: " + (err.message || "Unknown error"));
    }
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-white">Portfolio Videos ({videos.length})</h3>
          <p className="text-xs text-zinc-400">Add, edit YouTube links or remove videos displayed in the portfolio terminal</p>
        </div>
        {!isAdding && !editingVideo && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video</span>
          </button>
        )}
      </div>

      {/* Edit Video Form */}
      {editingVideo && (
        <form
          onSubmit={handleUpdateVideo}
          className="bg-zinc-950 p-6 rounded-xl border border-red-600/40 space-y-4 shadow-2xl text-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Pencil className="w-4 h-4 text-red-500" />
              <span>Editing: <strong className="text-red-400">{editingVideo.title || "Video"}</strong></span>
            </h4>
            <button
              type="button"
              onClick={() => setEditingVideo(null)}
              className="text-zinc-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-sm">Video Title</label>
            <input
              type="text"
              placeholder="Title"
              value={editingVideo.title || ""}
              onChange={(e) =>
                setEditingVideo({ ...editingVideo, title: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-sm">YouTube URL</label>
            <input
              required
              type="url"
              placeholder="https://youtube.com/..."
              value={editingVideo.url || ""}
              onChange={(e) =>
                setEditingVideo({ ...editingVideo, url: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-sm">Description (Optional)</label>
            <textarea
              placeholder="Description..."
              value={editingVideo.description || ""}
              onChange={(e) =>
                setEditingVideo({ ...editingVideo, description: e.target.value })
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white h-20 focus:border-red-600 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingVideo(null)}
              className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingVideo}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
            >
              {isUpdatingVideo ? "Saving..." : "Update Video"}
            </button>
          </div>
        </form>
      )}

      {/* Videos List */}
      <div className="space-y-3">
        {videos.map((video) => {
          const ytId = extractYoutubeId(video.url);
          return (
            <div
              key={video.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/60 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                {ytId ? (
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={video.title || "Video Thumbnail"}
                    className="w-20 h-14 rounded-lg object-cover border border-zinc-800 flex-shrink-0 bg-zinc-900"
                  />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-600">
                    <Video className="w-6 h-6" />
                  </div>
                )}
                <div className="overflow-hidden min-w-0">
                  <h4 className="font-bold text-white mb-1 truncate">
                    {video.title || "Untitled Video"}
                  </h4>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-zinc-500 hover:text-red-400 truncate block transition-colors"
                  >
                    {video.url}
                  </a>
                  {video.description && (
                    <p className="text-xs text-zinc-400 truncate mt-1">{video.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => startEditVideo(video)}
                  className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                  title="Edit Video"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(video.id, e)}
                  className="p-2 text-red-500 hover:text-red-400 bg-red-950/30 hover:bg-red-900/50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                  title="Delete Video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Video Form */}
      {isAdding ? (
        <form
          onSubmit={handleAdd}
          className="bg-black/80 p-6 rounded-xl border border-zinc-800 space-y-4 text-sm shadow-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              <span>Add New Portfolio Video</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-sm">
              Video Title
            </label>
            <input
              type="text"
              placeholder="Title (e.g. AMITDIED - GOTHAM Visualizer)"
              value={newVideo.title}
              onChange={(e) =>
                setNewVideo({ ...newVideo, title: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm">
              YouTube URL
            </label>
            <input
              required
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={newVideo.url}
              onChange={(e) =>
                setNewVideo({ ...newVideo, url: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-red-600 outline-none font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm">
              Description (Optional)
            </label>
            <textarea
              placeholder="Description..."
              value={newVideo.description}
              onChange={(e) =>
                setNewVideo({ ...newVideo, description: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white h-24 focus:border-red-600 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Save Video
            </button>
          </div>
        </form>
      ) : (
        !editingVideo && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-zinc-800 hover:border-red-600/50 text-zinc-500 hover:text-white rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5 text-red-500" />
            <span>Add New Portfolio Video</span>
          </button>
        )
      )}
    </div>
  );
}

function TransmissionsManager() {
  const [transmissions, setTransmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [newTx, setNewTx] = useState({
    camCode: "CAM-07 // STUDIO_SYNTH",
    category: "cookup",
    caption: "",
    videoSnippetTitle: "",
    imageUrl: "",
    postUrl: "https://www.instagram.com/amitdied/",
    likes: 120,
    comments: 14,
  });

  const loadData = useCallback(async () => {
    try {
      const data = await getCustomTransmissions();
      setTransmissions(data);
    } catch (e) {
      console.error("Failed to load transmissions:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCustomTransmissions()
      .then((data) => {
        if (active) {
          setTransmissions(data);
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
    if (!newTx.caption || !newTx.imageUrl) {
      alert("Please provide at least a caption and an image/thumbnail URL.");
      return;
    }

    try {
      await addTransmission({
        ...newTx,
        tags: ["#amitdied", "#darktrap", "#producertransmission"],
      });
      setIsAdding(false);
      setNewTx({
        camCode: "CAM-" + Math.floor(Math.random() * 90 + 10) + " // STUDIO",
        category: "cookup",
        caption: "",
        videoSnippetTitle: "",
        imageUrl: "",
        postUrl: "https://www.instagram.com/amitdied/",
        likes: Math.floor(Math.random() * 500 + 100),
        comments: Math.floor(Math.random() * 50 + 10),
      });
      loadData();
    } catch (e: any) {
      alert("Failed to add transmission: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transmission from CCTV?")) return;
    try {
      await deleteTransmission(id);
      loadData();
    } catch (e: any) {
      alert("Failed to delete transmission: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Instagram className="w-5 h-5 text-red-500" />
            <span>Instagram CCTV Feeds & 3D Transmissions</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Posts, cookups, and reels displayed on the CCTV surveillance section.
          </p>
        </div>
        <Link
          href="/#cctv-feed"
          target="_blank"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-950/40 border border-red-800/60 hover:border-red-500 text-red-400 text-xs font-mono rounded"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Preview CCTV Section</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-500 font-mono text-sm">
          Loading transmissions...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transmissions.map((tx) => (
            <div
              key={tx.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-red-400 font-bold truncate">{tx.camCode}</span>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 uppercase">
                  {tx.category}
                </span>
              </div>

              <div className="relative h-44 bg-zinc-950 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tx.imageUrl}
                  alt={tx.caption}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between font-mono">
                <div>
                  <div className="text-xs text-white font-bold mb-1 truncate">
                    {tx.videoSnippetTitle || "SNIPPET_RECORDING"}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {tx.caption}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px]">{tx.likes} Likes</span>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded transition-colors"
                    title="Delete Transmission"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <form
          onSubmit={handleAdd}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 font-mono text-xs"
        >
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
            New Surveillance Transmission
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">CCTV Code</label>
              <input
                type="text"
                value={newTx.camCode}
                onChange={(e) => setNewTx({ ...newTx, camCode: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
                placeholder="CAM-08 // MASTER_LAB"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Category</label>
              <select
                value={newTx.category}
                onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
              >
                <option value="cookup">Studio Cookup</option>
                <option value="placement">Placement</option>
                <option value="session">Vocals / Session</option>
                <option value="lore">Aesthetic / Lore</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Snippet / Title Tag</label>
            <input
              type="text"
              value={newTx.videoSnippetTitle}
              onChange={(e) => setNewTx({ ...newTx, videoSnippetTitle: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
              placeholder="e.g. MOOG_808_EXPERIMENT.WAV"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Image / Screenshot URL *</label>
            <input
              type="text"
              value={newTx.imageUrl}
              onChange={(e) => setNewTx({ ...newTx, imageUrl: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
              placeholder="https://images.unsplash.com/... or /uploads/..."
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Instagram Post / Reel Link</label>
            <input
              type="text"
              value={newTx.postUrl}
              onChange={(e) => setNewTx({ ...newTx, postUrl: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600"
              placeholder="https://www.instagram.com/p/... or https://www.instagram.com/reel/..."
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Caption / Notes *</label>
            <textarea
              value={newTx.caption}
              onChange={(e) => setNewTx({ ...newTx, caption: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600 h-20"
              placeholder="Behind the scenes details, analog chain, or session summary..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-zinc-400 hover:text-white uppercase tracking-wider font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase tracking-wider transition-colors"
            >
              Broadcast Transmission
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-zinc-800 hover:border-red-600/50 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors"
        >
          <Plus className="w-4 h-4 text-red-500" />
          <span>Add New Instagram / CCTV Transmission</span>
        </button>
      )}
    </div>
  );
}
