import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { logServer, logServerError } from '@/lib/error-tracking/server-logger';

// POST /api/squares/bulk-fill - Fill remaining empty squares
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { game_id, username, mode, house_name } = body;
    // mode: 'round_robin' | 'house'

    if (!game_id || !username || !mode) {
      return NextResponse.json({ error: 'game_id, username, and mode are required' }, { status: 400 });
    }

    // Verify game exists and user is creator
    const { data: game } = await supabase
      .from('squares_games')
      .select('*')
      .eq('id', game_id)
      .single();

    if (!game || game.created_by !== username) {
      return NextResponse.json({ error: 'Only the game creator can bulk-fill squares' }, { status: 403 });
    }

    if (game.status !== 'open') {
      return NextResponse.json({ error: 'Can only bulk-fill when game is open' }, { status: 400 });
    }

    // Get existing entries
    const { data: existingEntries } = await supabase
      .from('squares_entries')
      .select('*')
      .eq('game_id', game_id);

    const entries = existingEntries || [];
    const gridSize = game.grid_size || 10;

    // Find empty squares
    const claimed = new Set(entries.map(e => `${e.row_index}-${e.col_index}`));
    const emptySquares: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!claimed.has(`${r}-${c}`)) {
          emptySquares.push({ row: r, col: c });
        }
      }
    }

    if (emptySquares.length === 0) {
      return NextResponse.json({ error: 'No empty squares to fill' }, { status: 400 });
    }

    let newEntries: Array<{ game_id: string; row_index: number; col_index: number; player_name: string }>;

    if (mode === 'house') {
      const hName = house_name?.trim() || 'House';
      newEntries = emptySquares.map(sq => ({
        game_id,
        row_index: sq.row,
        col_index: sq.col,
        player_name: hName,
      }));
    } else {
      // Round-robin among existing players
      const playerNames = [...new Set(entries.map(e => e.player_name))];
      if (playerNames.length === 0) {
        return NextResponse.json({ error: 'No existing players to distribute to' }, { status: 400 });
      }
      newEntries = emptySquares.map((sq, i) => ({
        game_id,
        row_index: sq.row,
        col_index: sq.col,
        player_name: playerNames[i % playerNames.length],
      }));
    }

    const { data: inserted, error: insertError } = await supabase
      .from('squares_entries')
      .insert(newEntries)
      .select();

    if (insertError) {
      logServerError('squares-bulk-fill', 'bulk_fill_failed', insertError, { gameId: game_id, mode, count: newEntries.length });
      return NextResponse.json({ error: 'Failed to bulk-fill squares' }, { status: 500 });
    }

    // Log to audit
    await supabase
      .from('squares_audit_log')
      .insert({
        game_id,
        action: 'bulk_fill',
        details: {
          mode,
          house_name: mode === 'house' ? (house_name?.trim() || 'House') : null,
          squares_filled: emptySquares.length,
        },
        performed_by: username,
      });

    logServer({
      level: 'info',
      component: 'squares-bulk-fill',
      event: 'bulk_fill_completed',
      data: { gameId: game_id, mode, squaresFilled: emptySquares.length, performedBy: username },
    });

    return NextResponse.json({ entries: inserted, filled: emptySquares.length });
  } catch (err) {
    logServerError('squares-bulk-fill', 'bulk_fill_error', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
