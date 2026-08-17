'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';
import { ArrowLeft, Check, Crown, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const { isPro, daysLeft } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 space-y-8 text-center">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
      </Link>

      <div className="space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Crown className="w-3.5 h-3.5" /> Nexora Membership
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">Paket sederhana, aktivasi otomatis</h1>
        <p className="text-slate-400 text-xs md:text-sm">Bayar melalui checkout QRIS dan status PRO diperbarui otomatis setelah transaksi terverifikasi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto pt-4">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Free</h3>
            <p className="text-2xl font-extrabold text-white">Rp0 <span className="text-xs text-slate-400 font-normal">/bulan</span></p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Tools browser dasar</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Image compressor</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> PDF tools</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> QR, UUID, dan text tools</li>
            </ul>
          </div>
          <Link href="/" className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-center rounded-xl text-white block">Gunakan Gratis</Link>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border border-amber-500/50 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-amber-500/10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-1.5"><Crown className="w-4 h-4" /> Nexora PRO</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-slate-950">30 HARI</span>
            </div>
            <p className="text-2xl font-extrabold text-white">Rp49.000 <span className="text-xs text-slate-400 font-normal">/30 hari</span></p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Status PRO tersimpan di akun</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Akses fitur premium yang ditandai PRO</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Masa aktif bertambah otomatis setelah pembayaran sukses</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Checkout QRIS otomatis tanpa kode voucher</li>
            </ul>
          </div>

          {isPro ? (
            <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs text-center rounded-xl">✓ PRO aktif • {daysLeft} hari tersisa</div>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 font-bold text-xs text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Langganan PRO
            </button>
          )}
        </div>
      </div>

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
