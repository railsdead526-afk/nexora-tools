'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';
import { 
  ArrowLeft, Crown, Sparkles, Download, 
  UploadCloud, RefreshCw, CheckCircle2, Palette 
} from 'lucide-react';

export default function BgRemoverPage() {
  const { isPro, session } = useUser();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [quotaLimit, setQuotaLimit] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      setQuotaRemaining(null);
      setQuotaLimit(null);
      return;
    }

    const controller = new AbortController();

    fetch('/api/quota/status?tool=bg_remover', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Gagal memuat quota.');
        setQuotaRemaining(Number(data.remaining || 0));
        setQuotaLimit(Number(data.limit || 0));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Background remover quota status error:', error);
      });

    return () => controller.abort();
  }, [session?.access_token]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!session?.access_token) {
      input.value = '';
      alert('Login dulu untuk menggunakan Background Remover.');
      window.location.href = '/login';
      return;
    }

    try {
      const quotaResponse = await fetch('/api/quota/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tool: 'bg_remover' }),
      });
      const quotaData = await quotaResponse.json();

      if (!quotaResponse.ok) {
        input.value = '';
        if (quotaResponse.status === 429 && !isPro) setIsModalOpen(true);
        alert(quotaData?.error || 'Quota tidak dapat diproses.');
        return;
      }

      setQuotaRemaining(Number(quotaData?.quota?.remaining || 0));
      setQuotaLimit(Number(quotaData?.quota?.limit || 0));
    } catch {
      input.value = '';
      alert('Gagal memeriksa quota. Coba lagi.');
      return;
    }

    setOriginalFile(file);
    setFinalImageUrl(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setOriginalSrc(src);
      renderCutout(src, bgColor);
    };
    reader.readAsDataURL(file);
  };

  const renderCutout = (src: string, color: string) => {
    setLoading(true);
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      canvas.width = isPro ? w : Math.min(w, 1080);
      canvas.height = isPro ? h : Math.min(h, Math.round(1080 * (h / w)));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 1. Gambar foto asli
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // 2. Analisa warna latar belakang atas
      const topSamples = [
        [0, 0],
        [Math.floor(canvas.width / 2), 0],
        [canvas.width - 1, 0]
      ];

      let rAvg = 0, gAvg = 0, bAvg = 0;
      for (const [sx, sy] of topSamples) {
        const idx = (sy * canvas.width + sx) * 4;
        rAvg += data[idx];
        gAvg += data[idx + 1];
        bAvg += data[idx + 2];
      }
      rAvg = Math.round(rAvg / topSamples.length);
      gAvg = Math.round(gAvg / topSamples.length);
      bAvg = Math.round(bAvg / topSamples.length);

      // 3. Lindungi tubuh & hapus background atas
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.65;
      const rx = canvas.width * 0.4;
      const ry = canvas.height * 0.45;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const colorDist = Math.sqrt((r - rAvg) ** 2 + (g - gAvg) ** 2 + (b - bAvg) ** 2);
          const inBody = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1.0;

          if (colorDist < 50 && !inBody) {
            data[idx + 3] = 0;
          } else if (y < canvas.height * 0.25 && colorDist < 65) {
            data[idx + 3] = 0;
          }
        }
      }

      // 4. Buat canvas output dengan background warna baru
      const outCanvas = document.createElement('canvas');
      outCanvas.width = canvas.width;
      outCanvas.height = canvas.height;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return;

      if (color !== 'transparent') {
        outCtx.fillStyle = color;
        outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
      }

      ctx.putImageData(imgData, 0, 0);
      outCtx.drawImage(canvas, 0, 0);

      setFinalImageUrl(outCanvas.toDataURL('image/png'));
      setLoading(false);
    };
  };

  const handleColorChange = (color: string) => {
    setBgColor(color);
    if (originalSrc) {
      renderCutout(originalSrc, color);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Photo Studio Engine
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">AI Background Remover & Pas Foto</h1>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Ganti warna latar foto menjadi <strong>Pas Foto Merah / Biru</strong> atau <strong>Transparan (PNG)</strong> langsung di browser.
        </p>

        {isPro && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Crown className="w-4 h-4" /> Mode PRO: Unduh Ultra HD 4K
          </div>
        )}

      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl space-y-5">
        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-slate-950 transition-all">
          <input
            type="file"
            accept="image/*"
            id="photo-upload"
            className="hidden"
            onChange={handleImageUpload}
          />
          <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xs md:text-sm text-emerald-400">
                {originalFile ? originalFile.name : 'Pilih Foto dari Galeri HP'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Mendukung JPG, PNG, WebP</p>
            </div>
          </label>
        </div>

        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-emerald-400" /> Pilihan Latar Belakang & Pas Foto:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleColorChange('transparent')}
              className={`p-2.5 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                bgColor === 'transparent' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              🏁 Transparan (PNG)
            </button>
            <button
              type="button"
              onClick={() => handleColorChange('#dc2626')}
              className={`p-2.5 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                bgColor === '#dc2626' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-md shadow-red-500/10' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              🔴 Merah (KTP)
            </button>
            <button
              type="button"
              onClick={() => handleColorChange('#2563eb')}
              className={`p-2.5 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                bgColor === '#2563eb' ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              🔵 Biru (Ijazah)
            </button>
            <button
              type="button"
              onClick={() => handleColorChange('#ffffff')}
              className={`p-2.5 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                bgColor === '#ffffff' ? 'bg-slate-200 border-white text-slate-950 font-black shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              ⚪ Putih (Produk)
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-3 shadow-2xl">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs font-bold text-white">Sedang Memproses Foto...</p>
        </div>
      )}

      {finalImageUrl && !loading && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/40 space-y-5 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Foto Berhasil Diproses!
          </div>

          <div className="max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-2xl p-2 bg-slate-950 flex items-center justify-center">
            <div className={`w-full rounded-xl overflow-hidden ${bgColor === 'transparent' ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]' : ''}`}>
              <img
                src={finalImageUrl}
                alt="Hasil Cutout"
                className="w-full h-auto object-contain rounded-lg max-h-[340px]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={finalImageUrl}
              download={bgColor === 'transparent' ? 'nexora_transparent.png' : 'nexora_pasfoto.png'}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Foto PNG {isPro ? '(Ultra HD 4K)' : '(Kualitas Standar)'}
            </a>

            {!isPro && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 font-bold text-[11px] text-amber-400 rounded-xl flex items-center justify-center gap-1 transition-all"
              >
                <Crown className="w-3.5 h-3.5" /> Buka Unduhan Resolusi Penuh 4K (Upgrade PRO)
              </button>
            )}
          </div>
        </div>
      )}

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
