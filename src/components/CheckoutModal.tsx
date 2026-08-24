'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  Upload,
  WalletCards,
  X,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { formatRupiah } from '@/lib/payments/config';

type ManualInstructions = {
  method: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  durationDays: number;
};

type ManualOrder = {
  orderId: string;
  amount: number;
  status: string;
  instructions: ManualInstructions;
};

export default function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, session, isPro } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [order, setOrder] = useState<ManualOrder | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const createOrder = async () => {
    if (!session?.access_token) {
      setError('Sesi login tidak ditemukan. Silakan login ulang.');
      return;
    }

    setLoadingOrder(true);
    setError('');
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Gagal menyiapkan pembayaran.');
      setOrder(data as ManualOrder);
      setSubmitted(data.status === 'pending_review');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Gagal menyiapkan pembayaran.');
    } finally {
      setLoadingOrder(false);
    }
  };

  const submitProof = async () => {
    if (!session?.access_token || !order || !file) {
      setError('Pilih bukti pembayaran terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.set('orderId', order.orderId);
      formData.set('proof', file);
      const response = await fetch('/api/payments/proof', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Gagal mengunggah bukti.');
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal mengunggah bukti.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative my-6 w-full max-w-md space-y-5 rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-slate-800/60 p-2 text-slate-400 hover:text-white" aria-label="Tutup">
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2 text-center">
          <div className="inline-flex rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400"><Crown className="h-6 w-6" /></div>
          <h2 className="text-xl font-black text-white">Nexora PRO</h2>
          <p className="text-3xl font-black text-white">Rp49.000 <span className="text-xs font-medium text-slate-400">/ 30 hari</span></p>
        </div>

        {isPro ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs font-semibold text-emerald-300">Akun kamu sudah aktif sebagai PRO.</div>
        ) : !user ? (
          <div className="space-y-3">
            <p className="text-center text-xs text-slate-300">Login diperlukan agar pembayaran terhubung ke akun kamu.</p>
            <Link href="/login" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500">Masuk / Daftar <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : !order ? (
          <>
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-start gap-3"><WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" /><div><p className="text-xs font-bold text-white">Pembayaran manual</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Klik tombol untuk mendapatkan nomor order dan instruksi transfer.</p></div></div>
              <div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" /><div><p className="text-xs font-bold text-white">Aktivasi setelah review</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Admin akan memeriksa bukti. PRO aktif 30 hari sejak pembayaran disetujui.</p></div></div>
            </div>
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
            <button type="button" onClick={() => void createOrder()} disabled={loadingOrder} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 py-3.5 text-xs font-black text-slate-950 disabled:opacity-60">{loadingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}{loadingOrder ? 'Menyiapkan instruksi...' : 'Lihat Instruksi Pembayaran'}</button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-slate-300">
              <p className="font-bold text-white">Transfer {formatRupiah(order.amount)}</p>
              <p className="mt-2">Metode: <strong>{order.instructions.method}</strong></p>
              <p className="mt-1">Atas nama: <strong>{order.instructions.accountName}</strong></p>
              <p className="mt-1 break-all font-mono text-sm text-sky-300">{order.instructions.accountNumber}</p>
              <p className="mt-2 leading-relaxed text-slate-400">{order.instructions.instructions}</p>
              <p className="mt-3 border-t border-slate-800 pt-3 font-mono text-[11px] text-slate-500">Order: {order.orderId}</p>
            </div>

            {submitted ? (
              <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" /><p className="text-xs font-bold text-emerald-300">Bukti sudah dikirim untuk direview.</p><Link href={`/payment/finish?orderId=${encodeURIComponent(order.orderId)}`} onClick={onClose} className="inline-flex items-center gap-2 text-xs font-bold text-white underline">Lihat status pembayaran <ArrowRight className="h-3.5 w-3.5" /></Link></div>
            ) : (
              <>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 py-4 text-xs font-bold text-slate-300 hover:border-sky-400"> <Upload className="h-4 w-4" /> {file ? file.name : 'Pilih bukti transfer (JPG, PNG, PDF)'}</button>
                {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
                <button type="button" onClick={() => void submitProof()} disabled={submitting || !file} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-black text-white disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{submitting ? 'Mengunggah bukti...' : 'Kirim Bukti untuk Review'}</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
