'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type KnowledgeItem = {
  id: string;
  title: string;
  mime_type: string;
  file_size: number;
  status: 'processing' | 'ready' | 'failed';
  error_message?: string | null;
  storage_path: string;
  created_at: string;
  updated_at: string;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminKnowledgePage() {
  const { session } = useUser();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/knowledge/documents', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      });

      const data = (await response.json().catch(() => ({}))) as {
        items?: KnowledgeItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat knowledge documents.');
      }

      setItems(data.items || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat knowledge documents.',
      );
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async () => {
    if (!session?.access_token || !file || !supabase) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const prepare = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'prepare',
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      const prepareData = (await prepare.json()) as {
        token?: string;
        path?: string;
        error?: string;
      };

      if (!prepare.ok || !prepareData.token || !prepareData.path) {
        throw new Error(prepareData.error || 'Gagal menyiapkan upload knowledge base.');
      }

      const uploadResult = await supabase.storage
        .from('knowledge-base')
        .uploadToSignedUrl(prepareData.path, prepareData.token, file);

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      const finalize = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'finalize',
          path: prepareData.path,
          title: title.trim() || undefined,
        }),
      });

      const finalizeData = (await finalize.json()) as {
        success?: boolean;
        error?: string;
        chunkCount?: number;
      };

      if (!finalize.ok || !finalizeData.success) {
        throw new Error(finalizeData.error || 'Gagal mengindeks knowledge base.');
      }

      setTitle('');
      setFile(null);
      setSuccess(
        `Knowledge base berhasil diindeks (${finalizeData.chunkCount || 0} chunk).`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload knowledge base gagal.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    const confirmed = window.confirm('Hapus knowledge document ini?');
    if (!confirmed) return;

    setBusyId(id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/knowledge/documents?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus knowledge document.');
      }

      setSuccess('Knowledge document berhasil dihapus.');
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menghapus knowledge document.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Nexora
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-black text-white">Knowledge Base Admin</h1>
        <p className="text-xs text-slate-400">
          Upload file txt, md, json, csv, atau html untuk diindeks ke pgvector.
        </p>
      </header>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul dokumen opsional"
              maxLength={200}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
            <input
              type="file"
              accept=".txt,.md,.json,.csv,.html,text/plain,text/markdown,application/json,text/csv,text/html"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!file || !supabase || uploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {uploading ? 'Mengunggah...' : 'Upload & Index'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat knowledge documents...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
          Belum ada knowledge document.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{item.title}</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.mime_type} • {formatBytes(item.file_size)}
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
                    {item.storage_path}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase text-slate-300">
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    disabled={busyId === item.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    {busyId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Hapus
                  </button>
                </div>
              </div>

              {item.error_message && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                  {item.error_message}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
