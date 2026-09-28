'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Music,
  ArrowLeft,
  Upload,
  Play,
  Pause,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Radio,
} from 'lucide-react';
import { BeatRow } from '@/lib/google/sheets';

export default function BeatsAdminPage() {
  const [beats, setBeats] = useState<BeatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState('140');
  const [genre, setGenre] = useState('Rage');
  const [mood, setMood] = useState('Dark, Aggressive');
  const [price, setPrice] = useState('29.99');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('dark, aggressive, trap');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Audio Preview Player
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Edit Modal State
  const [editingBeat, setEditingBeat] = useState<BeatRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchBeats = async () => {
    try {
      const res = await fetch('/api/admin/beats');
      if (res.ok) {
        const data = await res.json();
        setBeats(data);
      }
    } catch (e) {
      console.error('Failed to load beats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/beats')
      .then((res) => (res.ok ? res.json() : []))
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

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setCoverFile(f);
      setCoverPreview(URL.createObjectURL(f));
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const togglePlayAudio = (id: string, audioFileIdOrUrl?: string) => {
    if (!audioFileIdOrUrl) {
      alert('No audio file associated with this beat.');
      return;
    }

    let url = audioFileIdOrUrl;
    if (!url.startsWith('http') && !url.startsWith('/')) {
      url = `/api/drive/media?fileId=${url}`;
    }

    if (activePlayingId === id) {
      audioPlayerRef.current?.pause();
      setActivePlayingId(null);
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play().catch((err) => {
        console.error('Playback error:', err);
        alert('Could not stream audio. Verify Google Drive permissions.');
      });
      audioPlayerRef.current.onended = () => setActivePlayingId(null);
      setActivePlayingId(id);
    }
  };

  const handlePublishBeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setStatusMessage(null);

    try {
      let audioFileId = '';
      let coverFileId = '';

      // 1. Upload Cover to Drive AMITDIED BEATS/COVERS
      if (coverFile) {
        setUploadProgress(25);
        const coverForm = new FormData();
        coverForm.append('file', coverFile);
        coverForm.append('folderType', 'covers');

        const coverRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: coverForm,
        });

        if (coverRes.ok) {
          const coverJson = await coverRes.json();
          coverFileId = coverJson.fileId || '';
        }
      }

      // 2. Upload Audio to Drive AMITDIED BEATS/AUDIO
      if (audioFile) {
        setUploadProgress(50);
        const audioForm = new FormData();
        audioForm.append('file', audioFile);
        audioForm.append('folderType', 'audio');

        const audioRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: audioForm,
        });

        if (audioRes.ok) {
          const audioJson = await audioRes.json();
          audioFileId = audioJson.fileId || '';
        }
      }

      setUploadProgress(85);

      // 3. Save beat metadata to BEATS Google Sheet
      const payload: Partial<BeatRow> = {
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        bpm: Number(bpm) || 120,
        genre,
        mood,
        price: Number(price) || 29.99,
        currency,
        description,
        tags,
        audio_file_id: audioFileId,
        cover_file_id: coverFileId,
        is_published: isPublished,
        is_featured: isFeatured,
      };

      const res = await fetch('/api/admin/beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || 'Failed to save to Google Sheet');
      }

      setUploadProgress(100);
      setStatusMessage({ type: 'success', text: `✓ Beat "${title}" published to Google Sheet & Drive!` });

      // Reset Form
      setTitle('');
      setDescription('');
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);
      fetchBeats();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `✗ Upload error: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePublished = async (beat: BeatRow) => {
    const nextVal = !(String(beat.is_published).toLowerCase() === 'true' || String(beat.is_published) === '1');
    try {
      await fetch('/api/admin/beats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: beat.id, is_published: nextVal }),
      });
      setBeats((prev) =>
        prev.map((b) => (b.id === beat.id ? { ...b, is_published: nextVal } : b))
      );
    } catch (err) {
      alert('Failed to update published status');
    }
  };

  const handleToggleFeatured = async (beat: BeatRow) => {
    const nextVal = !(String(beat.is_featured).toLowerCase() === 'true' || String(beat.is_featured) === '1');
    try {
      await fetch('/api/admin/beats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: beat.id, is_featured: nextVal }),
      });
      setBeats((prev) =>
        prev.map((b) => (b.id === beat.id ? { ...b, is_featured: nextVal } : b))
      );
    } catch (err) {
      alert('Failed to update featured status');
    }
  };

  const handleDeleteBeat = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/beats?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBeats((prev) => prev.filter((b) => b.id !== id));
        setDeleteConfirmId(null);
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error}`);
      }
    } catch (err) {
      alert('Failed to delete beat');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO CONTENT CONTROL</span>
          </Link>

          <button
            onClick={fetchBeats}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC BEATS</span>
          </button>
        </div>

        {/* Section Title */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-950/60 border border-red-800 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-red-500" />
              </div>
              <h1 className="text-2xl font-display font-black tracking-tight uppercase">
                AMITDIED BEATS CONTROL
              </h1>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Upload audio (MP3/WAV) to Drive &amp; sync metadata to Google Sheets BEATS tab.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">Total in Sheet:</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded font-bold text-white">
              {beats.length}
            </span>
          </div>
        </div>

        {/* Publish Status Message */}
        {statusMessage && (
          <div
            className={`p-4 rounded-lg font-mono text-xs border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Upload New Beat Form */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red-500" />
            <span>UPLOAD &amp; PUBLISH NEW BEAT</span>
          </h2>

          <form onSubmit={handlePublishBeat} className="space-y-6">
            {/* File Upload Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audio Upload */}
              <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 rounded-xl p-5 text-center flex flex-col items-center justify-center">
                <Music className="w-8 h-8 text-zinc-500 mb-2" />
                <label className="text-xs font-mono font-bold text-white uppercase tracking-wider cursor-pointer mb-1">
                  {audioFile ? audioFile.name : 'SELECT AUDIO FILE (MP3 / WAV)'}
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav"
                    onChange={handleAudioSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] font-mono text-zinc-500">
                  Target: AMITDIED BEATS/AUDIO (Resumable Upload)
                </p>
                {audioFile && (
                  <span className="mt-2 text-[10px] bg-red-950/60 border border-red-800 text-red-300 px-2 py-0.5 rounded font-mono">
                    Ready: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
              </div>

              {/* Cover Upload */}
              <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 rounded-xl p-5 text-center flex flex-col items-center justify-center">
                {coverPreview ? (
                  <div className="relative w-16 h-16 mb-2 rounded overflow-hidden border border-zinc-700">
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
                )}
                <label className="text-xs font-mono font-bold text-white uppercase tracking-wider cursor-pointer mb-1">
                  {coverFile ? coverFile.name : 'SELECT COVER ART (JPG / PNG)'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] font-mono text-zinc-500">
                  Target: AMITDIED BEATS/COVERS
                </p>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Beat Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GOTHAM, BLOODLINE"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Rage">Rage</option>
                  <option value="Trap">Trap</option>
                  <option value="Drill">Drill</option>
                  <option value="Experimental">Experimental</option>
                  <option value="Emotional">Emotional</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">Mood</label>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="Dark, Aggressive"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="dark, rage, synth, 808"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="font-mono text-xs">
              <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exclusive stems, tracked out WAV, 32-bit float..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 font-mono text-xs pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <span className="text-zinc-300">PUBLISHED (Visible in Beat Store)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <span className="text-zinc-300">FEATURED TRACK</span>
              </label>
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Uploading to Google Drive &amp; Sheets...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Publish Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold uppercase tracking-widest py-3 rounded-lg transition-colors shadow-lg active:scale-99 disabled:opacity-50"
            >
              {uploading ? 'PROCESSING UPLOAD...' : 'PUBLISH BEAT'}
            </button>
          </form>
        </div>

        {/* Existing Beats Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-zinc-300">STORE BEATS LIBRARY</span>
            <span className="text-zinc-500">{beats.length} TRACKS</span>
          </div>

          <div className="divide-y divide-zinc-900">
            {beats.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-zinc-500">
                No beats found in Google Sheet. Upload your first beat above.
              </div>
            ) : (
              beats.map((beat) => {
                const isPub =
                  String(beat.is_published).toLowerCase() === 'true' || String(beat.is_published) === '1';
                const isFeat =
                  String(beat.is_featured).toLowerCase() === 'true' || String(beat.is_featured) === '1';
                const isPlaying = activePlayingId === beat.id;

                return (
                  <div
                    key={beat.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Play Button */}
                      <button
                        onClick={() => togglePlayAudio(beat.id, beat.audio_file_id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isPlaying
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      {/* Cover Thumbnail */}
                      <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                        {beat.cover_file_id ? (
                          <img
                            src={
                              beat.cover_file_id.startsWith('http') || beat.cover_file_id.startsWith('/')
                                ? beat.cover_file_id
                                : `https://lh3.googleusercontent.com/d/${beat.cover_file_id}`
                            }
                            alt={beat.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-bold text-white text-sm">{beat.title}</h3>
                          {isFeat && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800 px-1.5 py-0.2 rounded">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500 font-mono text-[11px] mt-0.5">
                          <span>{beat.bpm} BPM</span>
                          <span>•</span>
                          <span>{beat.genre}</span>
                          <span>•</span>
                          <span className="text-zinc-300 font-bold">${beat.price}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 font-mono text-xs self-end sm:self-auto">
                      {/* Publish Toggle Button */}
                      <button
                        onClick={() => handleTogglePublished(beat)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                          isPub
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {isPub ? 'PUBLISHED' : 'DRAFT'}
                      </button>

                      {/* Featured Toggle */}
                      <button
                        onClick={() => handleToggleFeatured(beat)}
                        className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                          isFeat
                            ? 'bg-amber-950/40 text-amber-400 border-amber-800'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        ★
                      </button>

                      {/* Delete with Confirmation */}
                      {deleteConfirmId === beat.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteBeat(beat.id)}
                            className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                          >
                            CONFIRM
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-[10px]"
                          >
                            CANCEL
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(beat.id)}
                          className="text-zinc-500 hover:text-red-500 p-1.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
