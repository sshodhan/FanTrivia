import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { shuffleNumbers } from '@/lib/squares-utils';

// POST /api/squares/lock - Lock the board and assign random numbers
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
      return NextResponse.json({ error: 'Only the game creator can lock the board' }, { status: 403 });
    }

    if (game.status !== 'open') {
      return NextResponse.json({ error: 'Game is already locked or completed' }, { status: 400 });
    }

    // Generate random numbers
    const rowNumbers = shuffleNumbers();
    const colNumbers = shuffleNumbers();

    // Update game
    const { data: updated, error: updateError } = await supabase
      .from('squares_games')
      .update({
        status: 'locked',
        row_numbers: rowNumbers,
        col_numbers: colNumbers,
      })
      .eq('id', game_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error locking game:', updateError);
      return NextResponse.json({ error: 'Failed to lock game' }, { status: 500 });
    }

    return NextResponse.json({ game: updated });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
