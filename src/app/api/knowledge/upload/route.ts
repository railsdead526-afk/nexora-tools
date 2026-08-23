import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { isAdminUser } from '@/lib/auth/admin';
import { indexKnowledgeDocument } from '@/lib/ai/rag';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET = 'knowledge-base';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/json': 'json',
  'text/csv': 'csv',
  'text/html': 'html',
};

type PrepareBody = {
  action: 'prepare';
  fileName?: unknown;
  mimeType?: unknown;
  size?: unknown;
};

type FinalizeBody = {
  action: 'finalize';
  path?: unknown;
  title?: unknown;
};

function sanitizeTitle(input: string) {
  const clean = input.replace(/\.[^.]+$/, '').replace(/\s+/g, ' ').trim();
  return clean.slice(0, 200) || 'Knowledge Document';
}

function extractText(fileName: string, mimeType: string, buffer: Buffer) {
  const text = buffer.toString('utf8').replace(/\u0000/g, '').trim();
  if (!text) {
    throw new Error('File knowledge base tidak berisi teks yang dapat dibaca.');
  }

  if (mimeType === 'text/html' || fileName.toLowerCase().endsWith('.html')) {
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (mimeType === 'application/json' || fileName.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text) as unknown;
    return JSON.stringify(parsed, null, 2);
  }

  return text;
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as PrepareBody | FinalizeBody;
    const supabase = createSupabaseAdminClient();

    if (body.action === 'prepare') {
      const fileName =
        typeof body.fileName === 'string' ? body.fileName.trim() : '';
      const mimeType =
        typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : '';
      const size =
        typeof body.size === 'number' ? body.size : Number.NaN;
      const extension = ALLOWED_TYPES[mimeType];

      if (!fileName || !extension) {
        return NextResponse.json(
          { error: 'Format knowledge base yang didukung: txt, md, json, csv, html.' },
          { status: 415 },
        );
      }

      if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Ukuran file knowledge base maksimal 5 MB.' },
          { status: 413 },
        );
      }

      const path = `${user.id}/${Date.now()}-${randomUUID()}.${extension}`;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data?.token) {
        throw error || new Error('Gagal membuat signed upload token.');
      }

      return NextResponse.json({ success: true, path, token: data.token });
    }

    if (body.action === 'finalize') {
      const path = typeof body.path === 'string' ? body.path.trim() : '';
      const title =
        typeof body.title === 'string' && body.title.trim()
          ? body.title.trim().slice(0, 200)
          : null;

      if (!path || !path.startsWith(`${user.id}/`)) {
        return NextResponse.json(
          { error: 'Path knowledge base tidak valid.' },
          { status: 400 },
        );
      }

      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(path);

      if (downloadError || !fileBlob) {
        return NextResponse.json(
          { error: 'File knowledge base tidak ditemukan di storage.' },
          { status: 404 },
        );
      }

      const bytes = Buffer.from(await fileBlob.arrayBuffer());
      if (bytes.length <= 0 || bytes.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Ukuran file knowledge base tidak valid.' },
          { status: 413 },
        );
      }

      const lowerPath = path.toLowerCase();
      const mimeType =
        lowerPath.endsWith('.md')
          ? 'text/markdown'
          : lowerPath.endsWith('.json')
            ? 'application/json'
            : lowerPath.endsWith('.csv')
              ? 'text/csv'
              : lowerPath.endsWith('.html')
                ? 'text/html'
                : 'text/plain';

      const fileName = path.split('/').pop() || 'knowledge.txt';
      const documentTitle = title || sanitizeTitle(fileName);
      const text = extractText(fileName, mimeType, bytes);

      const { data: document, error: insertError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: documentTitle,
          storage_path: path,
          mime_type: mimeType,
          file_size: bytes.length,
          status: 'processing',
          created_by: user.id,
        })
        .select('id,title,status')
        .single();

      if (insertError || !document) {
        throw insertError || new Error('Gagal membuat metadata knowledge document.');
      }

      try {
        const indexed = await indexKnowledgeDocument({
          documentId: document.id,
          text,
        });

        const { error: updateError } = await supabase
          .from('knowledge_documents')
          .update({
            status: 'ready',
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id);

        if (updateError) throw updateError;

        return NextResponse.json({
          success: true,
          documentId: document.id,
          title: document.title,
          status: 'ready',
          chunkCount: indexed.chunkCount,
        });
      } catch (error) {
        await supabase
          .from('knowledge_documents')
          .update({
            status: 'failed',
            error_message:
              error instanceof Error ? error.message.slice(0, 1000) : 'Indexing failed.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id);

        throw error;
      }
    }

    return NextResponse.json({ error: 'Action tidak valid.' }, { status: 400 });
  } catch (error) {
    console.error('Knowledge upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal memproses knowledge base.',
      },
      { status: 500 },
    );
  }
}
