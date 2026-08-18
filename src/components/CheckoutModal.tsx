'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  FileImage,
  Loader2,
  ShieldCheck,
  Upload,
  WalletCards,
  X,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

type DanaOrder = {
  orderId: string;
  amount: number;
  status: string;
  accountName: string;
  accountNumber: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, session, isPro } = useUser();
  const [order, setOrder] = useState<DanaOrder | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const proofLabel = useMemo(() => {
    if (!proof) return 'Pilih bukti transfer';
    return `${proof.name} • ${(proof.size / 1024 / 1024).toFixed(2)} MB`;
  }, [proof]);

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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal membuat order pembayaran.');
      }

      setOrder({
        orderId: data.orderId,
        amount: data.amount,
        status: data.status,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal membuat order pembayaran.',
      );
    } finally {
      setLoadingOrder(false);
    }
  };

  const copyDanaNumber = async () => {
    if (!order?.accountNumber) return;

    try {
      await navigator.clipboard.writeText(order.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Browser tidak mengizinkan akses clipboard.');
    }
  };

  const uploadProof = async () => {
    if (!session?.access_token || !order || !proof) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(proof.type)) {
      setError('Bukti transfer harus berupa JPG, PNG, atau WebP.');
      return;
    }

    if (proof.size > 4 * 1024 * 1024) {
      setError('Ukuran bukti transfer maksimal 4 MB.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.set('orderId', order.orderId);
      formData.set('proof', proof);

      const response = await fetch('/api/payments/proof', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal mengunggah bukti transfer.');
      }

      window.location.assign(
        `/payment/finish?orderId=${encodeURIComponent(order.orderId)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah bukti transfer.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative my-6 w-full max-w-md space-y-5 rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-800/60 p-2 text-slate-400 hover:text-white"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2 text-center">
          <div className="inline-flex rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
            <Crown className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">Nexora PRO</h2>
          <p className="text-3xl font-black text-white">
            Rp49.000{' '}
            <span className="text-xs font-medium text-slate-400">/ 30 hari</span>
          </p>
        </div>

        {isPro ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs font-semibold text-emerald-300">
            Akun kamu sudah aktif sebagai PRO.
          </div>
        ) : !user ? (
          <div className="space-y-3">
            <p className="text-center text-xs text-slate-300">
              Login diperlukan agar pembayaran terhubung ke akun kamu.
            </p>
            <Link
              href="/login"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500"
            >
              Masuk / Daftar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : !order ? (
          <>
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-start gap-3">
                <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                <div>
                  <p className="text-xs font-bold text-white">Transfer manual via DANA</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    Sistem membuat order terlebih dahulu. Nomor tujuan DANA
                    ditampilkan setelah order berhasil dibuat.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white">Verifikasi bukti transfer</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    PRO hanya aktif setelah bukti transfer diperiksa dan
                    disetujui admin.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={createOrder}
              disabled={loadingOrder}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-60"
            >
              {loadingOrder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WalletCards className="h-4 w-4" />
              )}
              {loadingOrder ? 'Membuat order...' : 'Lanjut Pembayaran'}
            </button>
          </>
        ) : order.status === 'pending_review' ? (
          <>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-amber-400" />
              <p className="mt-3 text-sm font-black text-white">
                Bukti transfer sedang diperiksa
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Order ini sudah memiliki bukti transfer. Tunggu admin
                menyelesaikan verifikasi.
              </p>
            </div>
            <Link
              href={`/payment/finish?orderId=${encodeURIComponent(order.orderId)}`}
              className="block w-full rounded-xl bg-indigo-600 py-3 text-center text-xs font-bold text-white hover:bg-indigo-500"
            >
              Lihat Status Pembayaran
            </Link>
          </>
        ) : (
          <>
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Order ID</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-300">{order.orderId}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nominal transfer</p>
                <p className="mt-1 text-xl font-black text-amber-400">{formatRupiah(order.amount)}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tujuan DANA</p>
                <p className="mt-1 text-xs font-bold text-white">{order.accountName}</p>

                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm font-bold text-sky-300">
                    {order.accountNumber}
                  </code>
                  <button
                    type="button"
                    onClick={copyDanaNumber}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:text-white"
                    aria-label="Salin nomor DANA"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-[11px] leading-relaxed text-amber-200">
              Transfer sesuai nominal yang tertera. Setelah selesai, unggah
              screenshot bukti transaksi. Jangan unggah data sensitif lain yang
              tidak diperlukan.
            </div>

            <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-4 hover:border-slate-600">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  setProof(event.target.files?.[0] || null);
                  setError('');
                }}
              />
              <div className="flex items-center gap-3">
                <FileImage className="h-5 w-5 shrink-0 text-indigo-400" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Bukti transfer</p>
                  <p className="mt-1 truncate text-[11px] text-slate-400">{proofLabel}</p>
                </div>
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>
            )}

            <button
              type="button"
              onClick={uploadProof}
              disabled={!proof || uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Mengunggah...' : 'Kirim Bukti Transfer'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
