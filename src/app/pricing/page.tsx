'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Crown, Sparkles } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';

export default function PricingPage() {
  const { isPro, daysLeft } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-center md:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Beranda
      </Link>

      <div className="mx-auto max-w-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
          <Crown className="h-3.5 w-3.5" />
          Nexora Membership
        </div>

        <h1 className="text-3xl font-extrabold text-white md:text-4xl">
          Paket sederhana, akses lebih lengkap
        </h1>

        <p className="text-xs text-slate-400 md:text-sm">
          Pembayaran PRO diproses otomatis via Midtrans — QRIS, GoPay, transfer
          bank, dan e-wallet. PRO aktif seketika setelah pembayaran berhasil.
        </p>
      </div>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 pt-4 text-left md:grid-cols-2">
        <div className="flex flex-col justify-between space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Free</h3>
            <p className="text-2xl font-extrabold text-white">
              Rp0 <span className="text-xs font-normal text-slate-400">/bulan</span>
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Tools browser dasar
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Image compressor
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                PDF tools
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                QR, UUID, JSON, password, dan text tools
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="block w-full rounded-xl bg-slate-800 py-3 text-center text-xs font-semibold text-white hover:bg-slate-700"
          >
            Gunakan Gratis
          </Link>
        </div>

        <div className="relative flex flex-col justify-between space-y-6 rounded-3xl border border-amber-500/50 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 p-6 shadow-2xl shadow-amber-500/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-lg font-bold text-amber-400">
                <Crown className="h-4 w-4" />
                Nexora PRO
              </h3>
              <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
                30 HARI
              </span>
            </div>

            <p className="text-2xl font-extrabold text-white">
              Rp49.000{' '}
              <span className="text-xs font-normal text-slate-400">/30 hari</span>
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                Status PRO tersimpan di akun
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                Akses fitur premium yang ditandai PRO
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                Kuota pemakaian lebih besar untuk downloader & AI tools
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                Bebas iklan di seluruh halaman
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                Masa aktif bertambah 30 hari setelah pembayaran berhasil
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                Bayar via Midtrans: QRIS, GoPay, transfer bank, e-wallet
              </li>
            </ul>
          </div>

          {isPro ? (
            <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-center text-xs font-bold text-emerald-400">
              ✓ PRO aktif • {daysLeft} hari tersisa
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400"
            >
              <Sparkles className="h-4 w-4" />
              Langganan PRO
            </button>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="mx-auto max-w-3xl space-y-6 pt-6 text-left">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8">
          <h2 className="text-base font-extrabold text-white md:text-lg">
            Cara berlangganan PRO
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Login akun',
                desc: 'Daftar gratis dulu — pembayaran akan otomatis terhubung ke akun kamu.',
              },
              {
                step: '2',
                title: 'Pilih metode bayar',
                desc: 'Klik "Lanjut Pembayaran", lalu pilih QRIS, GoPay, transfer bank, atau e-wallet di halaman Midtrans.',
              },
              {
                step: '3',
                title: 'PRO langsung aktif',
                desc: 'Setelah pembayaran sukses, status PRO aktif otomatis dan masa aktif bertambah 30 hari.',
              },
            ].map(item => (
              <div key={item.step} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-xs font-black text-slate-950">
                  {item.step}
                </div>
                <p className="text-xs font-bold text-white">{item.title}</p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8">
          <h2 className="text-base font-extrabold text-white md:text-lg">
            Pertanyaan umum
          </h2>
          <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300">
            <div className="space-y-1">
              <p className="font-bold text-white">Apakah PRO bisa diperpanjang?</p>
              <p className="text-slate-400">
                Bisa. Setiap pembayaran sukses menambah masa aktif 30 hari ke
                sisa masa aktif yang ada — tidak ada batas perpanjangan.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">Bagaimana jika pembayaran gagal atau kedaluwarsa?</p>
              <p className="text-slate-400">
                Transaksi yang gagal/kedaluwarsa tidak mengubah status akun.
                Kamu cukup membuat order baru kapan saja.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">Apakah data pembayaran aman?</p>
              <p className="text-slate-400">
                Ya. Pembayaran diproses sepenuhnya oleh Midtrans (PCI-DSS),
                dan Nexora tidak pernah menyimpan data kartu atau PIN.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
