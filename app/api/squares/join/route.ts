import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

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

  return NextResponse.json({ game, entries: entries || [], winners: winners || [] });
}
