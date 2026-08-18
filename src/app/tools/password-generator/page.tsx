'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Key,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/';

function secureRandomIndex(max: number): number {
  if (max <= 0) return 0;

  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const array = new Uint32Array(1);

  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);

  return array[0] % max;
}

function secureShuffle(chars: string[]): string[] {
  const result = [...chars];

  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function generateSecurePassword(
  length: number,
  useLower: boolean,
  useUpper: boolean,
  useNumbers: boolean,
  useSymbols: boolean,
): string {
  const groups: string[] = [];

  if (useLower) groups.push(LOWER);
  if (useUpper) groups.push(UPPER);
  if (useNumbers) groups.push(NUMBERS);
  if (useSymbols) groups.push(SYMBOLS);

  if (groups.length === 0) return '';

  const finalLength = Math.max(length, groups.length);
  const allChars = groups.join('');
  const chars: string[] = [];

  for (const group of groups) {
    chars.push(group[secureRandomIndex(group.length)]);
  }

  while (chars.length < finalLength) {
    chars.push(allChars[secureRandomIndex(allChars.length)]);
  }

  return secureShuffle(chars).join('');
}

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(20);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);

  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [lastAction, setLastAction] = useState('Belum ada tombol ditekan.');

  const diagnostic = (action: string) => {
    setLastAction(`Tombol ${action} berhasil menerima klik.`);

    void fetch('/api/client-diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'password-generator',
        action,
      }),
    }).catch(() => {});
  };

  const generate = (sendDiagnostic = true) => {
    if (sendDiagnostic) {
      diagnostic('generate');
    }

    const value = generateSecurePassword(
      length,
      useLower,
      useUpper,
      useNumbers,
      useSymbols,
    );

    if (!value) {
      setPassword('');
      setError('Pilih minimal satu jenis karakter.');
      return;
    }

    setError('');
    setCopied(false);
    setPassword(value);
  };

  useEffect(() => {
    setHydrated(true);
    generate(false);
    // Generate awal saja untuk menghindari password berubah sendiri saat render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    if (!password) return;

    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const enabledGroups =
    Number(useLower) +
    Number(useUpper) +
    Number(useNumbers) +
    Number(useSymbols);

  const strength =
    length >= 20 && enabledGroups >= 3
      ? 'Sangat Kuat'
      : length >= 14 && enabledGroups >= 2
        ? 'Kuat'
        : 'Sedang';

  const options = [
    {
      label: 'Huruf kecil (a-z)',
      value: useLower,
      setter: setUseLower,
    },
    {
      label: 'Huruf besar (A-Z)',
      value: useUpper,
      setter: setUseUpper,
    },
    {
      label: 'Angka (0-9)',
      value: useNumbers,
      setter: setUseNumbers,
    },
    {
      label: 'Simbol (!@#$...)',
      value: useSymbols,
      setter: setUseSymbols,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Katalog
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Security Tool
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          Secure Password Generator
        </h1>

        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Buat password acak menggunakan Web Crypto API langsung di perangkat.
          Password tidak dikirim atau disimpan oleh Nexora.
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

      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 md:p-7 shadow-2xl space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="break-all font-mono text-sm md:text-base text-white">
                {password || 'Pilih jenis karakter lalu generate password.'}
              </p>

              {password && (
                <p className="mt-2 text-[11px] font-bold text-emerald-400">
                  Kekuatan: {strength}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Panjang Password</span>
            <span className="text-emerald-400">{length} karakter</span>
          </div>

          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
            className="w-full accent-emerald-500"
          />

          <div className="flex justify-between text-[10px] text-slate-600">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((option) => (
            <label
              key={option.label}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-slate-300"
            >
              {option.label}

              <input
                type="checkbox"
                checked={option.value}
                onChange={(event) => option.setter(event.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
            </label>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => generate()}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-black text-white hover:bg-emerald-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Baru
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!password}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 py-3.5 text-xs font-black text-white hover:bg-slate-900 disabled:opacity-40 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Password Tersalin' : 'Salin Password'}
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-[11px] leading-relaxed text-emerald-300">
          Generator menggunakan <strong>crypto.getRandomValues()</strong>,
          bukan Math.random(), sehingga cocok untuk membuat password yang
          membutuhkan sumber angka acak kriptografis.
        </div>
      </div>
    </div>
  );
}
