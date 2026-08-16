'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/context/UserContext';
import { Crown, CheckCircle2, X, MessageCircle, ShieldCheck } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const { upgradeToPro } = useUser();
  const [voucher, setVoucher] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // NOMOR WHATSAPP KAMU
  const ADMIN_WA = '6285707203981';

  const userEmail = session?.user?.email || 'Belum Login';
  const waMessage = encodeURIComponent(
    `Halo Admin Nexora, saya sudah transfer Rp49.000 via DANA untuk aktivasi Nexora PRO.\n\nEmail Akun: ${userEmail}\nMohon segera kirimkan kode aktivasinya ya!`
  );
  const waUrl = `https://wa.me/${ADMIN_WA}?text=${waMessage}`;

  const handleVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucher.trim().toUpperCase() === 'NEXORAPRO' || voucher.trim().toUpperCase() === 'AKTIF') {
      upgradeToPro();
      setSuccess(true);
    } else {
      alert('Kode aktivasi salah. Silakan kirim bukti transfer ke WhatsApp admin untuk mendapatkan kode.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
        >
          <X className="w-4 h-4" />
        </button>

        {!success ? (
          <div className="space-y-4 text-center">
            <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Crown className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-black text-white">Pembayaran via DANA</h2>
              <p className="text-[11px] text-slate-400">Scan QRIS DANA di bawah untuk upgrade ke PRO</p>
            </div>

            {/* Gambar Barcode QR DANA Milikmu */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl space-y-1">
              <img
                src="/qrdana.png"
                alt="QR DANA"
                className="w-48 h-48 object-contain rounded-lg"
              />
              <span className="text-xs font-black text-slate-950">Total: Rp 49.000 / Bulan</span>
            </div>

            {/* Tombol Kirim Bukti Transfer ke WA Milikmu */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Konfirmasi / Kirim Bukti ke WA
            </a>

            {/* Form Aktivasi Kode */}
            <form onSubmit={handleVoucher} className="pt-2 border-t border-slate-800 space-y-2">
              <p className="text-[10px] text-slate-400">Masukkan kode aktivasi dari Admin:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="KODE AKTIVASI"
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 font-black text-xs text-slate-950 rounded-xl"
                >
                  Aktifkan
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Selamat! Anda Resmi PRO</h2>
            <p className="text-xs text-slate-300">
              Akun Anda sudah berhasil di-upgrade ke Nexora PRO.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-indigo-600/30"
            >
              Tutup & Nikmati Fitur Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
