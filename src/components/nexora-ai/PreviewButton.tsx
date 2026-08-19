'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';
import PreviewEngine from './PreviewEngine';

type PreviewButtonProps = { code: string };

export default function PreviewButton({ code }: PreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const disabled = !code.trim();

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#8b6ccf]/20 bg-[#8b6ccf]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#b8a7df] transition hover:border-[#8b6ccf]/35 hover:bg-[#8b6ccf]/[0.10] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Eye className="h-3.5 w-3.5" />
        Preview
      </button>
      <PreviewEngine code={code} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
