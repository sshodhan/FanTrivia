import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { logServer, logServerError } from '@/lib/error-tracking/server-logger';

// POST /api/squares/undo-score - Undo the last quarter score
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, username, quarter } = body;

    if (!game_id || !username || !quarter) {
      return NextResponse.json({ error: 'game_id, username, and quarter are required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only the game creator can undo scores' }, { status: 403 });
    }

    // Build score clear update
    const scoreUpdate: Record<string, unknown> = {};
    scoreUpdate[`q${quarter}_score_a`] = null;
    scoreUpdate[`q${quarter}_score_b`] = null;

    // Determine new status
    if (quarter === 1) {
      scoreUpdate.status = 'locked';
    } else {
      scoreUpdate.status = 'in_progress';
    }

    // Clear the scores
    const { error: updateError } = await supabase
      .from('squares_games')
      .update(scoreUpdate)
      .eq('id', game_id);

    if (updateError) {
      logServerError('squares-undo', 'undo_scores_failed', updateError, { gameId: game_id, quarter });
      return NextResponse.json({ error: 'Failed to undo scores' }, { status: 500 });
    }

    // Delete the winner record for this quarter
    await supabase
      .from('squares_winners')
      .delete()
      .eq('game_id', game_id)
      .eq('quarter', quarter);

    // Log the undo
    await supabase
      .from('squares_audit_log')
      .insert({
        game_id,
        action: 'score_undo',
        details: { quarter, undone_by: username },
        performed_by: username,
      });

    logServer({
      level: 'info',
      component: 'squares-undo',
      event: 'score_undone',
      data: { gameId: game_id, quarter, undoneBy: username },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError('squares-undo', 'undo_score_error', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
