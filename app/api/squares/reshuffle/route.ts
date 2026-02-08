import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { shuffleNumbers } from '@/lib/squares-utils';
import { logServer, logServerError } from '@/lib/error-tracking/server-logger';

// POST /api/squares/reshuffle - Reshuffle numbers (only if no scores entered)
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, username } = body;

    if (!game_id || !username) {
      return NextResponse.json({ error: 'game_id and username are required' }, { status: 400 });
    }

    // Verify game exists and user is creator
    const { data: game, error: gameError } = await supabase
      .from('squares_games')
      .select('*')
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.created_by !== username) {
      return NextResponse.json({ error: 'Only the game creator can reshuffle numbers' }, { status: 403 });
    }

    if (game.status !== 'locked') {
      return NextResponse.json({ error: 'Can only reshuffle when board is locked' }, { status: 400 });
    }

    // Check no scores have been entered
    if (game.q1_score_a !== null || game.q1_score_b !== null) {
      return NextResponse.json({ error: 'Cannot reshuffle after scores have been entered' }, { status: 400 });
    }

    const oldRowNumbers = game.row_numbers;
    const oldColNumbers = game.col_numbers;
    const rowNumbers = shuffleNumbers();
    const colNumbers = shuffleNumbers();

    const { data: updated, error: updateError } = await supabase
      .from('squares_games')
      .update({ row_numbers: rowNumbers, col_numbers: colNumbers })
      .eq('id', game_id)
      .select()
      .single();

    if (updateError) {
      logServerError('squares-reshuffle', 'reshuffle_failed', updateError, { gameId: game_id });
      return NextResponse.json({ error: 'Failed to reshuffle numbers' }, { status: 500 });
    }

    // Log the reshuffle
    await supabase
      .from('squares_audit_log')
      .insert({
        game_id,
        action: 'number_reshuffle',
        details: {
          old_row_numbers: oldRowNumbers,
          old_col_numbers: oldColNumbers,
          new_row_numbers: rowNumbers,
          new_col_numbers: colNumbers,
          reshuffled_by: username,
        },
        performed_by: username,
      });

    logServer({
      level: 'info',
      component: 'squares-reshuffle',
      event: 'numbers_reshuffled',
      data: { gameId: game_id, reshuffledBy: username, rowNumbers, colNumbers },
    });

    return NextResponse.json({ game: updated });
  } catch (err) {
    logServerError('squares-reshuffle', 'reshuffle_error', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
