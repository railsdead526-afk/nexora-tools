'use client';

import AdSlot from '@/components/AdSlot';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';

export default function QrGeneratorPage() {
  const [text, setText] = useState('https://nexora-tools.com');
  const [qrUrl, setQrUrl] = useState('');
  const [darkColor, setDarkColor] = useState('#000000');

  const generateQR = async (content: string, color: string) => {
    if (!content.trim()) return;
    try {
      const url = await QRCode.toDataURL(content, {
        width: 600,
        margin: 2,
        color: {
          dark: color,
          light: '#ffffff',
        },
      });
      setQrUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    generateQR('https://nexora-tools.com', '#000000');
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    generateQR(val, darkColor);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDarkColor(val);
    generateQR(text, val);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <AdSlot className="mt-6" />
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">QR Code Studio</h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Buat barcode QR Code resolusi tinggi kustom untuk link web, nomor WhatsApp, atau teks biasa.
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Isi Link / Teks:</label>
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="https://instagram.com/akun-kamu"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs md:text-sm text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Pilih Warna QR:</label>
          <input
            type="color"
            value={darkColor}
            onChange={handleColorChange}
            className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
          />
        </div>

        {qrUrl && (
          <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-3 bg-white rounded-2xl shadow-xl">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
            </div>

            <a
              href={qrUrl}
              download="nexora-qrcode.png"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs rounded-xl transition-all text-white shadow-lg shadow-indigo-600/30"
            >
              <Download className="w-4 h-4" /> Download QR Code (HD PNG)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
