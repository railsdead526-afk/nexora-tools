'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check } from 'lucide-react';

export default function CaseConverterPage() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const toUpper = () => setText(text.toUpperCase());
  const toLower = () => setText(text.toLowerCase());
  const toTitle = () => {
    setText(text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
  };
  const toSlug = () => {
    setText(text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Case & Text Converter</h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Ubah kapitalisasi teks dan hitung jumlah kata secara instan.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          rows={6}
          placeholder="Ketik atau tempel teks di sini..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 bg-slate-900/80 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs md:text-sm text-white placeholder-slate-500"
        />

        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>{wordCount} Kata | {charCount} Karakter</span>
          {text && (
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 text-indigo-400 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Teks'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          <button onClick={toUpper} className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">UPPERCASE</button>
          <button onClick={toLower} className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">lowercase</button>
          <button onClick={toTitle} className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">Title Case</button>
          <button onClick={toSlug} className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">slug-url</button>
        </div>
      </div>
    </div>
  );
}
