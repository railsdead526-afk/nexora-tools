import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { isAdminUser } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'knowledge-base';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('id,title,mime_type,file_size,status,error_message,storage_path,created_at,updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Knowledge documents list error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat knowledge documents.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'Document ID diperlukan.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: document, error: lookupError } = await supabase
      .from('knowledge_documents')
      .select('id,storage_path')
      .eq('id', id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!document) {
      return NextResponse.json({ error: 'Document tidak ditemukan.' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    if (document.storage_path) {
      await supabase.storage.from(BUCKET).remove([document.storage_path]);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Knowledge document delete error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus knowledge document.' },
      { status: 500 },
    );
  }
}
