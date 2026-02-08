import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// POST /api/squares/entries - Claim a square (or multiple squares)
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, squares, player_name, player_user_id } = body;

    if (!game_id || !player_name || !squares || !Array.isArray(squares) || squares.length === 0) {
      return NextResponse.json({ error: 'game_id, player_name, and squares array are required' }, { status: 400 });
    }

    // Verify game exists and is open
    const { data: game, error: gameError } = await supabase
      .from('squares_games')
      .select('id, status')
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status !== 'open') {
      return NextResponse.json({ error: 'Game is no longer accepting entries' }, { status: 400 });
    }

    // Build insert array
    const entries = squares.map((sq: { row: number; col: number }) => ({
      game_id,
      row_index: sq.row,
      col_index: sq.col,
      player_name,
      player_user_id: player_user_id || null,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('squares_entries')
      .insert(entries)
      .select();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'One or more squares are already claimed' }, { status: 409 });
      }
      console.error('Error claiming squares:', insertError);
      return NextResponse.json({ error: 'Failed to claim squares' }, { status: 500 });
    }

    return NextResponse.json({ entries: inserted }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/squares/entries - Remove a square entry (admin only)
export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { entry_id, game_id, username } = body;

    if (!entry_id || !game_id || !username) {
      return NextResponse.json({ error: 'entry_id, game_id, and username are required' }, { status: 400 });
    }

    // Verify the requester is the game creator
    const { data: game } = await supabase
      .from('squares_games')
      .select('created_by, status')
      .eq('id', game_id)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.created_by !== username) {
      return NextResponse.json({ error: 'Only the game creator can remove entries' }, { status: 403 });
    }

    if (game.status !== 'open') {
      return NextResponse.json({ error: 'Cannot remove entries after the board is locked' }, { status: 400 });
    }

    const { error } = await supabase
      .from('squares_entries')
      .delete()
      .eq('id', entry_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
