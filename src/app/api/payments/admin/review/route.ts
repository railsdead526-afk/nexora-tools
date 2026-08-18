import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { isAdminUser } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type ReviewBody = {
  orderId?: unknown;
  action?: unknown;
  note?: unknown;
};

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as ReviewBody;

    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const action =
      body.action === 'approve' || body.action === 'reject' ? body.action : null;
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : null;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Data review tidak valid.' }, { status: 400 });
    }

    if (action === 'reject' && !note) {
      return NextResponse.json(
        { error: 'Alasan penolakan wajib diisi.' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc('review_manual_payment', {
      p_order_id: orderId,
      p_reviewer_id: user.id,
      p_action: action,
      p_note: note || null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, orderId, action });
  } catch (error) {
    console.error('Admin payment review error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Review pembayaran gagal.',
      },
      { status: 500 },
    );
  }
}
