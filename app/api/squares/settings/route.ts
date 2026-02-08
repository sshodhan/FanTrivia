import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { logServer, logServerError } from '@/lib/error-tracking/server-logger';

// PATCH /api/squares/settings - Update game settings (e.g. max squares per player)
export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, max_squares_per_player, username } = body;

    if (!game_id || !username) {
      return NextResponse.json({ error: 'game_id and username are required' }, { status: 400 });
    }

    // Validate max_squares_per_player: must be null or a number 1-100
    if (max_squares_per_player !== null && max_squares_per_player !== undefined) {
      const parsed = Number(max_squares_per_player);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        return NextResponse.json({ error: 'max_squares_per_player must be between 1 and 100, or null for unlimited' }, { status: 400 });
      }
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
      return NextResponse.json({ error: 'Only the game creator can change settings' }, { status: 403 });
    }

    if (game.status !== 'open') {
      return NextResponse.json({ error: 'Settings can only be changed while the game is open' }, { status: 400 });
    }

    const newValue = max_squares_per_player === null || max_squares_per_player === undefined
      ? null
      : Number(max_squares_per_player);
    const oldValue = game.max_squares_per_player;

    // Update the game
    const { error: updateError } = await supabase
      .from('squares_games')
      .update({ max_squares_per_player: newValue })
      .eq('id', game_id);

    if (updateError) {
      logServerError('squares-settings', 'update_max_squares_failed', updateError, { gameId: game_id });
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    // Log the change to audit log
    await supabase
      .from('squares_audit_log')
      .insert({
        game_id,
        action: 'settings_change',
        details: {
          setting: 'max_squares_per_player',
          old_value: oldValue,
          new_value: newValue,
          changed_by: username,
        },
        performed_by: username,
      });

    logServer({
      level: 'info',
      component: 'squares-settings',
      event: 'max_squares_updated',
      data: { gameId: game_id, oldValue, newValue, changedBy: username },
    });

    return NextResponse.json({ success: true, max_squares_per_player: newValue });
  } catch (err) {
    logServerError('squares-settings', 'settings_error', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
