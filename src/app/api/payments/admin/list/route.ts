import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { isAdminUser } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('payments')
      .select(
        'id,user_id,provider_order_id,amount,status,proof_path,created_at,submitted_at,reviewed_at,review_note',
      )
      .eq('provider', 'dana_manual')
      .in('status', ['pending_review', 'rejected', 'paid'])
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) throw error;

    const userIds = [...new Set((data || []).map((item) => item.user_id))];
    const profileMap = new Map<string, { email: string | null; displayName: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id,email,display_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      for (const profile of profiles || []) {
        profileMap.set(profile.id, {
          email: profile.email || null,
          displayName: profile.display_name || null,
        });
      }
    }

    const items = await Promise.all(
      (data || []).map(async (payment) => {
        let proofUrl: string | null = null;

        if (payment.proof_path) {
          const { data: signed, error: signedError } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(payment.proof_path, 300);

          if (!signedError) proofUrl = signed.signedUrl;
        }

        const profile = profileMap.get(payment.user_id);

        return {
          id: payment.id,
          userId: payment.user_id,
          email: profile?.email || null,
          displayName: profile?.displayName || null,
          orderId: payment.provider_order_id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.created_at,
          submittedAt: payment.submitted_at,
          reviewedAt: payment.reviewed_at,
          reviewNote: payment.review_note,
          proofUrl,
        };
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Admin payment list error:', error);
    return NextResponse.json({ error: 'Gagal memuat pembayaran.' }, { status: 500 });
  }
}
