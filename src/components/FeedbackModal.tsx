'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  X, Bug, Lightbulb, MessageCircle, 
  Send, CheckCircle2, MessageSquarePlus 
} from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const [type, setType] = useState<'Bug' | 'Saran' | 'Pertanyaan'>('Bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const ADMIN_WA = '6285707203981';
  const userEmail = session?.user?.email || 'Anonim';

  // Kirim ke WhatsApp Admin
  const handleSendWA = () => {
    if (!message.trim()) {
      alert('Silakan tulis pesan terlebih dahulu.');
      return;
    }
    const text = encodeURIComponent(
      `Halo Admin Nexora, saya ingin mengirim ${type.toUpperCase()}:\n\n"${message}"\n\nEmail Pengirim: ${userEmail}`
    );
    window.open(`https://wa.me/${ADMIN_WA}?text=${text}`, '_blank');
    onClose();
  };

  // Kirim ke Database Server
  const handleSubmitSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, email: userEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setMessage('');
      }
    } catch (err) {
      alert('Gagal mengirim ke sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Pusat Laporan & Saran</h2>
                <p className="text-xs text-slate-400">Bantu kami menyempurnakan Nexora Tools</p>
              </div>
            </div>

            {/* Pilihan Tipe */}
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setType('Bug')}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Bug' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Bug className="w-3.5 h-3.5" /> Lapor Bug
              </button>
              <button
                type="button"
                onClick={() => setType('Saran')}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Saran' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" /> Saran Fitur
              </button>
              <button
                type="button"
                onClick={() => setType('Pertanyaan')}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Pertanyaan' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Tanya
              </button>
            </div>

            {/* Textarea */}
            <textarea
              rows={4}
              required
              placeholder={
                type === 'Bug'
                  ? 'Jelaskan error yang kamu temukan... (contoh: tombol download tidak merespon di HP saya)'
                  : 'Tuliskan ide tools baru yang ingin kamu ada di web ini...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />

            {/* 2 Opsi Tombol Kirim */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSendWA}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" /> Kirim Cepat via WhatsApp Admin
              </button>

              <button
                type="button"
                onClick={handleSubmitSystem}
                disabled={loading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 rounded-xl flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> {loading ? 'Mengirim...' : 'Simpan Laporan ke Web'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-white">Terima Kasih!</h2>
            <p className="text-xs text-slate-300">Laporan & masukan kamu sudah kami terima dan akan segera kami evaluasi.</p>
            <button
              onClick={() => { setSubmitted(false); onClose(); }}
              className="w-full py-2.5 bg-indigo-600 font-bold text-xs text-white rounded-xl"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
