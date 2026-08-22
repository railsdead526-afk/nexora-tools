'use client';

import AdSlot from '@/components/AdSlot';

import { useCallback, useEffect, useState } from 'react';
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

function randomIndex(max: number): number {
  if (
    typeof globalThis.crypto === 'undefined' ||
    typeof globalThis.crypto.getRandomValues !== 'function'
  ) {
    throw new Error('Web Crypto API tidak tersedia di browser ini.');
  }

  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / max) * max;
  const values = new Uint32Array(1);

  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % max;
}

function shuffle(values: string[]): string[] {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createPassword(
  length: number,
  lower: boolean,
  upper: boolean,
  numbers: boolean,
  symbols: boolean,
): string {
  const groups: string[] = [];

  if (lower) groups.push(LOWER);
  if (upper) groups.push(UPPER);
  if (numbers) groups.push(NUMBERS);
  if (symbols) groups.push(SYMBOLS);

  if (groups.length === 0) {
    throw new Error('Pilih minimal satu jenis karakter.');
  }

  const characters: string[] = [];

  for (const group of groups) {
    characters.push(group[randomIndex(group.length)]);
  }

  const pool = groups.join('');

  while (characters.length < length) {
    characters.push(pool[randomIndex(pool.length)]);
  }

  return shuffle(characters).join('');
}


export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(20);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(
    () => {
      try {
        const generated = createPassword(
          length,
          useLower,
          useUpper,
          useNumbers,
          useSymbols,
        );

        setPassword(generated);
        setError('');
        setCopied(false);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Password gagal dibuat.';

        setPassword('');
        setError(message);
      }
    },
    [length, useLower, useUpper, useNumbers, useSymbols],
  );

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Browser tidak mengizinkan akses clipboard.');
    }
  };

  const enabledGroups =
    Number(useLower) +
    Number(useUpper) +
    Number(useNumbers) +
    Number(useSymbols);

  const strength =
    password.length >= 24 && enabledGroups >= 3
      ? 'Sangat Kuat'
      : password.length >= 16 && enabledGroups >= 2
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
      <AdSlot className="mt-6" />
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Katalog
      </Link>

      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Security Tool
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          Secure Password Generator
        </h1>

        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Buat password acak menggunakan Web Crypto API langsung di
          perangkat. Password tidak dikirim atau disimpan oleh Nexora.
        </p>
      </header>

      <section className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 md:p-7 shadow-2xl space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="break-all font-mono text-sm md:text-base text-white min-h-6">
                {password || 'Belum ada password.'}
              </p>

              {password && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-emerald-400">
                  <span>Kekuatan: {strength}</span>
                  <span>Panjang aktual: {password.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Panjang Password</span>
            <span className="text-emerald-400">
              {length} karakter
            </span>
          </div>

          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(event) =>
              setLength(Number(event.target.value))
            }
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
              <span>{option.label}</span>

              <input
                type="checkbox"
                checked={option.value}
                onChange={(event) =>
                  option.setter(event.target.checked)
                }
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
          Password dibuat menggunakan sumber angka acak kriptografis
          <strong> crypto.getRandomValues()</strong>. Isi password tidak
          dikirim ke endpoint diagnostic.
        </div>
      </section>
    </div>
  );
}
