import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export interface KnowledgeMatch {
  documentId: string;
  chunkId: string;
  title: string;
  content: string;
  similarity: number;
}

function requireOpenAIKey() {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  return OPENAI_API_KEY;
}

function formatVector(values: number[]) {
  return `[${values.join(',')}]`;
}

export function estimateTokenCount(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function chunkText(text: string, maxChars = 1400, overlapChars = 180) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\u0000/g, '').trim();
  if (!normalized) return [] as string[];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    const value = current.trim();
    if (!value) return;
    chunks.push(value);
    current = '';
  };

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    const next = `${current}\n\n${paragraph}`;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    pushCurrent();

    if (paragraph.length <= maxChars) {
      current = paragraph;
      continue;
    }

    let index = 0;
    while (index < paragraph.length) {
      const slice = paragraph.slice(index, index + maxChars).trim();
      if (slice) chunks.push(slice);
      if (index + maxChars >= paragraph.length) {
        index = paragraph.length;
      } else {
        index += Math.max(1, maxChars - overlapChars);
      }
    }
  }

  pushCurrent();
  return chunks;
}

async function createEmbeddings(inputs: string[]) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireOpenAIKey()}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: inputs,
    }),
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as
    | {
        data?: Array<{ embedding?: number[] }>;
        error?: { message?: string };
      }
    | null;

  if (!response.ok || !body?.data?.length) {
    throw new Error(
      body?.error?.message || 'OpenAI embeddings request failed.',
    );
  }

  return body.data.map((item) => item.embedding || []);
}

export async function searchKnowledge(query: string, matchCount = 6) {
  const safeQuery = query.trim();
  if (!safeQuery) return [] as KnowledgeMatch[];

  const [embedding] = await createEmbeddings([safeQuery]);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    p_query_embedding: formatVector(embedding),
    p_match_count: Math.max(1, Math.min(matchCount, 10)),
  });

  if (error) throw error;

  return (data || []).map(
    (item: {
      document_id: unknown;
      chunk_id: unknown;
      title: unknown;
      content: unknown;
      similarity: unknown;
    }) => ({
      documentId: String(item.document_id),
      chunkId: String(item.chunk_id),
      title: String(item.title || 'Knowledge Base'),
      content: String(item.content || ''),
      similarity: Number(item.similarity || 0),
    }),
  );
}

export function buildKnowledgeContext(matches: KnowledgeMatch[]) {
  return matches
    .filter((item) => item.content.trim())
    .map(
      (item, index) =>
        `Sumber ${index + 1} — ${item.title}\n${item.content.trim()}`,
    )
    .join('\n\n');
}

export async function indexKnowledgeDocument(input: {
  documentId: string;
  text: string;
}) {
  const chunks = chunkText(input.text);
  if (!chunks.length) {
    throw new Error('Dokumen tidak memiliki teks yang bisa diindeks.');
  }

  const embeddings = await createEmbeddings(chunks);
  const supabase = createSupabaseAdminClient();

  const { error: deleteError } = await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('document_id', input.documentId);

  if (deleteError) throw deleteError;

  const rows = chunks.map((content, index) => ({
    document_id: input.documentId,
    chunk_index: index,
    content,
    token_count: estimateTokenCount(content),
    embedding: formatVector(embeddings[index] || []),
    metadata: {
      source: 'knowledge-base',
    },
  }));

  const { error: insertError } = await supabase
    .from('knowledge_chunks')
    .insert(rows);

  if (insertError) throw insertError;

  return {
    chunkCount: rows.length,
  };
}
