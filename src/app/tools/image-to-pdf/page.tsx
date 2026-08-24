'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { 
  ArrowLeft, Sparkles, Download, 
  UploadCloud, RefreshCw, CheckCircle2,
  Trash2, Sliders,
} from 'lucide-react';

interface SelectedImage {
  id: string;
  name: string;
  buffer: ArrayBuffer;
  previewUrl: string;
  isPng: boolean;
}

export default function ImageToPdfPage() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'FIT'>('A4');
  const [margin, setMargin] = useState<number>(10);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    setLoading(true);
    const loadedList: SelectedImage[] = [];

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type || 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);

        loadedList.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          buffer,
          previewUrl,
          isPng: file.type.includes('png'),
        });
      } catch (error) {
        console.error('Gagal membaca file foto:', error);
      }
    }

    setImages((prev) => [...prev, ...loadedList]);
    setLoading(false);
    setPdfUrl(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setPdfUrl(null);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setPdfUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        let pdfImage;
        try {
          if (item.isPng) {
            pdfImage = await pdfDoc.embedPng(item.buffer);
          } else {
            pdfImage = await pdfDoc.embedJpg(item.buffer);
          }
        } catch {
          try {
            pdfImage = await pdfDoc.embedJpg(item.buffer);
          } catch {
            pdfImage = await pdfDoc.embedPng(item.buffer);
          }
        }

        const imgWidth = pdfImage.width;
        const imgHeight = pdfImage.height;

        let pageWidth = PageSizes.A4[0];
        let pageHeight = PageSizes.A4[1];

        if (pageSize === 'FIT') {
          pageWidth = imgWidth + margin * 2;
          pageHeight = imgHeight + margin * 2;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const availW = pageWidth - margin * 2;
        const availH = pageHeight - margin * 2;
        const scale = Math.min(availW / imgWidth, availH / imgHeight);

        const renderW = imgWidth * scale;
        const renderH = imgHeight * scale;
        const x = (pageWidth - renderW) / 2;
        const y = (pageHeight - renderH) / 2;

        page.drawImage(pdfImage, {
          x,
          y,
          width: renderW,
          height: renderH,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = new Uint8Array(pdfBytes).buffer;
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      alert('Gagal menyusun PDF. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> 100% Free & Unlimited
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Image to PDF Studio</h1>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Ubah kumpulan foto dari galeri HP (KTP, Ijazah, CV, Sertifikat, Pas Foto) jadi 1 dokumen PDF resmi standar A4 secara gratis tanpa batas.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-5">
        <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950 transition-all">
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            multiple
            id="images-upload"
            className="hidden"
            onChange={handleFileSelect}
          />
          <label htmlFor="images-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xs md:text-sm text-indigo-400">+ Pilih Foto Dokumen dari HP (Bebas Banyak)</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Bebas pilih berapa pun foto yang kamu mau (100% Gratis Tanpa Batas)
              </p>
            </div>
          </label>
        </div>

        {/* Pengaturan Format PDF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Ukuran Halaman:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPageSize('A4')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  pageSize === 'A4' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                A4 (Standar Resmi)
              </button>
              <button
                type="button"
                onClick={() => setPageSize('FIT')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  pageSize === 'FIT' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Pas Ukuran Foto
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Jarak Tepi (Margin):
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMargin(0)}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  margin === 0 ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Tanpa Margin
              </button>
              <button
                type="button"
                onClick={() => setMargin(15)}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  margin === 15 ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Sedang
              </button>
              <button
                type="button"
                onClick={() => setMargin(30)}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  margin === 30 ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Lebar
              </button>
            </div>
          </div>
        </div>

        {/* Daftar Foto Terpilih */}
        {images.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span>Urutan Halaman PDF ({images.length} Foto):</span>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-red-400 hover:underline text-[11px]"
              >
                Hapus Semua
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-1.5 space-y-1.5"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-900">
                    {/* Local object URL is intentionally used for the preview. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-400">Hal #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(item.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={generatePdf}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 hover:from-indigo-400 font-black text-sm text-white rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyusun Dokumen PDF...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Konversi {images.length} Foto Menjadi 1 File PDF Resmi</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Hasil PDF */}
      {pdfUrl && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/40 space-y-4 text-center shadow-2xl">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Dokumen PDF Berhasil Dibuat!</h2>
            <p className="text-xs text-slate-400 mt-1">File PDF sudah tersusun rapi dan siap dikirim atau dicetak.</p>
          </div>

          <a
            href={pdfUrl}
            download="nexora_dokumen_resmi.pdf"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Unduh File PDF Resmi ke HP
          </a>
        </div>
      )}
    </div>
  );
}
