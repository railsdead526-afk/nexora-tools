'use client';

/* Object URLs from browser-side processing cannot use next/image. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  Crown,
  Download,
  FileText,
  Info,
  Layers3,
  LayoutTemplate,
  Loader2,
  LockKeyhole,
  Maximize2,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';
import { buildListingText, getSafeFilename, type ListingFormValues } from '@/lib/seller/listing';

type Preset = 'cover' | 'description';
type BackgroundMode = 'white' | 'soft';

type ListingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  processedUrl?: string;
  processedFile?: File;
};

const MAX_PHOTOS = 9;
const CANVAS_SIZES: Record<Preset, number> = { cover: 1200, description: 1000 };

const initialForm: ListingFormValues = {
  productName: '',
  category: '',
  material: '',
  size: '',
  packageContents: '',
  benefits: '',
  warranty: '',
};

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Foto tidak dapat dibaca.'));
    };
    image.src = url;
  });
}

async function renderMarketplaceImage(file: File, preset: Preset, background: BackgroundMode) {
  const image = await readImage(file);
  const size = CANVAS_SIZES[preset];
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser tidak mendukung pemrosesan gambar.');

  context.fillStyle = background === 'soft' ? '#f7f4ef' : '#ffffff';
  context.fillRect(0, 0, size, size);

  const padding = preset === 'cover' ? 72 : 56;
  const scale = Math.min((size - padding * 2) / image.naturalWidth, (size - padding * 2) / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const x = Math.round((size - width) / 2);
  const y = Math.round((size - height) / 2);
  context.drawImage(image, x, y, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Gagal membuat file output.'));
    }, 'image/jpeg', 0.88);
  });

  const output = new File([blob], `${getSafeFilename(file.name.replace(/\.[^.]+$/, ''))}-${preset}.jpg`, { type: 'image/jpeg' });
  return imageCompression(output, {
    maxSizeMB: 1.8,
    maxWidthOrHeight: size,
    useWebWorker: true,
    initialQuality: 0.88,
  });
}

export default function SellerListingPage() {
  const { isPro, loading: accountLoading } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [preset, setPreset] = useState<Preset>('cover');
  const [background, setBackground] = useState<BackgroundMode>('white');
  const [form, setForm] = useState<ListingFormValues>(initialForm);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const listing = useMemo(() => buildListingText(form), [form]);
  const processedCount = photos.filter((photo) => photo.processedUrl).length;
  const filenameBase = getSafeFilename(form.productName);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setError('');
    const accepted = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, Math.max(0, MAX_PHOTOS - photos.length));

    if (!accepted.length) {
      setError('Pilih file gambar JPG, PNG, atau WebP. Maksimal 9 foto untuk satu produk.');
      return;
    }

    setPhotos((current) => [
      ...current,
      ...accepted.map((file) => ({ id: makeId(), file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        if (removed.processedUrl) URL.revokeObjectURL(removed.processedUrl);
      }
      return current.filter((photo) => photo.id !== id);
    });
  };

  const processPhotos = async () => {
    if (!photos.length) {
      setError('Tambahkan minimal satu foto produk terlebih dahulu.');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const processed: ListingPhoto[] = [];
      for (const photo of photos) {
        const file = await renderMarketplaceImage(photo.file, preset, background);
        processed.push({
          ...photo,
          processedFile: file,
          processedUrl: URL.createObjectURL(file),
        });
      }
      photos.forEach((photo) => {
        if (photo.processedUrl) URL.revokeObjectURL(photo.processedUrl);
      });
      setPhotos(processed);
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : 'Gagal memproses foto.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = (url: string, name: string) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const downloadAll = () => {
    photos.forEach((photo, index) => {
      if (!photo.processedUrl) return;
      window.setTimeout(() => downloadFile(photo.processedUrl || '', `${filenameBase || 'produk'}-${preset}-${index + 1}.jpg`), index * 140);
    });
  };

  const downloadText = () => {
    const blob = new Blob([`Judul listing\n${listing.title}\n\nDeskripsi listing\n${listing.description}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filenameBase || 'produk'}-listing.txt`);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyDescription = async () => {
    try {
      await navigator.clipboard.writeText(`${listing.title}\n\n${listing.description}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Clipboard tidak tersedia. Gunakan tombol unduh listing.');
    }
  };

  const updateForm = (key: keyof ListingFormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (accountLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-zinc-400">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs"><Loader2 className="h-4 w-4 animate-spin text-[#df6f25]" /> Memeriksa status PRO...</div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pb-20 pt-8 text-[#f4f4f5]">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog
          </Link>

          <section className="relative mt-7 overflow-hidden rounded-[2rem] border border-[#c65a16]/25 bg-gradient-to-br from-[#18100b] via-[#0d0d0d] to-[#080808] p-6 shadow-2xl shadow-black/30 sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#c65a16]/15 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c65a16]/25 bg-[#c65a16]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#e07931]"><Crown className="h-3.5 w-3.5" /> PRO Workspace</div>
                <div className="space-y-3">
                  <h1 className="max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">Jualan siap upload, tanpa pindah-pindah tools.</h1>
                  <p className="max-w-xl text-sm leading-7 text-zinc-400">Rapikan foto produk, siapkan ukuran cover, susun deskripsi, dan unduh hasilnya dalam satu workspace seller.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setIsCheckoutOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#c65a16] px-4 py-3 text-xs font-black text-black shadow-lg shadow-orange-950/30 transition hover:bg-[#df6f25] active:scale-[.98]"><Crown className="h-4 w-4" /> Buka PRO Rp49.000 / 30 hari</button>
                  <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08]">Masuk / Daftar</Link>
                </div>
                <p className="flex items-center gap-2 text-[11px] text-zinc-600"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Pemrosesan foto dilakukan di browser pada versi awal.</p>
              </div>

              <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between"><p className="text-xs font-black text-white">Isi workspace PRO</p><span className="rounded-lg bg-[#c65a16]/15 px-2 py-1 text-[9px] font-black text-[#df6f25]">4 OUTPUT</span></div>
                <div className="grid gap-2">
                  {([
                    ['Foto cover', 'Preset persegi dan panduan safe-zone', LayoutTemplate],
                    ['Foto deskripsi', 'Ukuran ringan dengan target hingga 2 MB', Maximize2],
                    ['Teks listing', 'Judul dan deskripsi berbasis fakta produk', FileText],
                    ['Paket unduhan', 'Proses hingga 9 foto per produk', PackageOpen],
                  ] as [string, string, LucideIcon][]).map(([title, description, FeatureIcon]) => {
                    return <div key={String(title)} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="rounded-xl bg-[#c65a16]/10 p-2 text-[#df6f25]"><FeatureIcon className="h-4 w-4" /></div><div><p className="text-xs font-bold text-zinc-200">{title}</p><p className="mt-1 text-[10px] leading-5 text-zinc-500">{description}</p></div></div>;
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[['1', 'Masukkan foto'], ['2', 'Rapikan output'], ['3', 'Salin listing']].map(([number, text]) => <div key={number} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c65a16]/10 text-xs font-black text-[#df6f25]">{number}</span><span className="text-xs font-bold text-zinc-300">{text}</span></div>)}
          </div>
        </div>
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 pb-24 pt-6 text-[#f4f4f5] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog</Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-400"><Crown className="h-3.5 w-3.5" /> PRO aktif</div>
        </div>

        <header className="grid gap-5 rounded-[2rem] border border-white/[0.08] bg-gradient-to-r from-white/[0.035] to-[#c65a16]/[0.06] p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-3"><div className="inline-flex items-center gap-2 rounded-full border border-[#c65a16]/20 bg-[#c65a16]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#df6f25]"><Store className="h-3.5 w-3.5" /> Seller Listing Workspace</div><h1 className="text-2xl font-black tracking-[-0.04em] sm:text-4xl">Jualan Siap Upload</h1><p className="max-w-2xl text-xs leading-6 text-zinc-400 sm:text-sm">Siapkan foto produk dan teks listing dengan satu alur. Semua pemrosesan gambar berjalan langsung di browser.</p></div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3 text-[11px] text-zinc-400"><ShieldCheck className="h-4 w-4 text-emerald-400" /><span>Foto tidak dikirim ke server</span></div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-5 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#df6f25]">01 · Foto produk</p><h2 className="mt-1 text-lg font-black">Pilih sampai 9 foto</h2></div><span className="text-[11px] text-zinc-600">{photos.length}/{MAX_PHOTOS} foto</span></div>

            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => { addPhotos(event.target.files); event.currentTarget.value = ''; }} />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={photos.length >= MAX_PHOTOS} className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center transition hover:border-[#c65a16]/50 hover:bg-[#c65a16]/[0.04] disabled:cursor-not-allowed disabled:opacity-50"><div className="rounded-2xl bg-[#c65a16]/10 p-3 text-[#df6f25]"><UploadCloud className="h-6 w-6" /></div><div><p className="text-xs font-black text-zinc-200">Tambah foto produk</p><p className="mt-1 text-[10px] text-zinc-600">JPG, PNG, WebP · maksimal 9 foto</p></div></button>

            {photos.length > 0 && <div className="grid grid-cols-3 gap-2 sm:grid-cols-4"><div className="col-span-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[10px] text-zinc-500 sm:col-span-4"><Layers3 className="h-3.5 w-3.5 text-[#df6f25]" /> Foto pertama dipakai sebagai cover utama.</div>{photos.map((photo, index) => <div key={photo.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30"><img src={photo.previewUrl} alt={`Foto produk ${index + 1}`} className="aspect-square w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 to-transparent px-2 pb-2 pt-6"><span className="text-[10px] font-bold text-white">{index === 0 ? 'Cover' : `Foto ${index + 1}`}</span><button type="button" onClick={() => removePhoto(photo.id)} className="rounded-lg bg-red-500/15 p-1.5 text-red-300 opacity-0 transition group-hover:opacity-100" aria-label={`Hapus foto ${index + 1}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}</div>}

            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">Preset output</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setPreset('cover')} className={`rounded-xl border px-3 py-3 text-left transition ${preset === 'cover' ? 'border-[#c65a16]/60 bg-[#c65a16]/10 text-[#f5c09c]' : 'border-white/[0.08] bg-black/20 text-zinc-500 hover:text-zinc-300'}`}><span className="block text-xs font-black">Cover Shopee</span><span className="mt-1 block text-[10px] opacity-70">1200 × 1200 px</span></button><button type="button" onClick={() => setPreset('description')} className={`rounded-xl border px-3 py-3 text-left transition ${preset === 'description' ? 'border-[#c65a16]/60 bg-[#c65a16]/10 text-[#f5c09c]' : 'border-white/[0.08] bg-black/20 text-zinc-500 hover:text-zinc-300'}`}><span className="block text-xs font-black">Gambar Deskripsi</span><span className="mt-1 block text-[10px] opacity-70">1000 × 1000 px</span></button></div></div><div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">Latar belakang</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setBackground('white')} className={`rounded-xl border px-3 py-3 text-left transition ${background === 'white' ? 'border-white/30 bg-white/10 text-white' : 'border-white/[0.08] bg-black/20 text-zinc-500 hover:text-zinc-300'}`}><span className="block text-xs font-black">Putih bersih</span><span className="mt-1 block text-[10px] opacity-70">Aman untuk cover</span></button><button type="button" onClick={() => setBackground('soft')} className={`rounded-xl border px-3 py-3 text-left transition ${background === 'soft' ? 'border-[#c65a16]/60 bg-[#c65a16]/10 text-[#f5c09c]' : 'border-white/[0.08] bg-black/20 text-zinc-500 hover:text-zinc-300'}`}><span className="block text-xs font-black">Soft cream</span><span className="mt-1 block text-[10px] opacity-70">Nuansa hangat</span></button></div></div></div>

            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.04] p-3 text-[10px] leading-5 text-sky-200/70"><div className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" /><span>Preset dibuat untuk workflow seller, bukan jaminan penerimaan semua marketplace. Periksa kembali aturan platform sebelum upload.</span></div></div>
            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
            <button type="button" onClick={() => void processPhotos()} disabled={processing || !photos.length} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c65a16] py-3.5 text-xs font-black text-black shadow-lg shadow-orange-950/20 transition hover:bg-[#df6f25] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.99]">{processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses {photos.length} foto...</> : <><Sparkles className="h-4 w-4" /> Proses Foto Seller</>}</button>
          </section>

          <section className="space-y-5 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#df6f25]">02 · Safe-zone</p><h2 className="mt-1 text-lg font-black">Jaga area teks tetap terbaca</h2><p className="mt-1 text-[11px] leading-5 text-zinc-500">Gunakan panduan ini saat menambahkan logo atau teks pada foto cover.</p></div>
            <div className="relative mx-auto aspect-square max-w-[280px] overflow-hidden rounded-3xl border border-white/10 bg-white"><div className="absolute inset-5 rounded-2xl border-2 border-dashed border-emerald-500/70"><span className="absolute -top-2.5 left-3 rounded bg-emerald-600 px-2 py-1 text-[9px] font-black text-white">AREA AMAN</span></div><div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#c65a16_1px,transparent_1px),linear-gradient(90deg,#c65a16_1px,transparent_1px)] [background-size:28px_28px]" /><div className="absolute bottom-3 left-3 right-3 rounded-lg bg-red-500/80 px-2 py-1.5 text-center text-[9px] font-black text-white">Jangan taruh teks penting terlalu dekat tepi</div></div>
            <div className="grid gap-2 text-[10px] text-zinc-500"><div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-3"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-400" /><span>Produk tetap menjadi fokus utama di tengah frame.</span></div><div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-3"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-400" /><span>Logo dan teks penting masuk ke garis hijau.</span></div><div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-3"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-400" /><span>Preview ini adalah panduan desain, bukan integrasi otomatis ke Shopee.</span></div></div>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <section className="space-y-5 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#df6f25]">03 · Data listing</p><h2 className="mt-1 text-lg font-black">Susun informasi produk</h2><p className="mt-1 text-[11px] leading-5 text-zinc-500">Template hanya memakai fakta yang kamu masukkan—tanpa mengarang spesifikasi.</p></div><div className="grid gap-3 sm:grid-cols-2">{([['productName', 'Nama produk', 'Contoh: Mukena Travel Premium'], ['category', 'Kategori', 'Contoh: Fashion Muslim'], ['material', 'Bahan', 'Contoh: Katun rayon'], ['size', 'Ukuran / varian', 'Contoh: M, L, XL / Hitam'], ['packageContents', 'Isi paket', 'Contoh: 1 mukena + pouch'], ['warranty', 'Garansi / masa berlaku', 'Contoh: 7 hari'] ] as const).map(([key, label, placeholder]) => <label key={key} className="space-y-1.5"><span className="text-[10px] font-bold text-zinc-400">{label}</span><input value={form[key]} onChange={(event) => updateForm(key, event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-[#c65a16]/50 focus:ring-2 focus:ring-[#c65a16]/10" /></label>)}</div><label className="block space-y-1.5"><span className="text-[10px] font-bold text-zinc-400">Keunggulan produk</span><textarea value={form.benefits} onChange={(event) => updateForm('benefits', event.target.value)} placeholder="Satu keunggulan per baris, misalnya: ringan dibawa\nmudah dicuci\nbahan adem" rows={4} className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-xs leading-5 text-white outline-none transition placeholder:text-zinc-700 focus:border-[#c65a16]/50 focus:ring-2 focus:ring-[#c65a16]/10" /></label></section>

          <section className="space-y-5 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#df6f25]">04 · Hasil</p><h2 className="mt-1 text-lg font-black">Paket listing kamu</h2></div><span className="rounded-lg border border-white/[0.08] bg-black/20 px-2 py-1 text-[10px] text-zinc-500">{processedCount}/{photos.length} foto siap</span></div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600">Judul listing</p><p className="mt-2 text-sm font-bold text-zinc-100">{listing.title}</p><div className="mt-4 flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600">Deskripsi terstruktur</p><button type="button" onClick={() => void copyDescription()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 transition hover:border-[#c65a16]/40 hover:text-white">{copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}{copied ? 'Tersalin' : 'Salin'}</button></div><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-[11px] leading-5 text-zinc-400">{listing.description}</pre></div>
            <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={downloadAll} disabled={!processedCount} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" /> Unduh {processedCount || ''} Foto</button><button type="button" onClick={downloadText} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] py-3 text-xs font-black text-zinc-200 transition hover:border-[#c65a16]/40 hover:text-white"><ClipboardList className="h-4 w-4" /> Unduh Teks Listing</button></div>
            {processedCount > 0 && <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{photos.filter((photo) => photo.processedUrl).map((photo, index) => <button type="button" key={photo.id} onClick={() => downloadFile(photo.processedUrl || '', `${filenameBase || 'produk'}-${preset}-${index + 1}.jpg`)} className="group relative overflow-hidden rounded-xl border border-white/[0.08] text-left"><img src={photo.processedUrl} alt={`Hasil foto ${index + 1}`} className="aspect-square w-full object-cover transition group-hover:scale-105" /><span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-1 text-[9px] font-bold text-white">Unduh</span></button>)}</div>}
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3 text-[10px] leading-5 text-amber-100/65"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /><span>Fitur ini adalah bagian PRO. Output gambar diproses lokal dan tidak otomatis mengunggah ke marketplace.</span></div>
          </section>
        </div>
      </div>
    </div>
  );
}
