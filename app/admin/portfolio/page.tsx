'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  ArrowLeft,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Eye,
  Check,
  X,
  Play,
} from 'lucide-react';
import { PortfolioRow } from '@/lib/google/sheets';
import { extractYouTubeId } from '@/lib/youtube';

export default function PortfolioAdminPage() {
  const [videos, setVideos] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [extractedId, setExtractedId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Production');
  const [sortOrder, setSortOrder] = useState('1');
  const [isPublished, setIsPublished] = useState(true);

  // Edit / Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewModalId, setPreviewModalId] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/portfolio');
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
        if (data.length > 0) {
          setSortOrder(String(data.length + 1));
        }
      }
    } catch (e) {
      console.error('Failed to load videos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/portfolio')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active) {
          setVideos(data);
          if (data.length > 0) setSortOrder(String(data.length + 1));
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

  // When YouTube URL changes, automatically extract ID and fetch title if possible
  const handleUrlChange = async (url: string) => {
    setYoutubeUrl(url);
    const id = extractYouTubeId(url);
    setExtractedId(id);

    if (id && (!title || title.startsWith('ARCHIVE_'))) {
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.title) setTitle(json.title);
        }
      } catch (err) {
        // Ignore oembed errors
      }
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractedId || extractYouTubeId(youtubeUrl);
    if (!id) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const payload: Partial<PortfolioRow> = {
        youtube_url: youtubeUrl.trim(),
        youtube_id: id,
        title: title.trim() || `ARCHIVE_${id}`,
        description: description.trim(),
        category,
        sort_order: Number(sortOrder) || videos.length + 1,
        is_published: isPublished,
        thumbnail_url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      };

      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to add video');
      }

      setStatusMessage({ type: 'success', text: `✓ YouTube video "${title || id}" added to PORTFOLIO sheet!` });
      setYoutubeUrl('');
      setExtractedId('');
      setTitle('');
      setDescription('');
      fetchVideos();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `✗ Error: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (video: PortfolioRow) => {
    const nextVal = !(String(video.is_published).toLowerCase() === 'true' || String(video.is_published) === '1');
    try {
      await fetch('/api/admin/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id, is_published: nextVal }),
      });
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, is_published: nextVal } : v))
      );
    } catch (err) {
      alert('Failed to update published status');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const list = [...videos];
    const current = list[index];
    const target = list[targetIndex];

    const tempOrder = current.sort_order;
    current.sort_order = target.sort_order;
    target.sort_order = tempOrder;

    list[index] = target;
    list[targetIndex] = current;
    setVideos(list);

    try {
      await Promise.all([
        fetch('/api/admin/portfolio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, sort_order: current.sort_order }),
        }),
        fetch('/api/admin/portfolio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: target.id, sort_order: target.sort_order }),
        }),
      ]);
    } catch (err) {
      console.error('Failed to persist reorder', err);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/portfolio?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
        setDeleteConfirmId(null);
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error}`);
      }
    } catch (err) {
      alert('Failed to delete video');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
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
            onClick={fetchVideos}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC VIDEOS</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-950/60 border border-red-800 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-red-500" />
              </div>
              <h1 className="text-2xl font-display font-black tracking-tight uppercase">
                AMITDIED PORTFOLIO CONTROL
              </h1>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Manage YouTube video highlights, placements, and visual archives.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">Published Videos:</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded font-bold text-white">
              {videos.filter((v) => String(v.is_published).toLowerCase() === 'true').length}
            </span>
          </div>
        </div>

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

        {/* Add YouTube Video Form */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red-500" />
            <span>+ ADD YOUTUBE VIDEO</span>
          </h2>

          <form onSubmit={handleAddVideo} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left: Input Form */}
              <div className="md:col-span-2 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                    YouTube URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={youtubeUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                  {extractedId && (
                    <p className="mt-1 text-[11px] text-emerald-400">
                      ✓ Extracted Video ID: <span className="font-bold">{extractedId}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. AMITDIED - LATE NIGHT SESSION"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Production">Production</option>
                      <option value="Music Video">Music Video</option>
                      <option value="Placement">Placement</option>
                      <option value="Studio Cookup">Studio Cookup</option>
                      <option value="Live">Live Performance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                      <span className="text-zinc-300">PUBLISHED (Visible in Portfolio)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of the placement or video..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Right: Live Preview Box */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                  AUTO-GENERATED THUMBNAIL PREVIEW
                </span>
                {extractedId ? (
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-zinc-700 relative bg-black">
                    <img
                      src={`https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white">
                        <Play className="w-4 h-4 ml-0.5 fill-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-lg border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600 text-xs font-mono">
                    <Video className="w-8 h-8 mb-2" />
                    <span>Paste YouTube URL to preview</span>
                  </div>
                )}
                <p className="text-[10px] font-mono text-zinc-500 mt-3">
                  Only the video URL and ID are saved. Videos are played directly from YouTube.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold uppercase tracking-widest py-3 rounded-lg transition-colors shadow-lg active:scale-99 disabled:opacity-50"
            >
              {saving ? 'SAVING TO SHEETS...' : 'SAVE YOUTUBE VIDEO TO PORTFOLIO'}
            </button>
          </form>
        </div>

        {/* Existing Portfolio Videos List */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-zinc-300">PORTFOLIO VIDEOS LIST</span>
            <span className="text-zinc-500">{videos.length} ITEMS</span>
          </div>

          <div className="divide-y divide-zinc-900">
            {videos.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-zinc-500">
                No videos in Google Sheet yet. Add your first YouTube video above.
              </div>
            ) : (
              videos.map((vid, idx) => {
                const isPub =
                  String(vid.is_published).toLowerCase() === 'true' || String(vid.is_published) === '1';
                const ytId = vid.youtube_id || extractYouTubeId(vid.youtube_url);

                return (
                  <div
                    key={vid.id || idx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:text-white text-zinc-600 disabled:opacity-20"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === videos.length - 1}
                          className="p-1 hover:text-white text-zinc-600 disabled:opacity-20"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Video Thumbnail */}
                      <div className="w-20 aspect-video rounded bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 relative group">
                        {ytId ? (
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            alt={vid.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <Video className="w-4 h-4" />
                          </div>
                        )}
                        <button
                          onClick={() => setPreviewModalId(ytId)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                        >
                          <Play className="w-4 h-4 fill-white" />
                        </button>
                      </div>

                      {/* Video Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-bold text-white text-sm">{vid.title}</h3>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded">
                            {vid.category || 'Production'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500 font-mono text-[11px] mt-0.5">
                          <span>Order: #{vid.sort_order}</span>
                          <span>•</span>
                          <a
                            href={vid.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:text-white flex items-center gap-1"
                          >
                            <span>Watch on YouTube</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 font-mono text-xs self-end sm:self-auto">
                      <button
                        onClick={() => handleTogglePublished(vid)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                          isPub
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {isPub ? 'PUBLISHED' : 'DRAFT'}
                      </button>

                      {deleteConfirmId === vid.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteVideo(vid.id)}
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
                          onClick={() => setDeleteConfirmId(vid.id)}
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

        {/* Video Preview Modal */}
        {previewModalId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-xs text-zinc-400">YOUTUBE PLAYER PREVIEW</span>
                <button
                  onClick={() => setPreviewModalId(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video w-full rounded overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${previewModalId}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
