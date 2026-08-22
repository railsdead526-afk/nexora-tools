'use client';

import AdSlot from '@/components/AdSlot';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Minimize2,
  Sparkles,
  Trash2,
  XCircle,
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

  const parse = () => {
    const value = input.trim();

    if (!value) {
      throw new Error('Masukkan JSON terlebih dahulu.');
    }

    return JSON.parse(value);
  };

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(parse(), null, 2);

      setOutput(formatted);
      setStatus({
        type: 'success',
        message: 'JSON valid dan berhasil dirapikan.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'JSON tidak valid.';

      setOutput('');
      setStatus({
        type: 'error',
        message: `JSON tidak valid: ${message}`,
      });

    }
  };

  const handleMinify = () => {
    try {
      const minified = JSON.stringify(parse());

      setOutput(minified);
      setStatus({
        type: 'success',
        message: 'JSON valid dan berhasil di-minify.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'JSON tidak valid.';

      setOutput('');
      setStatus({
        type: 'error',
        message: `JSON tidak valid: ${message}`,
      });

    }
  };

  const handleValidate = () => {
    try {
      const formatted = JSON.stringify(parse(), null, 2);

      setOutput(formatted);
      setStatus({
        type: 'success',
        message: 'JSON valid. Tidak ditemukan kesalahan sintaks.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'JSON tidak valid.';

      setOutput('');
      setStatus({
        type: 'error',
        message: `JSON tidak valid: ${message}`,
      });

    }
  };

  const handleExample = () => {
    const example = {
      app: 'Nexora Tools',
      status: 'active',
      tools: ['JSON Formatter', 'Password Generator'],
      production: true,
    };

    setInput(JSON.stringify(example));
    setOutput('');
    setStatus(null);
  };

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setStatus({
        type: 'error',
        message: 'Browser tidak mengizinkan akses clipboard.',
      });
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setStatus(null);
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <AdSlot className="mt-6" />
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Katalog
      </Link>

      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
          <Code2 className="w-3.5 h-3.5" />
          Developer Tool
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          JSON Formatter & Validator
        </h1>

        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Format, minify, dan validasi JSON langsung di browser tanpa
          mengirim isi JSON ke server.
        </p>
      </header>

      <section className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 md:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-300">
            JSON Input
          </label>

          <button
            type="button"
            onClick={handleExample}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Isi Contoh
          </button>
        </div>

        <textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setStatus(null);
          }}
          spellCheck={false}
          placeholder='{"name":"Nexora","status":"active"}'
          className="w-full min-h-52 resize-y rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200 outline-none focus:border-cyan-500"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleFormat}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 text-xs font-black text-white"
          >
            Format
          </button>

          <button
            type="button"
            onClick={handleMinify}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-black text-white"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Minify
          </button>

          <button
            type="button"
            onClick={handleValidate}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-black text-white"
          >
            Validate
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-900 py-3 text-xs font-black text-slate-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bersihkan
          </button>
        </div>

        {status && (
          <div
            className={`flex items-start gap-2 rounded-2xl border p-4 text-xs font-bold ${
              status.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Hasil
            </span>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!output}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 disabled:text-slate-600"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder="Hasil format atau validasi akan tampil di sini..."
            className="w-full min-h-52 resize-y rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-cyan-200 outline-none"
          />
        </div>

        <p className="text-[11px] text-slate-500">
          Isi JSON tetap diproses lokal di perangkat.
        </p>
      </section>
    </div>
  );
}
