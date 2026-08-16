'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';
import { ArrowLeft, Check, Crown, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const { isPro } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 space-y-8 text-center">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
      </Link>

      <div className="space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Crown className="w-3.5 h-3.5" /> Nexora Membership Plan
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">
          Tingkatkan Produktivitas Tanpa Batas
        </h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Pilih paket yang sesuai dengan kebutuhan konten & pekerjaan harianmu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto pt-4">
        {/* Free Plan */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Gratis Selamanya</h3>
            <p className="text-2xl font-extrabold text-white">Rp 0 <span className="text-xs text-slate-400 font-normal">/bulan</span></p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Akses semua tools browser gratis</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Kompres gambar tanpa batas</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Text & Case Converter instan</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> PDF Merge & QR Studio</li>
              <li className="flex items-center gap-2 text-slate-500">✕ Tanpa AI Auto Clipper Pro</li>
            </ul>
          </div>
          <Link href="/" className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-center rounded-xl text-white block">
            Gunakan Gratis
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border border-amber-500/50 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-amber-500/10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4" /> Nexora PRO
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-slate-950">BEST VALUE</span>
            </div>
            <p className="text-2xl font-extrabold text-white">Rp 49.000 <span className="text-xs text-slate-400 font-normal">/bulan</span></p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Unlimited AI Auto Clipper</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Ekspor Video 1080p Tanpa Watermark</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Auto Caption / Subtitle Dinamis</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Prioritas Rendering Server Tercepat</li>
            </ul>
          </div>

          {isPro ? (
            <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs text-center rounded-xl">
              ✓ Paket Pro Sedang Aktif
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 font-bold text-xs text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Langganan Pro Sekarang
            </button>
          )}
        </div>
      </div>

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
