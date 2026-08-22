'use client';

import AdSlot from '@/components/AdSlot';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Sparkles, Copy, Check, Mail, 
  Sliders, CheckCircle2 
} from 'lucide-react';

export default function GmailGeneratorPage() {
  const [username, setUsername] = useState('nexoratools');
  const [mode, setMode] = useState<'dot' | 'plus' | 'both'>('dot');
  const [results, setResults] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    if (results.length === 0) return;
    navigator.clipboard.writeText(results.join('\n'));
    setCopiedKey('all');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.replace(/@.*$/, '').replace(/\./g, '').trim().toLowerCase();
    if (!cleanUser) return;

    const emailList: string[] = [];

    // Trik Titik (.)
    if (mode === 'dot' || mode === 'both') {
      const len = cleanUser.length;
      const totalCombinations = Math.min(64, Math.pow(2, len - 1));

      for (let i = 0; i < totalCombinations; i++) {
        let email = '';
        for (let j = 0; j < len; j++) {
          email += cleanUser[j];
          if (j < len - 1 && (i & (1 << j))) {
            email += '.';
          }
        }
        emailList.push(`${email}@gmail.com`);
      }
    }

    // Trik Plus (+) Tag
    if (mode === 'plus' || mode === 'both') {
      const tags = ['1', '2', '3', 'promo', 'game', 'app', 'test', 'acc', 'vip', 'sub', 'order', 'bonus'];
      for (const tag of tags) {
        emailList.push(`${cleanUser}+${tag}@gmail.com`);
      }
    }

    setResults(Array.from(new Set(emailList)));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <AdSlot className="mt-6" />
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      {/* Header Banner yang Aman dari Navbar */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold shadow-sm">
          <Mail className="w-3.5 h-3.5 text-amber-400" /> Gmail Trick Studio
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Gmail Dot & Alias Generator</h1>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Ubah 1 akun Gmail jadi puluhan email unik untuk daftar akun/promo. Semua pesan masuk tetap mendarat di 1 inbox utamamu!
        </p>
      </div>

      {/* Form Generator */}
      <form onSubmit={handleGenerate} className="p-5 md:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Username Gmail Kamu (Tanpa @gmail.com):</label>
          <div className="flex items-center rounded-2xl overflow-hidden border border-slate-800 focus-within:border-indigo-500 bg-slate-950 transition-colors">
            <input
              type="text"
              required
              placeholder="contoh: budisantoso"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 min-w-0 p-3.5 bg-transparent text-xs md:text-sm text-white focus:outline-none placeholder-slate-600"
            />
            <span className="px-3 md:px-4 py-3.5 bg-slate-900/90 text-xs font-bold text-slate-400 border-l border-slate-800 flex-shrink-0">
              @gmail.com
            </span>
          </div>
        </div>

        {/* Pilihan Metode Trik */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" /> Pilih Metode Trik:
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode('dot')}
              className={`py-3 px-2 rounded-xl border font-bold transition-all text-center ${
                mode === 'dot' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Dot (Titik)
            </button>
            <button
              type="button"
              onClick={() => setMode('plus')}
              className={`py-3 px-2 rounded-xl border font-bold transition-all text-center ${
                mode === 'plus' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Plus (+Tag)
            </button>
            <button
              type="button"
              onClick={() => setMode('both')}
              className={`py-3 px-2 rounded-xl border font-bold transition-all text-center ${
                mode === 'both' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Gabungan
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 hover:from-indigo-400 active:scale-[0.99] font-black text-sm text-white rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Daftar Email Alias Sekarang</span>
        </button>
      </form>

      {/* Hasil Generate Email */}
      {results.length > 0 && (
        <div className="p-5 md:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hasil ({results.length} Email Dibuat):
            </span>
            <button
              type="button"
              onClick={handleCopyAll}
              className="text-xs font-black text-amber-400 hover:underline flex items-center gap-1"
            >
              {copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'all' ? 'Semua Tersalin!' : 'Salin Semua'}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {results.map((email, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs hover:border-slate-700 transition-colors">
                <span className="text-slate-300 font-mono select-all truncate pr-2">{email}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(email, `email_${idx}`)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  title="Salin email"
                >
                  {copiedKey === `email_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
