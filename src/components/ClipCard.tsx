'use client';

import { useState } from 'react';
import { 
  Flame, Play, RefreshCw, Download, Sparkles, 
  ChevronDown, ChevronUp, Copy, Check, Hash, Lightbulb, ShieldCheck, Crown
} from 'lucide-react';

export interface ClipData {
  id: number;
  title: string;
  hookText: string;
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
  isPro: boolean;
  onRender: (id: number) => void;
}

export default function ClipCard({ clip, ratio, resolution, isPro, onRender }: ClipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-all shadow-2xl flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Viral Score {clip.viralityScore}/100
          </span>

          {isPro ? (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Crown className="w-3 h-3" /> NO WATERMARK
            </span>
          ) : (
            <span className="text-[9px] font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
              Free Watermark
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-white leading-snug">{clip.title}</h3>
        <p className="text-xs text-slate-400 italic bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60 leading-relaxed">
          {clip.hookText}
        </p>

        <div className="flex items-start gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/5 p-2.5 rounded-2xl border border-amber-500/10">
          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{clip.whyViral}</span>
        </div>
      </div>

      {/* Video Player */}
      {clip.videoUrl ? (
        <div className="space-y-3 pt-1">
          <div className="max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
            <video
              src={clip.videoUrl}
              controls
              playsInline
              className={`w-full ${ratio === '9:16' ? 'aspect-[9/16]' : ratio === '1:1' ? 'aspect-square' : 'aspect-video'} object-cover`}
            />
          </div>
          <a
            href={clip.videoUrl}
            download={`nexora_clip_${clip.id}.mp4`}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Download Klip MP4 ({resolution}p) {isPro && '✓ HD'}
          </a>
        </div>
      ) : (
        <button
          onClick={() => onRender(clip.id)}
          disabled={clip.loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
        >
          {clip.loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memotong & Render Video {isPro ? '(PRO Mode)' : ''}...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Putar & Potong Klip Ini</span>
            </>
          )}
        </button>
      )}

      {/* Accordion Metadata */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-between items-center text-xs font-semibold text-slate-300 hover:text-white py-1"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Saran 3 Judul & Hashtag Viral
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <div className="space-y-1.5">
              <span className="font-bold text-slate-300 text-[11px]">Pilihan Judul Viral:</span>
              {clip.suggestedTitles.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-300 truncate pr-2">{t}</span>
                  <button
                    onClick={() => handleCopy(t, `title_${clip.id}_${idx}`)}
                    className="text-amber-400 hover:text-amber-300 flex-shrink-0"
                  >
                    {copiedId === `title_${clip.id}_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1">
                  <Hash className="w-3 h-3 text-indigo-400" /> Hashtag FYP:
                </span>
                <button
                  onClick={() => handleCopy(clip.hashtags, `tag_${clip.id}`)}
                  className="text-[10px] font-bold text-indigo-400 hover:underline"
                >
                  {copiedId === `tag_${clip.id}` ? '✓ Tersalin' : 'Salin Tag'}
                </button>
              </div>
              <p className="text-[10px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-500/20 font-mono">
                {clip.hashtags}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
