import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { logServer, logServerError } from '@/lib/error-tracking/server-logger';

// POST /api/squares/reassign - Reassign a square to a different player
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { entry_id, game_id, username, new_player_name } = body;

    if (!entry_id || !game_id || !username || !new_player_name) {
      return NextResponse.json({ error: 'entry_id, game_id, username, and new_player_name are required' }, { status: 400 });
    }

    // Verify requester is game creator
    const { data: game } = await supabase
      .from('squares_games')
      .select('created_by')
      .eq('id', game_id)
      .single();

    if (!game || game.created_by !== username) {
      return NextResponse.json({ error: 'Only the game creator can reassign squares' }, { status: 403 });
    }

    // Get old entry for audit log
    const { data: oldEntry } = await supabase
      .from('squares_entries')
      .select('*')
      .eq('id', entry_id)
      .single();

    if (!oldEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update the entry
    const { data: updated, error: updateError } = await supabase
      .from('squares_entries')
      .update({ player_name: new_player_name.trim() })
      .eq('id', entry_id)
      .select()
      .single();

    if (updateError) {
      logServerError('squares-reassign', 'reassign_failed', updateError, { entryId: entry_id, gameId: game_id });
      return NextResponse.json({ error: 'Failed to reassign square' }, { status: 500 });
    }

    // Log the reassignment
    await supabase
      .from('squares_audit_log')
      .insert({
        game_id,
        action: 'reassign',
        details: {
          entry_id,
          row: oldEntry.row_index,
          col: oldEntry.col_index,
          old_player: oldEntry.player_name,
          new_player: new_player_name.trim(),
        },
        performed_by: username,
      });

    logServer({
      level: 'info',
      component: 'squares-reassign',
      event: 'square_reassigned',
      data: { gameId: game_id, entryId: entry_id, oldPlayer: oldEntry.player_name, newPlayer: new_player_name.trim() },
    });

    return NextResponse.json({ entry: updated });
  } catch (err) {
    logServerError('squares-reassign', 'reassign_error', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
