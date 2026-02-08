import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// POST /api/squares/scores - Enter scores for a quarter
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, username, quarter, score_a, score_b } = body;

    if (!game_id || !username || !quarter || score_a === undefined || score_b === undefined) {
      return NextResponse.json({ error: 'game_id, username, quarter, score_a, and score_b are required' }, { status: 400 });
    }

    if (quarter < 1 || quarter > 4) {
      return NextResponse.json({ error: 'Quarter must be 1-4' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only the game creator can enter scores' }, { status: 403 });
    }

    if (game.status === 'open') {
      return NextResponse.json({ error: 'Board must be locked before entering scores' }, { status: 400 });
    }

    if (!game.row_numbers || !game.col_numbers) {
      return NextResponse.json({ error: 'Numbers not yet assigned' }, { status: 400 });
    }

    // Build score update
    const scoreUpdate: Record<string, unknown> = {
      status: quarter === 4 ? 'completed' : 'in_progress',
    };
    scoreUpdate[`q${quarter}_score_a`] = score_a;
    scoreUpdate[`q${quarter}_score_b`] = score_b;

    // Update game scores
    const { data: updated, error: updateError } = await supabase
      .from('squares_games')
      .update(scoreUpdate)
      .eq('id', game_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating scores:', updateError);
      return NextResponse.json({ error: 'Failed to update scores' }, { status: 500 });
    }

    // Calculate winning square
    const rowDigit = score_a % 10;
    const colDigit = score_b % 10;
    const winningRow = game.row_numbers.indexOf(rowDigit);
    const winningCol = game.col_numbers.indexOf(colDigit);

    // Find the entry at that position
    const { data: winningEntry } = await supabase
      .from('squares_entries')
      .select('*')
      .eq('game_id', game_id)
      .eq('row_index', winningRow)
      .eq('col_index', winningCol)
      .single();

    let winner = null;
    if (winningEntry) {
      // Upsert winner record
      const { data: winnerRecord, error: winnerError } = await supabase
        .from('squares_winners')
        .upsert({
          game_id,
          quarter,
          entry_id: winningEntry.id,
          winning_row_digit: rowDigit,
          winning_col_digit: colDigit,
        }, { onConflict: 'game_id,quarter' })
        .select()
        .single();

      if (!winnerError) {
        winner = { ...winnerRecord, player_name: winningEntry.player_name };
      }
    }

    return NextResponse.json({
      game: updated,
      winner,
      winning_position: { row: winningRow, col: winningCol, rowDigit, colDigit },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
