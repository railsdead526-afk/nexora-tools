'use client';

import { useState } from 'react';
import { 
  Flame, Play, RefreshCw, Download, Sparkles, 
  ChevronDown, ChevronUp, Copy, Check, Hash, Lightbulb 
} from 'lucide-react';

export interface WordTime {
  text: string;
  start: number;
  end: number;
}

export interface ClipData {
  id: number;
  title: string;
  hookText: string;
  wordsWithTime: WordTime[];
  startSeconds: number;
  duration: number;
  viralityScore: number;
  suggestedTitles: string[];
  hashtags: string;
  whyViral: string;
  videoUrl?: string;
  loading?: boolean;
}

interface ClipCardProps {
  clip: ClipData;
  ratio: string;
  resolution: string;
  subtitleStyle: string;
  isPro: boolean;
  onRender: (id: number) => void;
}

export default function ClipCard({ clip, ratio, resolution, subtitleStyle, isPro, onRender }: ClipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  const handleCopy = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sinkronisasi kata aktif berdasarkan detik suara yang sedang diputar di video
  const activeWord = clip.wordsWithTime?.find(
    (w) => currentVideoTime >= w.start && currentVideoTime <= w.end
  );

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-2xl space-y-5">
      {/* Top Bar: Virality Score */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex flex-col items-center justify-center shadow-lg">
            <span className="text-sm font-black text-amber-400 leading-none">{clip.viralityScore}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-0.5">SCORE</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">{clip.title}</h3>
            <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <Flame className="w-3 h-3" /> Sangat Berpotensi Viral di TikTok & Shorts
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
          {clip.duration}s
        </span>
      </div>

      {/* Video Player 9:16 dengan Real-Time Audio Sync Subtitle */}
      <div className="relative max-w-[260px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl aspect-[9/16] flex items-center justify-center">
        {clip.videoUrl ? (
          <>
            <video
              src={clip.videoUrl}
              controls
              playsInline
              onTimeUpdate={(e) => setCurrentVideoTime(e.currentTarget.currentTime)}
              className="w-full h-full object-cover"
            />
            {/* Real-time Subtitle Box yang Mengikuti Suara */}
            {subtitleStyle !== 'none' && (
              <div className="absolute bottom-12 left-0 right-0 px-3 flex justify-center pointer-events-none z-10">
                <div className="bg-black/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 shadow-2xl text-center max-w-[90%]">
                  <p className="text-xs font-black uppercase tracking-wide flex flex-wrap justify-center gap-1.5 leading-snug">
                    {clip.wordsWithTime.map((w, idx) => {
                      const isSpeakingNow = currentVideoTime >= w.start && currentVideoTime <= w.end;
                      return (
                        <span
                          key={idx}
                          className={`transition-all duration-100 ${
                            isSpeakingNow
                              ? subtitleStyle === 'hormozi'
                                ? 'text-yellow-400 font-black scale-125 bg-black/60 px-1 rounded shadow-lg'
                                : subtitleStyle === 'neon'
                                ? 'text-purple-400 font-black scale-125 bg-purple-950/80 px-1 rounded shadow-lg'
                                : 'text-emerald-400 font-black scale-125 bg-emerald-950/80 px-1 rounded shadow-lg'
                              : 'text-white/60 font-semibold'
                          }`}
                        >
                          {w.text}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center space-y-3 flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow-xl">
              <Play className="w-5 h-5 fill-amber-400 ml-0.5" />
            </div>
            <p className="text-xs text-slate-300 font-semibold italic px-2 leading-relaxed">
              {clip.hookText}
            </p>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
              Klik Tombol di Bawah untuk Render Video
            </span>
          </div>
        )}
      </div>

      {/* Transkrip Ucapan */}
      <div className="space-y-2 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Transkrip Ucapan:</span>
          <p className="text-slate-300 font-medium leading-relaxed">{clip.hookText}</p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>{clip.whyViral}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {clip.videoUrl ? (
          <a
            href={clip.videoUrl}
            download={`nexora_opus_${clip.id}.mp4`}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Klip MP4 ({resolution}p) {isPro ? '✓ Full HD' : ''}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onRender(clip.id)}
            disabled={clip.loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 font-black text-xs text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {clip.loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memotong Video & Sinkronisasi Subtitle...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Potong & Sinkronkan Subtitle Suara</span>
              </>
            )}
          </button>
        )}

        {/* Creator Toolkit Accordion */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-between items-center text-xs font-bold text-slate-300 hover:text-white p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Buka Creator Toolkit (3 Saran Judul & Tag FYP)
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="space-y-1.5">
              <span className="font-extrabold text-slate-300 text-xs">Pilihan Judul Clickbait:</span>
              {clip.suggestedTitles.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-300 pr-2 leading-tight">{t}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(t, `title_${clip.id}_${idx}`)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex-shrink-0 flex items-center gap-1"
                  >
                    {copiedId === `title_${clip.id}_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === `title_${clip.id}_${idx}` ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-900 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-indigo-400 text-xs flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> Hashtag Rekomendasi:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(clip.hashtags, `tag_${clip.id}`)}
                  className="text-xs font-black text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {copiedId === `tag_${clip.id}` ? '✓ Semua Tersalin' : 'Salin Semua Tag'}
                </button>
              </div>
              <p className="p-2.5 bg-indigo-950/30 rounded-xl border border-indigo-500/20 text-indigo-300 font-mono text-[11px]">
                {clip.hashtags}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
