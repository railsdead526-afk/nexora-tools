'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';

 type PaymentStatus = {
  orderId: string;
  amount: number;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  paidAt?: string | null;
  reviewNote?: string | null;
};

function PaymentFinishContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { session, refreshStatus } = useUser();
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const token = session?.access_token;

    if (!token || !orderId) return;

    const load = async () => {
      try {
        const response = await fetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Gagal memuat status pembayaran.');
        if (cancelled) return;
        setPayment(data as PaymentStatus);
        if (data.status === 'paid') await refreshStatus();
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat status pembayaran.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, retry, refreshStatus, session?.access_token]);

  const isPaid = payment?.status === 'paid';
  const isPendingReview = payment?.status === 'pending_review' || payment?.status === 'pending';
  const isRejected = payment?.status === 'rejected';

  let title = 'Menunggu pembayaran';
  let description = 'Selesaikan transfer dan kirim bukti pembayaran untuk diproses.';
  let icon = <Clock3 className="mx-auto h-12 w-12 text-amber-400" />;
  if (isPendingReview) {
    title = 'Bukti sedang direview';
    description = 'Admin akan memeriksa bukti pembayaran. PRO aktif 30 hari sejak pembayaran disetujui.';
  } else if (isPaid) {
    title = 'Pembayaran disetujui';
    description = 'Nexora PRO sudah aktif di akun kamu selama 30 hari dari waktu persetujuan.';
    icon = <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />;
  } else if (isRejected) {
    title = 'Bukti pembayaran ditolak';
    description = payment?.reviewNote || 'Silakan buat order baru dan kirim bukti pembayaran yang lebih jelas.';
    icon = <XCircle className="mx-auto h-12 w-12 text-red-400" />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">
        {!orderId ? (
          <><XCircle className="mx-auto h-11 w-11 text-red-400" /><h1 className="text-xl font-black text-white">Order ID tidak ditemukan</h1><p className="text-sm text-slate-400">Buka pembayaran dari halaman harga.</p></>
        ) : loading ? (
          <><Loader2 className="mx-auto h-11 w-11 animate-spin text-indigo-400" /><h1 className="text-xl font-black text-white">Memuat status pembayaran</h1><p className="text-sm text-slate-400">Kami mengambil status terbaru dari server.</p></>
        ) : error ? (
          <><XCircle className="mx-auto h-11 w-11 text-red-400" /><h1 className="text-xl font-black text-white">Status gagal dimuat</h1><p className="text-sm text-red-300">{error}</p></>
        ) : (
          <>{icon}<h1 className="text-2xl font-black text-white">{title}</h1><p className="text-sm leading-relaxed text-slate-400">{description}</p></>
        )}

        {payment && <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Order ID</p><p className="mt-1 break-all font-mono text-xs text-slate-300">{payment.orderId}</p><div className="mt-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p><p className="mt-1 text-xs font-bold uppercase text-slate-200">{payment.status}</p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nominal</p><p className="mt-1 text-xs font-bold text-slate-200">Rp{payment.amount.toLocaleString('id-ID')}</p></div></div></div>}

        {orderId && !isPaid && <button type="button" onClick={() => { setLoading(true); setError(''); setRetry((value) => value + 1); }} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Cek Status Lagi</button>}
        <Link href={isRejected || !orderId ? '/pricing' : '/'} className="block w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500">{isRejected || !orderId ? 'Kembali ke Pembayaran' : 'Kembali ke Nexora'}</Link>
      </div>
    </div>
  );
}

export default function PaymentFinishPage() {
  return <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-slate-400">Memuat pembayaran...</div>}><PaymentFinishContent /></Suspense>;
}
