'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Sparkles,
} from 'lucide-react';

type Status = {
  type: 'success' | 'error';
  message: string;
} | null;

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastAction, setLastAction] = useState('Belum ada tombol ditekan.');

  useEffect(() => {
    setHydrated(true);
  }, []);

  const diagnostic = (action: string) => {
    setLastAction(`Tombol ${action} berhasil menerima klik.`);

    void fetch('/api/client-diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'json-formatter',
        action,
      }),
    }).catch(() => {});
  };

  const parseInput = () => {
    if (!input.trim()) {
      throw new Error('Masukkan JSON terlebih dahulu.');
    }

    return JSON.parse(input);
  };

  const handleFormat = () => {
    diagnostic('format');

    try {
      const parsed = parseInput();
      setOutput(JSON.stringify(parsed, null, 2));
      setStatus({
        type: 'success',
        message: 'JSON valid dan berhasil dirapikan.',
      });
    } catch (error) {
      setOutput('');
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? `JSON tidak valid: ${error.message}`
            : 'JSON tidak valid.',
      });
    }
  };

  const handleMinify = () => {
    diagnostic('minify');

    try {
      const parsed = parseInput();
      setOutput(JSON.stringify(parsed));
      setStatus({
        type: 'success',
        message: 'JSON valid dan berhasil diperkecil.',
      });
    } catch (error) {
      setOutput('');
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? `JSON tidak valid: ${error.message}`
            : 'JSON tidak valid.',
      });
    }
  };

  const handleValidate = () => {
    diagnostic('validate');

    try {
      parseInput();
      setStatus({
        type: 'success',
        message: 'JSON valid. Tidak ditemukan kesalahan sintaks.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? `JSON tidak valid: ${error.message}`
            : 'JSON tidak valid.',
      });
    }
  };

  const handleCopy = async () => {
    const value = output || input;

    if (!value.trim()) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setStatus(null);
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Katalog
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
          <Code className="w-3.5 h-3.5" />
          Developer Tool
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          JSON Formatter & Validator
        </h1>

        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Rapikan, minify, dan validasi JSON langsung di browser. Data tidak
          dikirim ke server.
        </p>
      </div>

      <div className={`rounded-2xl border p-4 text-xs font-bold ${
        hydrated
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
          : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
      }`}>
        <p>
          JavaScript: {hydrated ? 'AKTIF' : 'MENUNGGU HYDRATION'}
        </p>
        <p className="mt-1 opacity-80">
          {lastAction}
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 md:p-7 shadow-2xl space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">
            JSON Input
          </label>

          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setStatus(null);
            }}
            spellCheck={false}
            placeholder='{"name":"Nexora","status":"active"}'
            className="w-full min-h-56 resize-y rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleFormat}
            className="py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-colors"
          >
            Format
          </button>

          <button
            type="button"
            onClick={handleMinify}
            className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-colors"
          >
            Minify
          </button>

          <button
            type="button"
            onClick={handleValidate}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-colors"
          >
            Validate
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-black transition-colors"
          >
            Bersihkan
          </button>
        </div>

        {status && (
          <div
            className={`rounded-2xl border p-4 text-xs font-bold ${
              status.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {status.message}
          </div>
        )}

        {output && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Hasil
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>

            <pre className="max-h-96 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-cyan-200 whitespace-pre-wrap break-words">
              {output}
            </pre>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Sparkles className="w-3.5 h-3.5" />
          Semua proses berjalan lokal di perangkat.
        </div>
      </div>
    </div>
  );
}
