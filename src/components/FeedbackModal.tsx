'use client';

import { useState } from 'react';
import { Bug, CheckCircle2, Lightbulb, MessageCircle, MessageSquarePlus, Send, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, session } = useUser();
  const [type, setType] = useState<'Bug' | 'Saran' | 'Pertanyaan'>('Bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const ADMIN_WA = '6285707203981';
  const userEmail = user?.email || 'Anonim';

  const handleSendWA = () => {
    if (!message.trim()) {
      alert('Silakan tulis pesan terlebih dahulu.');
      return;
    }

    const text = encodeURIComponent(
      `Halo Admin Nexora, saya ingin mengirim ${type.toUpperCase()}:\n\n"${message}"\n\nEmail Pengirim: ${userEmail}`,
    );
    window.open(`https://wa.me/${ADMIN_WA}?text=${text}`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleSubmitSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Gagal menyimpan laporan.');

      setSubmitted(true);
      setMessage('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal mengirim ke sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60" aria-label="Tutup">
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><MessageSquarePlus className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-black text-white">Pusat Laporan & Saran</h2>
                <p className="text-xs text-slate-400">Bantu kami menyempurnakan Nexora Tools</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {([
                ['Bug', Bug, 'red'],
                ['Saran', Lightbulb, 'amber'],
                ['Pertanyaan', MessageCircle, 'indigo'],
              ] as const).map(([value, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    type === value ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {value}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              maxLength={3000}
              required
              placeholder={type === 'Bug' ? 'Jelaskan error yang kamu temukan...' : 'Tuliskan masukan kamu...'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />

            <div className="space-y-2 pt-1">
              <button type="button" onClick={handleSendWA} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all">
                <MessageCircle className="w-4 h-4" /> Kirim via WhatsApp
              </button>
              <button type="button" onClick={handleSubmitSystem} disabled={loading} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 font-semibold text-xs text-slate-300 rounded-xl flex items-center justify-center gap-2">
                <Send className="w-3.5 h-3.5" /> {loading ? 'Mengirim...' : 'Simpan Laporan ke Web'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-10 h-10" /></div>
            <h2 className="text-lg font-bold text-white">Terima Kasih</h2>
            <p className="text-xs text-slate-300">Laporan sudah tersimpan.</p>
            <button onClick={() => { setSubmitted(false); onClose(); }} className="w-full py-2.5 bg-indigo-600 font-bold text-xs text-white rounded-xl">Tutup</button>
          </div>
        )}
      </div>
    </div>
  );
}
