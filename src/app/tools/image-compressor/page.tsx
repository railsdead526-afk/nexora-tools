'use client';

import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import Link from 'next/link';
import { ArrowLeft, Download, UploadCloud, RefreshCw } from 'lucide-react';

export default function ImageCompressorPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    setLoading(true);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const output = await imageCompression(file, options);
      setCompressedFile(output);
      setCompressedUrl(URL.createObjectURL(output));
    } catch (error) {
      console.error('Gagal mengompres gambar:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Image Compressor</h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Kompres file JPG/PNG kamu langsung di browser tanpa batas.
        </p>
      </div>

      <div className="border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 text-center bg-slate-900/40">
        <input
          type="file"
          accept="image/*"
          id="file-upload"
          className="hidden"
          onChange={handleImageUpload}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="font-semibold text-sm text-indigo-400">Pilih gambar</span>
            <p className="text-xs text-slate-500 mt-1">Mendukung JPG, PNG, WEBP</p>
          </div>
        </label>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-indigo-400 py-4 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin" /> Memproses kompresi...
        </div>
      )}

      {compressedFile && originalFile && !loading && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <div>
              <p className="text-slate-400">Ukuran Asli</p>
              <p className="font-bold text-red-400 text-sm">{formatSize(originalFile.size)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Ukuran Baru</p>
              <p className="font-bold text-emerald-400 text-sm">{formatSize(compressedFile.size)}</p>
            </div>
          </div>

          <a
            href={compressedUrl}
            download={`compressed_${originalFile.name}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs rounded-xl transition-all text-white"
          >
            <Download className="w-4 h-4" /> Download Gambar
          </a>
        </div>
      )}
    </div>
  );
}
