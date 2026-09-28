'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  ArrowLeft,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Upload,
  Video,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { CCTVRow } from '@/lib/google/sheets';
import { extractYouTubeId } from '@/lib/youtube';

export default function CctvAdminPage() {
  const [items, setItems] = useState<CCTVRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'youtube' | 'drive_video' | 'image'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [category, setCategory] = useState('BTS');
  const [sortOrder, setSortOrder] = useState('1');
  const [isPublished, setIsPublished] = useState(true);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/cctv');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        if (data.length > 0) {
          setSortOrder(String(data.length + 1));
        }
      }
    } catch (e) {
      console.error('Failed to load CCTV items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/cctv')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active) {
          setItems(data);
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

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    setUploadProgress(10);
    setStatusMessage(null);

    try {
      let driveFileId = '';

      // Upload file to Google Drive (AMITDIED MEDIA/CCTV) if mediaType is drive_video or image
      if ((mediaType === 'drive_video' || mediaType === 'image') && mediaFile) {
        setUploadProgress(35);
        const form = new FormData();
        form.append('file', mediaFile);
        form.append('folderType', 'cctv');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: form,
        });

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json();
          throw new Error(errJson.error || 'Failed to upload media file to Drive');
        }

        const uploadJson = await uploadRes.json();
        driveFileId = uploadJson.fileId || '';
        setUploadProgress(75);
      }

      const payload: Partial<CCTVRow> = {
        title: title.trim(),
        description: description.trim(),
        media_type: mediaType,
        youtube_url: mediaType === 'youtube' ? youtubeUrl.trim() : '',
        drive_file_id: driveFileId,
        category,
        sort_order: Number(sortOrder) || items.length + 1,
        is_published: isPublished,
      };

      const res = await fetch('/api/admin/cctv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to add CCTV item');
      }

      setUploadProgress(100);
      setStatusMessage({ type: 'success', text: `✓ CCTV transmission "${title}" added to CCTV sheet!` });
      setTitle('');
      setDescription('');
      setYoutubeUrl('');
      setMediaFile(null);
      fetchItems();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `✗ Error: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (item: CCTVRow) => {
    const nextVal = !(String(item.is_published).toLowerCase() === 'true' || String(item.is_published) === '1');
    try {
      await fetch('/api/admin/cctv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_published: nextVal }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_published: nextVal } : i))
      );
    } catch (err) {
      alert('Failed to update published status');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const list = [...items];
    const current = list[index];
    const target = list[targetIndex];

    const tempOrder = current.sort_order;
    current.sort_order = target.sort_order;
    target.sort_order = tempOrder;

    list[index] = target;
    list[targetIndex] = current;
    setItems(list);

    try {
      await Promise.all([
        fetch('/api/admin/cctv', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, sort_order: current.sort_order }),
        }),
        fetch('/api/admin/cctv', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: target.id, sort_order: target.sort_order }),
        }),
      ]);
    } catch (err) {
      console.error('Failed to save order change', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cctv?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setDeleteConfirmId(null);
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error}`);
      }
    } catch (err) {
      alert('Failed to delete CCTV item');
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
            onClick={fetchItems}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC CCTV</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-950/60 border border-red-800 rounded-lg flex items-center justify-center">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-display font-black tracking-tight uppercase">
                AMITDIED CCTV FEED CONTROL
              </h1>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Manage surveillance monitor feeds: YouTube BTS, Documentary, or Direct Drive Media.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">Transmissions:</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded font-bold text-white">
              {items.length}
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

        {/* Add CCTV Transmission Form */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red-500" />
            <span>ADD CCTV TRANSMISSION</span>
          </h2>

          <form onSubmit={handleAddItem} className="space-y-5 font-mono text-xs">
            {/* Media Type Selector */}
            <div>
              <label className="block text-zinc-400 mb-2 uppercase tracking-wider">
                Select Media Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMediaType('youtube')}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors ${
                    mediaType === 'youtube'
                      ? 'bg-red-950/40 border-red-600 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Video className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-bold text-xs">A) YouTube Video</div>
                    <div className="text-[10px] text-zinc-500">BTS / Documentary</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('drive_video')}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors ${
                    mediaType === 'drive_video'
                      ? 'bg-red-950/40 border-red-600 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Upload className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-bold text-xs">B) Drive Video</div>
                    <div className="text-[10px] text-zinc-500">Upload to AMITDIED MEDIA</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors ${
                    mediaType === 'image'
                      ? 'bg-red-950/40 border-red-600 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-bold text-xs">C) Drive Photo</div>
                    <div className="text-[10px] text-zinc-500">Surveillance Photo</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Media Source Input */}
            {mediaType === 'youtube' ? (
              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                  YouTube BTS / Documentary URL *
                </label>
                <input
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            ) : (
              <div className="border border-dashed border-zinc-800 bg-zinc-900/40 rounded-xl p-5 text-center">
                <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                <label className="text-xs font-bold text-white uppercase tracking-wider cursor-pointer">
                  {mediaFile ? mediaFile.name : `SELECT ${mediaType === 'drive_video' ? 'VIDEO FILE' : 'IMAGE FILE'}`}
                  <input
                    type="file"
                    required
                    accept={mediaType === 'drive_video' ? 'video/*' : 'image/*'}
                    onChange={handleMediaFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-zinc-500 mt-1">
                  File will be uploaded to Google Drive in folder AMITDIED MEDIA/CCTV
                </p>
              </div>
            )}

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Transmission Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. STUDIO_UNDERGROUND // LATE_NIGHT"
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
                  <option value="BTS">BTS</option>
                  <option value="DOCUMENTARY">DOCUMENTARY</option>
                  <option value="STUDIO">STUDIO</option>
                  <option value="LIVE">LIVE</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="MUSIC">MUSIC</option>
                  <option value="LIFE">LIFE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

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
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                Description / Intel Snippet
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Analog pedals and 808 saturation test straight from rack console..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <span className="text-zinc-300">PUBLISHED (Active on CCTV Surveillance Grid)</span>
              </label>
            </div>

            {saving && uploadProgress > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Uploading to Drive &amp; Sheets...</span>
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

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold uppercase tracking-widest py-3 rounded-lg transition-colors shadow-lg active:scale-99 disabled:opacity-50"
            >
              {saving ? 'RECORDING TRANSMISSION...' : 'ADD CCTV TRANSMISSION'}
            </button>
          </form>
        </div>

        {/* Existing CCTV Items */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-zinc-300">CCTV SURVEILLANCE FEEDS</span>
            <span className="text-zinc-500">{items.length} MONITORS</span>
          </div>

          <div className="divide-y divide-zinc-900">
            {items.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-zinc-500">
                No transmissions in CCTV sheet. Add your first surveillance feed above.
              </div>
            ) : (
              items.map((item, idx) => {
                const isPub =
                  String(item.is_published).toLowerCase() === 'true' || String(item.is_published) === '1';

                return (
                  <div
                    key={item.id || idx}
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
                          disabled={idx === items.length - 1}
                          className="p-1 hover:text-white text-zinc-600 disabled:opacity-20"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Icon & Label */}
                      <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        {item.media_type === 'youtube' ? (
                          <Video className="w-4 h-4 text-red-500" />
                        ) : item.media_type === 'drive_video' ? (
                          <Play className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                        )}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-bold text-white text-sm">{item.title}</h3>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded">
                            {item.category || 'BTS'}
                          </span>
                          <span className="text-[9px] font-mono text-red-400 bg-red-950/40 border border-red-800/80 px-1 py-0.2 rounded uppercase">
                            {item.media_type}
                          </span>
                        </div>
                        <p className="text-zinc-500 font-mono text-[11px] line-clamp-1 mt-0.5 max-w-md">
                          {item.description || 'Live surveillance feed'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 font-mono text-xs self-end sm:self-auto">
                      <button
                        onClick={() => handleTogglePublished(item)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                          isPub
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {isPub ? 'ONLINE' : 'OFFLINE'}
                      </button>

                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
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
                          onClick={() => setDeleteConfirmId(item.id)}
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
