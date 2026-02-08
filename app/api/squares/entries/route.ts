import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { logServer, logServerError } from '@/lib/error-tracking/server-logger';

// POST /api/squares/entries - Claim a square (or multiple squares)
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, squares, player_name, player_user_id, player_emoji, player_color } = body;

    if (!game_id || !player_name || !squares || !Array.isArray(squares) || squares.length === 0) {
      return NextResponse.json({ error: 'game_id, player_name, and squares array are required' }, { status: 400 });
    }

    // Verify game exists and is open (use select('*') for backward compat with pre-migration DB)
    const { data: game, error: gameError } = await supabase
      .from('squares_games')
      .select('*')
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status !== 'open') {
      return NextResponse.json({ error: 'Game is no longer accepting entries' }, { status: 400 });
    }

    // Enforce max squares per player (v2 column - may not exist yet)
    if (game.max_squares_per_player) {
      const { count } = await supabase
        .from('squares_entries')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game_id)
        .eq('player_name', player_name);

      const currentCount = count || 0;
      if (currentCount + squares.length > game.max_squares_per_player) {
        logServer({
          level: 'warn',
          component: 'squares-entries',
          event: 'max_squares_exceeded',
          data: { gameId: game_id, playerName: player_name, currentCount, attempting: squares.length, max: game.max_squares_per_player },
        });
        return NextResponse.json({
          error: `Maximum ${game.max_squares_per_player} squares per player. You already have ${currentCount}.`,
        }, { status: 400 });
      }
    }

    // Build insert array (only include v2 columns if provided)
    const entries = squares.map((sq: { row: number; col: number }) => {
      const entry: Record<string, unknown> = {
        game_id,
        row_index: sq.row,
        col_index: sq.col,
        player_name,
        player_user_id: player_user_id || null,
      };
      if (player_emoji) entry.player_emoji = player_emoji;
      if (player_color) entry.player_color = player_color;
      return entry;
    });

    const { data: inserted, error: insertError } = await supabase
      .from('squares_entries')
      .insert(entries)
      .select();

    if (insertError) {
      if (insertError.code === '23505') {
        logServer({ level: 'warn', component: 'squares-entries', event: 'squares_already_claimed', data: { gameId: game_id, playerName: player_name, squareCount: squares.length } })
        return NextResponse.json({ error: 'One or more squares are already claimed' }, { status: 409 });
      }
      logServerError('squares-entries', 'claim_squares_failed', insertError, { gameId: game_id, playerName: player_name })
      return NextResponse.json({ error: 'Failed to claim squares' }, { status: 500 });
    }

    logServer({
      level: 'info',
      component: 'squares-entries',
      event: 'squares_claimed',
      data: { gameId: game_id, playerName: player_name, squareCount: squares.length, playerUserId: player_user_id || null },
    })

    return NextResponse.json({ entries: inserted }, { status: 201 });
  } catch (err) {
    logServerError('squares-entries', 'claim_squares_error', err)
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
      logServerError('squares-entries', 'remove_entry_failed', error, { entryId: entry_id, gameId: game_id })
      return NextResponse.json({ error: 'Failed to remove entry' }, { status: 500 });
    }

    logServer({ level: 'info', component: 'squares-entries', event: 'entry_removed', data: { entryId: entry_id, gameId: game_id, removedBy: username } })

    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError('squares-entries', 'remove_entry_error', err)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
