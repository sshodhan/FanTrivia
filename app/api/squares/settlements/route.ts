import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * GET /api/squares/settlements?game_id=xxx
 *
 * Returns squares data structured for expense settlement:
 * - Per-player square counts
 * - Entry fee
 * - Quarter winners and their winnings
 *
 * No financial data is stored - this reads existing game data only.
 */
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('game_id');

  if (!gameId) {
    return NextResponse.json({ error: 'game_id is required' }, { status: 400 });
  }

  // Fetch game
  const { data: game, error: gameError } = await supabase
    .from('squares_games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Fetch entries
  const { data: entries } = await supabase
    .from('squares_entries')
    .select('*')
    .eq('game_id', gameId);

  // Fetch winners
  const { data: winners } = await supabase
    .from('squares_winners')
    .select('*')
    .eq('game_id', gameId)
    .order('quarter', { ascending: true });

  // Build per-player square counts
  const playerSquares = new Map<string, number>();
  for (const entry of entries || []) {
    playerSquares.set(
      entry.player_name,
      (playerSquares.get(entry.player_name) || 0) + 1
    );
  }

  // Determine winners per quarter
  const entryFee = game.entry_fee || 0;
  const totalPot = (entries || []).length * entryFee;

  // Standard payout: 25% per quarter (customizable in the future)
  const quarterPayout = totalPot > 0 ? totalPot * 0.25 : 0;

  // Map winner entry IDs to player names
  const winnerEntryIds = new Set((winners || []).map((w: { entry_id: string }) => w.entry_id));
  const entryMap = new Map<string, string>();
  for (const entry of entries || []) {
    entryMap.set(entry.id, entry.player_name);
  }

  // Calculate winnings per player
  const playerWinnings = new Map<string, number>();
  for (const winner of winners || []) {
    const playerName = entryMap.get(winner.entry_id);
    if (playerName) {
      playerWinnings.set(
        playerName,
        (playerWinnings.get(playerName) || 0) + quarterPayout
      );
    }
  }

  // Build settlement data
  const settlements = Array.from(playerSquares.entries()).map(([name, count]) => ({
    playerName: name,
    squareCount: count,
    entryFee,
    totalOwed: count * entryFee,
    winnings: playerWinnings.get(name) || 0,
  }));

  return NextResponse.json({
    game: {
      id: game.id,
      name: game.name,
      teamA: game.team_a_name,
      teamB: game.team_b_name,
      entryFee,
      status: game.status,
      createdBy: game.created_by,
    },
    totalPot,
    quarterPayout,
    quartersScored: (winners || []).length,
    settlements,
    players: Array.from(playerSquares.keys()),
  });
}
