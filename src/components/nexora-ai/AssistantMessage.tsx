'use client';

import PreviewButton from './PreviewButton';

type AssistantMessageProps = { content: string };

type Segment = { type: 'text' | 'code'; value: string; language?: string };

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /```([\w+-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content))) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    segments.push({ type: 'code', language: match[1].toLowerCase(), value: match[2].trimEnd() });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) segments.push({ type: 'text', value: content.slice(lastIndex) });
  return segments.length ? segments : [{ type: 'text', value: content }];
}

export default function AssistantMessage({ content }: AssistantMessageProps) {
  const segments = parseSegments(content);
  return (
    <div className="max-w-[96%] text-sm leading-7 text-zinc-200">
      {segments.map((segment, index) => segment.type === 'code' ? (
        <div key={index} className="my-4 overflow-hidden rounded-2xl border border-white/10 bg-[#090909]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{segment.language || 'code'}</span>
            {(segment.language === 'html' || segment.language === 'htm' || segment.language === 'css' || segment.language === 'js' || segment.language === 'javascript') && <PreviewButton code={segment.value} />}
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-6 text-zinc-300"><code>{segment.value}</code></pre>
        </div>
      ) : <div key={index} className="whitespace-pre-wrap">{segment.value}</div>)}
    </div>
  );
}
