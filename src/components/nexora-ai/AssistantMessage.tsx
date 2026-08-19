'use client';

import PreviewButton from './PreviewButton';

type AssistantMessageProps = { content: string };

type Segment = { type: 'text' | 'code'; value: string; language?: string };

type TextBlock =
  | { type: 'paragraph'; value: string }
  | { type: 'heading'; value: string; level: 2 | 3 }
  | { type: 'bullet'; value: string }
  | { type: 'number'; value: string; number: string };

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /```([\w+-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content))) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'code',
      language: match[1].toLowerCase(),
      value: match[2].trimEnd(),
    });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', value: content }];
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function parseTextBlocks(value: string): TextBlock[] {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const blocks: TextBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ type: 'paragraph', value: text });
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^#{2,3}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: line.startsWith('## ') ? 2 : 3,
        value: heading[1],
      });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      blocks.push({ type: 'bullet', value: bullet[1] });
      continue;
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      blocks.push({ type: 'number', number: numbered[1], value: numbered[2] });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function TextSegment({ value }: { value: string }) {
  const blocks = parseTextBlocks(value);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <div
              key={index}
              className={
                block.level === 2
                  ? 'pt-2 text-base font-semibold tracking-tight text-zinc-100'
                  : 'pt-1 text-sm font-semibold text-zinc-200'
              }
            >
              {renderInline(block.value)}
            </div>
          );
        }

        if (block.type === 'bullet') {
          return (
            <div key={index} className="flex gap-3 text-[14px] leading-6 text-zinc-300">
              <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
              <div>{renderInline(block.value)}</div>
            </div>
          );
        }

        if (block.type === 'number') {
          return (
            <div key={index} className="flex gap-3 text-[14px] leading-6 text-zinc-300">
              <span className="min-w-5 pt-0.5 text-xs font-semibold text-zinc-500">{block.number}.</span>
              <div>{renderInline(block.value)}</div>
            </div>
          );
        }

        return (
          <p key={index} className="text-[14px] leading-6 text-zinc-300">
            {renderInline(block.value)}
          </p>
        );
      })}
    </div>
  );
}

export default function AssistantMessage({ content }: AssistantMessageProps) {
  const segments = parseSegments(content);

  return (
    <div className="w-full max-w-[96%] text-zinc-300">
      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <div
            key={index}
            className="my-5 overflow-hidden rounded-2xl border border-white/10 bg-[#090909]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                {segment.language || 'code'}
              </span>
              {(segment.language === 'html' ||
                segment.language === 'htm' ||
                segment.language === 'css' ||
                segment.language === 'js' ||
                segment.language === 'javascript') && <PreviewButton code={segment.value} />}
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-zinc-300">
              <code>{segment.value}</code>
            </pre>
          </div>
        ) : (
          <TextSegment key={index} value={segment.value} />
        ),
      )}
    </div>
  );
}
