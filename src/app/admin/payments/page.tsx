'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

type Item = {
  id: string;
  userId: string;
  email?: string | null;
  displayName?: string | null;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  proofUrl?: string | null;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPaymentsPage() {
  const { session } = useUser();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/admin/list', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? 'Akun ini tidak memiliki akses admin.'
            : data?.error || 'Gagal memuat pembayaran.',
        );
      }

      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pembayaran.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (orderId: string, action: 'approve' | 'reject') => {
    if (!session?.access_token) return;

    if (action === 'reject' && !notes[orderId]?.trim()) {
      setError('Tulis alasan penolakan terlebih dahulu.');
      return;
    }

    const confirmed = window.confirm(
      action === 'approve'
        ? `Setujui pembayaran ${orderId} dan aktifkan PRO +30 hari?`
        : `Tolak pembayaran ${orderId}?`,
    );

    if (!confirmed) return;

    setBusyOrder(orderId);
    setError('');

    try {
      const response = await fetch('/api/payments/admin/review', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          action,
          note: notes[orderId] || '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Review pembayaran gagal.');
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review pembayaran gagal.');
    } finally {
      setBusyOrder(null);
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
        <h1 className="text-2xl font-black text-white">Review Pembayaran DANA</h1>
        <p className="text-xs text-slate-400">
          Bukti transfer disimpan private. Link gambar di halaman ini hanya aktif sementara.
        </p>
      </header>

      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat pembayaran...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
          Belum ada pembayaran DANA untuk direview.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const pending = item.status === 'pending_review';
            const busy = busyOrder === item.orderId;

            return (
              <article
                key={item.id}
                className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="break-all font-mono text-xs text-slate-400">{item.orderId}</p>
                    <p className="mt-1 text-xl font-black text-white">{formatRupiah(item.amount)}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.displayName || 'User'}{item.email ? ` • ${item.email}` : ''}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${
                      pending
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        : item.status === 'paid'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-red-500/30 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {pending ? (
                      <Clock3 className="h-3.5 w-3.5" />
                    ) : item.status === 'paid' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {item.status}
                  </span>
                </div>

                {item.proofUrl ? (
                  <a
                    href={item.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.proofUrl}
                      alt={`Bukti transfer ${item.orderId}`}
                      className="max-h-[520px] w-full object-contain"
                    />
                  </a>
                ) : (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                    Bukti transfer tidak tersedia.
                  </div>
                )}

                <textarea
                  value={notes[item.orderId] || ''}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [item.orderId]: event.target.value,
                    }))
                  }
                  maxLength={500}
                  placeholder="Catatan review. Wajib diisi jika pembayaran ditolak."
                  className="min-h-24 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />

                {pending && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void review(item.orderId, 'approve')}
                      disabled={busy}
                      className="rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {busy ? 'Memproses...' : 'Approve + Aktifkan PRO'}
                    </button>

                    <button
                      type="button"
                      onClick={() => void review(item.orderId, 'reject')}
                      disabled={busy}
                      className="rounded-xl bg-red-600 py-3 text-xs font-black text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Tolak Pembayaran
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
