'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ExternalLink, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { formatRupiah } from '@/lib/payments/config';

type ManualPayment = {
  orderId: string;
  userId: string;
  email: string | null;
  amount: number;
  currency: string;
  status: string;
  proofUrl: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
};

export default function AdminPaymentsPage() {
  const { session } = useUser();
  const [items, setItems] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyOrder, setBusyOrder] = useState('');

  const loadItems = async () => {
    const token = session?.access_token;
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payments/admin/list', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Gagal memuat pembayaran.');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const token = session?.access_token;
    if (!token) return;

    const run = async () => {
      try {
        const response = await fetch('/api/payments/admin/list', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Gagal memuat pembayaran.');
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pembayaran.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const review = async (orderId: string, action: 'approve' | 'reject') => {
    const token = session?.access_token;
    if (!token) return;

    setBusyOrder(orderId);
    setError('');
    try {
      const response = await fetch('/api/payments/admin/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Review gagal diproses.');
      await loadItems();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Review gagal diproses.');
    } finally {
      setBusyOrder('');
    }
  };

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Nexora
        </Link>
        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl">
          <ShieldCheck className="mx-auto h-10 w-10 text-amber-400" />
          <h1 className="mt-4 text-2xl font-black text-white">Login admin diperlukan</h1>
          <p className="mt-2 text-sm text-slate-400">Masuk dengan akun yang tercantum pada konfigurasi admin pembayaran.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-500">Masuk</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Nexora
        </Link>
        <button type="button" onClick={() => void loadItems()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-slate-500 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <h1 className="text-2xl font-black text-white">Review pembayaran manual</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Periksa bukti transfer, lalu setujui hanya pembayaran yang benar-benar masuk. Saat disetujui, PRO aktif selama 30 hari dari waktu approval.</p>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {loading && items.length === 0 && <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Memuat pembayaran...</div>}
      {!loading && items.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">Belum ada pembayaran manual.</div>}

      <div className="grid gap-4">
        {items.map((item) => {
          const canReview = item.status === 'pending_review';
          const isBusy = busyOrder === item.orderId;
          return (
            <article key={item.orderId} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-300">{item.orderId}</p>
                  <p className="mt-2 text-sm font-bold text-white">{item.email || 'Email tidak tersedia'}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatRupiah(item.amount)} • dibuat {new Date(item.createdAt).toLocaleString('id-ID')}</p>
                  {item.submittedAt && <p className="mt-1 text-xs text-slate-500">Bukti dikirim {new Date(item.submittedAt).toLocaleString('id-ID')}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${item.status === 'paid' ? 'bg-emerald-500/10 text-emerald-300' : item.status === 'rejected' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>{item.status}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {item.proofUrl && <a href={item.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:border-indigo-400"><ExternalLink className="h-3.5 w-3.5" /> Buka bukti</a>}
                {canReview && <>
                  <button type="button" onClick={() => void review(item.orderId, 'approve')} disabled={isBusy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Setujui</button>
                  <button type="button" onClick={() => void review(item.orderId, 'reject')} disabled={isBusy} className="inline-flex items-center gap-2 rounded-xl bg-red-600/80 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Tolak</button>
                </>}
              </div>
              {item.reviewNote && <p className="mt-3 text-xs text-slate-500">Catatan: {item.reviewNote}</p>}
            </article>
          );
        })}
      </div>
    </main>
  );
}
