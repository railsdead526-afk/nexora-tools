'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Crown, ShieldCheck, X, QrCode, ArrowRight } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function CheckoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, session, isPro } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.redirectUrl) throw new Error(data?.error || 'Gagal membuka pembayaran.');

      window.location.assign(data.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka pembayaran.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60" aria-label="Tutup">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Nexora PRO</h2>
          <p className="text-3xl font-black text-white">Rp49.000 <span className="text-xs text-slate-400 font-medium">/ 30 hari</span></p>
        </div>

        {isPro ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center text-xs text-emerald-300 font-semibold">
            Akun kamu sudah aktif sebagai PRO.
          </div>
        ) : !user ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 text-center">Login diperlukan agar pembayaran bisa dikaitkan otomatis ke akun kamu.</p>
            <Link href="/login" onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-xl flex items-center justify-center gap-2">
              Masuk / Daftar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Bayar otomatis via QRIS</p>
                  <p className="text-[11px] text-slate-400 mt-1">Checkout akan dibuka melalui Midtrans. QRIS dapat dibayar dari aplikasi pembayaran yang mendukung QRIS, termasuk DANA.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">PRO aktif otomatis</p>
                  <p className="text-[11px] text-slate-400 mt-1">Setelah pembayaran terverifikasi oleh webhook, masa PRO ditambahkan 30 hari tanpa kode voucher dan tanpa konfirmasi WhatsApp.</p>
                </div>
              </div>
            </div>

            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{error}</div>}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 disabled:opacity-60 font-black text-xs text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" /> {loading ? 'Membuka pembayaran...' : 'Bayar Rp49.000 via QRIS'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
