import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * POST /api/squares/settlements/claims/review
 * Admin approves or rejects an identity claim.
 *
 * Body: {
 *   claim_id: string,
 *   status: 'approved' | 'rejected'
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const body = await request.json();
  const { claim_id, status } = body;

  if (!claim_id || !status) {
    return NextResponse.json({ error: 'claim_id and status are required' }, { status: 400 });
  }

  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'status must be "approved" or "rejected"' }, { status: 400 });
  }

  const { data: claim, error } = await supabase
    .from('settlement_claims')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', claim_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  return NextResponse.json({ claim });
}
