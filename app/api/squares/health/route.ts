import { NextResponse } from 'next/server';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';

// GET /api/squares/health - Verify squares tables exist and are accessible
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      ok: false,
      mode: 'demo',
      message: 'Supabase not configured - running in demo mode',
    });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: 'Supabase client failed to initialize' }, { status: 503 });
  }

  const checks: { table: string; status: string; count?: number; error?: string }[] = [];

  // Check squares_games
  const { count: gamesCount, error: gamesErr } = await supabase
    .from('squares_games')
    .select('*', { count: 'exact', head: true });
  checks.push({
    table: 'squares_games',
    status: gamesErr ? 'error' : 'ok',
    count: gamesCount ?? 0,
    error: gamesErr?.message,
  });

  // Check squares_entries
  const { count: entriesCount, error: entriesErr } = await supabase
    .from('squares_entries')
    .select('*', { count: 'exact', head: true });
  checks.push({
    table: 'squares_entries',
    status: entriesErr ? 'error' : 'ok',
    count: entriesCount ?? 0,
    error: entriesErr?.message,
  });

  // Check squares_winners
  const { count: winnersCount, error: winnersErr } = await supabase
    .from('squares_winners')
    .select('*', { count: 'exact', head: true });
  checks.push({
    table: 'squares_winners',
    status: winnersErr ? 'error' : 'ok',
    count: winnersCount ?? 0,
    error: winnersErr?.message,
  });

  const allOk = checks.every(c => c.status === 'ok');

  return NextResponse.json({
    ok: allOk,
    message: allOk
      ? 'All squares tables are set up and accessible'
      : 'Some tables are missing or inaccessible - run the migration SQL in Supabase Dashboard > SQL Editor',
    checks,
  }, { status: allOk ? 200 : 500 });
}
