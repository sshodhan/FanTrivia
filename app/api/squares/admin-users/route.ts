import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase';

// GET /api/squares/admin-users?game_id=xxx - Get all users with their squares count for a game
export async function GET(request: NextRequest) {
  const authError = await validateAdminAccess(request);
  if (authError) return authError;

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('game_id');

  if (!gameId) {
    return NextResponse.json({ error: 'game_id is required' }, { status: 400 });
  }

  // Fetch all registered users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('user_id, username, avatar, is_admin, created_at')
    .order('username', { ascending: true });

  if (usersError) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // Fetch all entries for this game
  const { data: entries, error: entriesError } = await supabase
    .from('squares_entries')
    .select('player_name, player_user_id, row_index, col_index')
    .eq('game_id', gameId);

  if (entriesError) {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }

  // Build a map of user_id -> squares info
  const squaresMap = new Map<string, { count: number; squares: Array<{ row: number; col: number }> }>();
  // Also track by player_name for guests (no user_id)
  const guestSquaresMap = new Map<string, { count: number; squares: Array<{ row: number; col: number }> }>();

  for (const entry of entries || []) {
    if (entry.player_user_id) {
      const existing = squaresMap.get(entry.player_user_id) || { count: 0, squares: [] };
      existing.count++;
      existing.squares.push({ row: entry.row_index, col: entry.col_index });
      squaresMap.set(entry.player_user_id, existing);
    } else {
      const existing = guestSquaresMap.get(entry.player_name) || { count: 0, squares: [] };
      existing.count++;
      existing.squares.push({ row: entry.row_index, col: entry.col_index });
      guestSquaresMap.set(entry.player_name, existing);
    }
  }

  // Combine users with their squares data
  const usersWithSquares = (users || []).map(user => {
    const squaresInfo = squaresMap.get(user.user_id);
    return {
      user_id: user.user_id,
      username: user.username,
      avatar: user.avatar,
      is_admin: user.is_admin,
      squares_count: squaresInfo?.count || 0,
      squares: squaresInfo?.squares || [],
    };
  });

  // Add guest players (those without user accounts)
  const guestPlayers = Array.from(guestSquaresMap.entries()).map(([name, info]) => ({
    user_id: null,
    username: name,
    avatar: null,
    is_admin: false,
    squares_count: info.count,
    squares: info.squares,
  }));

  return NextResponse.json({
    users: usersWithSquares,
    guests: guestPlayers,
    total_users: (users || []).length,
    total_squares_claimed: (entries || []).length,
  });
}
