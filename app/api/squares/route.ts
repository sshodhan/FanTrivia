import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { generateShareCode } from '@/lib/squares-utils';

// GET /api/squares - List games or get a specific game
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('id');
  const shareCode = searchParams.get('code');
  const createdBy = searchParams.get('created_by');

  // Get a specific game by ID
  if (gameId) {
    const { data: game, error } = await supabase
      .from('squares_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Also fetch entries
    const { data: entries } = await supabase
      .from('squares_entries')
      .select('*')
      .eq('game_id', gameId)
      .order('claimed_at', { ascending: true });

    // Also fetch winners
    const { data: winners } = await supabase
      .from('squares_winners')
      .select('*')
      .eq('game_id', gameId)
      .order('quarter', { ascending: true });

    return NextResponse.json({ game, entries: entries || [], winners: winners || [] });
  }

  // Get game by share code
  if (shareCode) {
    const { data: game, error } = await supabase
      .from('squares_games')
      .select('*')
      .eq('share_code', shareCode.toUpperCase())
      .single();

    if (error || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

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

  // List games by creator
  if (createdBy) {
    const { data: games, error } = await supabase
      .from('squares_games')
      .select('*')
      .eq('created_by', createdBy)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    return NextResponse.json({ games: games || [] });
  }

  // List all active games
  const { data: games, error } = await supabase
    .from('squares_games')
    .select('*')
    .in('status', ['open', 'locked', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }

  return NextResponse.json({ games: games || [] });
}

// POST /api/squares - Create a new game
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, team_a_name, team_b_name, created_by, entry_fee } = body;

    if (!name || !created_by) {
      return NextResponse.json({ error: 'Name and created_by are required' }, { status: 400 });
    }

    const shareCode = generateShareCode();

    const { data: game, error } = await supabase
      .from('squares_games')
      .insert({
        name,
        team_a_name: team_a_name || 'Seahawks',
        team_b_name: team_b_name || 'Patriots',
        created_by,
        entry_fee: entry_fee || null,
        share_code: shareCode,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating squares game:', error);
      return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }

    return NextResponse.json({ game }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
