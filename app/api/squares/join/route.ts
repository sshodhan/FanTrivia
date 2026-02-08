import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { logServer } from '@/lib/error-tracking/server-logger';

// GET /api/squares/join?code=XXXXXX - Look up a game by share code
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
  }

  const { data: game, error } = await supabase
    .from('squares_games')
    .select('*')
    .eq('share_code', code.toUpperCase())
    .single();

  if (error || !game) {
    logServer({ level: 'warn', component: 'squares-join', event: 'join_game_not_found', data: { shareCode: code.toUpperCase() } })
    return NextResponse.json({ error: 'Game not found. Check the code and try again.' }, { status: 404 });
  }

  // Also fetch entries for the game
  const { data: entries } = await supabase
    .from('squares_entries')
    .select('*')
    .eq('game_id', game.id)
    .order('claimed_at', { ascending: true });

  const { data: winners } = await supabase
    .from('squares_winners')
    .select('*')
    .eq('game_id', game.id)
    .order('quarter', { ascending: true });

  logServer({ level: 'info', component: 'squares-join', event: 'game_joined', data: { gameId: game.id, shareCode: code.toUpperCase(), gameName: game.name, entryCount: entries?.length || 0 } })

  return NextResponse.json({ game, entries: entries || [], winners: winners || [] });
}
