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

  // Fetch linked app users for squares players that have player_user_id
  const userIds = (entries || [])
    .map((e: { player_user_id?: string }) => e.player_user_id)
    .filter(Boolean);

  const userMap = new Map<string, string>(); // user_id -> username
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('user_id, username')
      .in('user_id', userIds);

    for (const u of users || []) {
      userMap.set(u.user_id, u.username);
    }
  }

  // Build per-player square counts and track linked identities
  const playerSquares = new Map<string, number>();
  // Map: squares player_name -> { userId, appUsername } for logged-in players
  const playerIdentities = new Map<string, { userId: string; appUsername: string }>();

  for (const entry of entries || []) {
    playerSquares.set(
      entry.player_name,
      (playerSquares.get(entry.player_name) || 0) + 1
    );

    // Track linked identity (first one wins if same player_name used by multiple entries)
    if (entry.player_user_id && !playerIdentities.has(entry.player_name)) {
      const appUsername = userMap.get(entry.player_user_id);
      if (appUsername) {
        playerIdentities.set(entry.player_name, {
          userId: entry.player_user_id,
          appUsername,
        });
      }
    }
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

  // Build settlement data with linked identity info
  const settlements = Array.from(playerSquares.entries()).map(([name, count]) => {
    const identity = playerIdentities.get(name);
    return {
      playerName: name,
      squareCount: count,
      entryFee,
      totalOwed: count * entryFee,
      winnings: playerWinnings.get(name) || 0,
      // Linked identity from app login (if they were logged in when claiming)
      appUsername: identity?.appUsername || null,
    };
  });

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
