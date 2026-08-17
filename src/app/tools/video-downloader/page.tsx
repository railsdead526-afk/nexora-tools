'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';
import { 
  ArrowLeft, Crown, Sparkles, Download, 
  RefreshCw, CheckCircle2, Link2, 
  Music, Film, Sliders 
} from 'lucide-react';

interface VideoMeta {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  isTikTok?: boolean;
}

export default function VideoDownloaderPage() {
  const { isPro, session } = useUser();
  const [videoUrl, setVideoUrl] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<'360' | '720' | '1080' | '1440' | '2160' | 'mp3'>('720');
  const [readyDownloadUrl, setReadyDownloadUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [quotaLimit, setQuotaLimit] = useState<number | null>(null);

  const refreshQuota = useCallback(async () => {
    if (!session?.access_token) {
      setQuotaRemaining(null);
      setQuotaLimit(null);
      return;
    }

    try {
      const response = await fetch('/api/quota/status?tool=downloader', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Gagal memuat quota.');
      setQuotaRemaining(Number(data.remaining || 0));
      setQuotaLimit(Number(data.limit || 0));
    } catch (error) {
      console.error('Downloader quota status error:', error);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void refreshQuota();
  }, [refreshQuota]);

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setLoadingInfo(true);
    setVideoMeta(null);
    setReadyDownloadUrl(null);

    try {
      const res = await fetch('/api/downloader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ action: 'get_info', url: videoUrl.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setVideoMeta(data);
      } else {
        alert(data.error || 'Gagal mengambil data video. Pastikan link publik.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleProcessDownload = async () => {
    if (!videoUrl.trim()) return;

    // Kunci 1080p, 2K, dan 4K khusus PRO
    if ((selectedQuality === '1080' || selectedQuality === '1440' || selectedQuality === '2160') && !isPro) {
      setIsModalOpen(true);
      return;
    }

    setDownloading(true);
    setReadyDownloadUrl(null);

    try {
      const isAudio = selectedQuality === 'mp3';
      const res = await fetch('/api/downloader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          action: 'download_file',
          url: videoUrl.trim(),
          resolution: selectedQuality,
          isAudio,
        }),
      });

      const data = await res.json();
      if (data.success && data.downloadUrl) {
        setReadyDownloadUrl(data.downloadUrl);
        await refreshQuota();
      } else {
        if (res.status === 429 && data?.quota) {
          setQuotaRemaining(Number(data.quota.remaining || 0));
          setQuotaLimit(Number(data.quota.limit || 0));
          if (!isPro) setIsModalOpen(true);
        }
        alert(data.error || 'Gagal mengunduh file.');
      }
    } catch (err) {
      alert('Gagal mendownload.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold shadow-sm">
          <Film className="w-3.5 h-3.5" /> Multi-Platform Downloader
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Download TikTok & YouTube</h1>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Unduh video <strong>TikTok (Tanpa Watermark)</strong> & YouTube dari resolusi standar gratis hingga <strong>2K & 4K Ultra HD PRO</strong>.
        </p>

        {isPro && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Crown className="w-4 h-4" /> Mode PRO: Akses Download 1080p, 2K & 4K Aktif
          </div>
        )}

        {session && quotaRemaining !== null && quotaLimit !== null && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold">
            Kuota hari ini: {quotaRemaining}/{quotaLimit} download tersisa
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleFetchInfo} className="p-5 md:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Tempel Link Video YouTube / TikTok (vt.tiktok.com):</label>
          <div className="relative">
            <Link2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="url"
              required
              placeholder="https://vt.tiktok.com/... atau https://youtube.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loadingInfo || !videoUrl}
          className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[0.99] font-black text-xs md:text-sm text-white rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {loadingInfo ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memeriksa Video & Kualitas Stream...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Ambil Video & Pilihan Kualitas</span>
            </>
          )}
        </button>
      </form>

      {/* Hasil Video & Pilihan Kualitas */}
      {videoMeta && (
        <div className="p-5 md:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex gap-4 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
            {videoMeta.thumbnail && (
              <img
                src={videoMeta.thumbnail}
                alt="Thumbnail"
                className="w-24 h-16 object-cover rounded-xl border border-slate-800 flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                {videoMeta.isTikTok && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    TIKTOK NO-WATERMARK
                  </span>
                )}
              </div>
              <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2">{videoMeta.title}</h3>
              <p className="text-[11px] text-slate-400">{videoMeta.uploader} • Durasi: {videoMeta.duration}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-red-400" /> Pilih Format & Kualitas Unduhan:
            </label>

            {/* Pilihan Resolusi Sederhana & Mewah */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedQuality('360')}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  selectedQuality === '360' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-black text-white">360p</p>
                <span className="text-[10px] text-emerald-400">FREE • Hemat Kuota</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedQuality('720')}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  selectedQuality === '720' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-black text-white">720p HD</p>
                <span className="text-[10px] text-emerald-400">FREE • Standar Jernih</span>
              </button>

              <button
                type="button"
                onClick={() => isPro ? setSelectedQuality('1080') : setIsModalOpen(true)}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  selectedQuality === '1080' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-black text-amber-400 flex items-center gap-1">1080p Full HD <Crown className="w-3 h-3" /></p>
                <span className="text-[10px] text-amber-500 font-bold">NEXORA PRO</span>
              </button>

              <button
                type="button"
                onClick={() => isPro ? setSelectedQuality('1440') : setIsModalOpen(true)}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  selectedQuality === '1440' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-black text-amber-400 flex items-center gap-1">2K Quad HD <Crown className="w-3 h-3" /></p>
                <span className="text-[10px] text-amber-500 font-bold">NEXORA PRO</span>
              </button>

              <button
                type="button"
                onClick={() => isPro ? setSelectedQuality('2160') : setIsModalOpen(true)}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  selectedQuality === '2160' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-black text-amber-400 flex items-center gap-1">4K Ultra HD <Crown className="w-3 h-3" /></p>
                <span className="text-[10px] text-amber-500 font-bold">NEXORA PRO</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedQuality('mp3')}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  selectedQuality === 'mp3' ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-black text-white flex items-center gap-1"><Music className="w-3 h-3 text-purple-400" /> Audio MP3</p>
                <span className="text-[10px] text-emerald-400">FREE • Audio Jernih</span>
              </button>
            </div>
          </div>

          {!readyDownloadUrl ? (
            <button
              type="button"
              onClick={handleProcessDownload}
              disabled={downloading}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 hover:from-red-500 active:scale-[0.99] font-black text-sm text-white rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download File ({selectedQuality === 'mp3' ? 'MP3' : selectedQuality === '1440' ? '2K' : selectedQuality === '2160' ? '4K' : selectedQuality + 'p'})</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3 pt-2 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Video Siap Disimpan!
              </div>
              <a
                href={readyDownloadUrl}
                download
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 font-black text-sm text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Simpan Video ke HP Sekarang
              </a>
            </div>
          )}
        </div>
      )}

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
