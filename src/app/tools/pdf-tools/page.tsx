'use client';

import AdSlot from '@/components/AdSlot';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';
import { ArrowLeft, Download, UploadCloud, RefreshCw, FileText } from 'lucide-react';

export default function PdfToolsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setLoading(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const pdfBuffer = new Uint8Array(pdfBytes).buffer;
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      setMergedPdfUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Gagal menggabungkan PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <AdSlot className="mt-6" />
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">PDF Tools & Merge</h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Gabungkan 2 atau lebih dokumen PDF menjadi satu file langsung di browser tanpa upload server.
        </p>
      </div>

      <div className="border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 text-center bg-slate-900/40 space-y-4">
        <input
          type="file"
          accept="application/pdf"
          multiple
          id="pdf-upload"
          className="hidden"
          onChange={handleFileChange}
        />
        <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="font-semibold text-sm text-indigo-400">Pilih 2 File PDF atau Lebih</span>
            <p className="text-xs text-slate-500 mt-1">File diproses aman di browser kamu</p>
          </div>
        </label>

        {files.length > 0 && (
          <div className="text-left bg-slate-950 p-4 rounded-xl space-y-2 text-xs border border-slate-800">
            <p className="font-semibold text-slate-300">File Terpilih ({files.length}):</p>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-400 truncate">
                <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {files.length >= 2 && !mergedPdfUrl && (
        <button
          onClick={mergePdfs}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs rounded-xl text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Menggabungkan PDF...' : 'Gabungkan PDF Sekarang'}
        </button>
      )}

      {mergedPdfUrl && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center space-y-4">
          <p className="text-xs text-emerald-400 font-semibold">✓ PDF Berhasil Digabungkan!</p>
          <a
            href={mergedPdfUrl}
            download="nexora_merged.pdf"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs rounded-xl transition-all text-white shadow-lg shadow-emerald-600/30"
          >
            <Download className="w-4 h-4" /> Unduh File PDF Gabungan
          </a>
        </div>
      )}
    </div>
  );
}
