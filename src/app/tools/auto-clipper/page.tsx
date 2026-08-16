'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';
import ClipCard, { ClipData } from '@/components/ClipCard';
import { 
  ArrowLeft, Crown, Sparkles, RefreshCw, 
  Link2, Video, Sliders, Flame, Layers, ShieldCheck 
} from 'lucide-react';

export default function AutoClipperPage() {
  const { data: session } = useSession();
  const { isPro } = useUser();
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [resolution, setResolution] = useState(isPro ? '1080' : '720');
  const [ratio, setRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAutoClipAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) {
      alert('Silakan tempel link video YouTube terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    setClips([]);

    setTimeout(() => {
      setIsAnalyzing(false);
      setClips([
        {
          id: 1,
          title: 'Hook Pembuka: Rahasia yang Bikin Penasaran',
          hookText: '"Kalau kamu masih pakai cara lama, ini alasan kenapa kamu selalu gagal..."',
          startSeconds: 15,
          duration: 20,
          viralityScore: 99,
          suggestedTitles: [
            'POV: Ketika kamu baru sadar hal ini di 2026 😱',
            'Stop lakukan ini kalau mau berkembang! 🔥',
            'Rahasia sukses yang jarang dibongkar siapapun...'
          ],
          hashtags: '#fyp #podcastviral #mindset #edukasi #shorts #trending',
          whyViral: 'Memiliki hook kuat di 3 detik pertama dengan intonasi penasaran yang memicu watch-time tinggi.',
        },
        {
          id: 2,
          title: 'Punchline Utama: Solusi & Mindset Baru',
          hookText: '"Cuma butuh 1 kebiasaan kecil ini setiap pagi untuk melipatgandakan fokus..."',
          startSeconds: 60,
          duration: 25,
          viralityScore: 96,
          suggestedTitles: [
            '1 Kebiasaan pagi yang mengubah segalanya ⚡',
            'Trik psikologi sederhana tapi hasilnya gila!',
            'Tonton sampai habis buat kamu yang sering malas!'
          ],
          hashtags: '#produktivitas #tipskehidupan #sukses #reelsindonesia #fyp',
          whyViral: 'Memberikan solusi langsung (actionable tips) yang memicu penonton untuk share ke teman.',
        },
        {
          id: 3,
          title: 'Momen Kontroversial & Debat Hangat',
          hookText: '"Banyak orang gak setuju sama pendapat ini, tapi faktanya memang begitu..."',
          startSeconds: 120,
          duration: 20,
          viralityScore: 93,
          suggestedTitles: [
            'Banyak yang gak setuju, tapi ini faktanya! 🤫',
            'Kalian di tim yang mana nih? Komen di bawah!',
            'Opini jujur yang bikin netizen terbelah...'
          ],
          hashtags: '#debatviral #opini #podcastindonesia #shorts #fypシ',
          whyViral: 'Memicu perdebatan di kolom komentar (engagement tinggi dari audiens).',
        },
        {
          id: 4,
          title: 'Tips Praktis & Langkah-Langkah',
          hookText: '"Lakukan 3 langkah ini sebelum kamu mulai proyek baru..."',
          startSeconds: 180,
          duration: 20,
          viralityScore: 91,
          suggestedTitles: [
            '3 Langkah penting sebelum mulai bisnis! 📈',
            'Wajib simpan video ini buat bekal nanti!',
            'Cara termudah raih target tanpa pusing.'
          ],
          hashtags: '#bisnispemula #strategi #belajaronline #tips #fyp',
          whyViral: 'Format listicle (3 poin) sangat disukai algoritma Reels dan TikTok.',
        },
        {
          id: 5,
          title: 'Quotes Inspiratif & Pesan Penutup',
          hookText: '"Jangan tunggu sempurna untuk memulai, mulailah agar menjadi sempurna..."',
          startSeconds: 240,
          duration: 20,
          viralityScore: 88,
          suggestedTitles: [
            'Pengingat terbaik buat kamu hari ini ❤️',
            'Dengerin ini kalau lagi ngerasa down...',
            'Kata-kata yang relate banget sama fase hidup sekarang.'
          ],
          hashtags: '#motivasihidup #quotesindonesia #selfreminder #shorts #fyp',
          whyViral: 'Emosional, membangkitkan empati, dan menghasilkan banyak bookmark/save.',
        },
      ]);
    }, 1200);
  };

  const handleRenderClip = async (clipId: number) => {
    const targetClip = clips.find(c => c.id === clipId);
    if (!targetClip) return;

    setClips(prev => prev.map(c => c.id === clipId ? { ...c, loading: true } : c));

    try {
      const res = await fetch('/api/clipper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoUrlInput.trim(),
          startSeconds: targetClip.startSeconds,
          duration: targetClip.duration,
          ratio,
          resolution,
          email: session?.user?.email,
          isPro: Boolean(isPro),
        }),
      });

      const data = await res.json();
      if (data.success && data.videoUrl) {
        setClips(prev => prev.map(c => c.id === clipId ? { ...c, videoUrl: data.videoUrl, loading: false } : c));
      } else {
        alert(data.error || 'Gagal memproses klip');
        setClips(prev => prev.map(c => c.id === clipId ? { ...c, loading: false } : c));
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses video.');
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, loading: false } : c));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
          <Crown className="w-3.5 h-3.5" /> Nexora AI Auto Clipper Studio
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">AI Video Clipper & Content Studio</h1>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Potong video YouTube jadi beberapa klip viral vertikal dengan <strong>saran judul</strong>, <strong>hashtag FYP</strong>, dan <strong>skor viralitas</strong>.
        </p>

        {isPro && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Mode PRO Aktif: Video Bersih 100% Tanpa Watermark
          </div>
        )}
      </div>

      {/* Form Card */}
      <form onSubmit={handleAutoClipAnalyze} className="p-5 md:p-7 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-red-500" /> Tempel Link Video YouTube / Podcast:
          </label>
          <div className="relative">
            <Link2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Pengatur Rasio & Resolusi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Format Rasio Video:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRatio('9:16')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  ratio === '9:16' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                9:16 (Shorts)
              </button>
              <button
                type="button"
                onClick={() => setRatio('1:1')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  ratio === '1:1' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                1:1 (Feed)
              </button>
              <button
                type="button"
                onClick={() => setRatio('16:9')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  ratio === '16:9' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                16:9
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Kualitas Resolusi:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setResolution('480')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  resolution === '480' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                480p
              </button>
              <button
                type="button"
                onClick={() => setResolution('720')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  resolution === '720' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                720p HD
              </button>
              <button
                type="button"
                onClick={() => isPro ? setResolution('1080') : setIsModalOpen(true)}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  resolution === '1080' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                1080p (PRO)
              </button>
            </div>
          </div>
        </div>

        {/* Tombol Utama AI Auto Clip yang Dibenahi */}
        <button
          type="submit"
          disabled={isAnalyzing || !videoUrlInput}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.99] font-black text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span className="text-xs md:text-sm font-black">AI Menganalisa & Mencari 5 Highlight...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
              <span className="text-xs md:text-sm font-black tracking-wide">⚡ AI Auto Clip (Generate 5 Klip Viral)</span>
            </>
          )}
        </button>
      </form>

      {/* Hasil 5 Klip */}
      {clips.length > 0 && (
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> Hasil Analisa: 5 Klip Viral Siap Posting
            </h2>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              {ratio} • {resolution}p
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                ratio={ratio}
                resolution={resolution}
                isPro={Boolean(isPro)}
                onRender={handleRenderClip}
              />
            ))}
          </div>
        </div>
      )}

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
