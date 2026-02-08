import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// POST /api/admin/init-squares - Create the squares game tables
// This uses the Supabase SQL execution endpoint directly since
// the JS client doesn't support DDL statements.
export async function POST(request: NextRequest) {
  const authError = await validateAdminAccess(request);
  if (authError) return authError;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  // Individual DDL statements to execute in order
  const statements = [
    // 1. Create squares_games table
    `CREATE TABLE IF NOT EXISTS squares_games (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      team_a_name TEXT NOT NULL DEFAULT 'Seahawks',
      team_b_name TEXT NOT NULL DEFAULT 'Patriots',
      grid_size INT NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'in_progress', 'completed')),
      row_numbers INT[] DEFAULT NULL,
      col_numbers INT[] DEFAULT NULL,
      q1_score_a INT DEFAULT NULL,
      q1_score_b INT DEFAULT NULL,
      q2_score_a INT DEFAULT NULL,
      q2_score_b INT DEFAULT NULL,
      q3_score_a INT DEFAULT NULL,
      q3_score_b INT DEFAULT NULL,
      q4_score_a INT DEFAULT NULL,
      q4_score_b INT DEFAULT NULL,
      created_by TEXT NOT NULL,
      entry_fee DECIMAL DEFAULT NULL,
      share_code TEXT UNIQUE DEFAULT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    // 2. Create squares_entries table
    `CREATE TABLE IF NOT EXISTS squares_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_id UUID NOT NULL REFERENCES squares_games(id) ON DELETE CASCADE,
      row_index INT NOT NULL CHECK (row_index >= 0 AND row_index <= 9),
      col_index INT NOT NULL CHECK (col_index >= 0 AND col_index <= 9),
      player_name TEXT NOT NULL,
      player_user_id TEXT DEFAULT NULL,
      claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(game_id, row_index, col_index)
    )`,

    // 3. Create squares_winners table
    `CREATE TABLE IF NOT EXISTS squares_winners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_id UUID NOT NULL REFERENCES squares_games(id) ON DELETE CASCADE,
      quarter INT NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
      entry_id UUID NOT NULL REFERENCES squares_entries(id) ON DELETE CASCADE,
      winning_row_digit INT NOT NULL,
      winning_col_digit INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(game_id, quarter)
    )`,

    // 4. Indexes
    `CREATE INDEX IF NOT EXISTS idx_squares_entries_game_id ON squares_entries(game_id)`,
    `CREATE INDEX IF NOT EXISTS idx_squares_winners_game_id ON squares_winners(game_id)`,
    `CREATE INDEX IF NOT EXISTS idx_squares_games_share_code ON squares_games(share_code)`,
    `CREATE INDEX IF NOT EXISTS idx_squares_games_created_by ON squares_games(created_by)`,

    // 5. Trigger function
    `CREATE OR REPLACE FUNCTION update_squares_games_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`,

    // 6. Trigger (drop first to avoid duplicate error)
    `DROP TRIGGER IF EXISTS trigger_squares_games_updated_at ON squares_games`,
    `CREATE TRIGGER trigger_squares_games_updated_at
      BEFORE UPDATE ON squares_games
      FOR EACH ROW
      EXECUTE FUNCTION update_squares_games_updated_at()`,
  ];

  const results: { index: number; status: string; error?: string }[] = [];

  for (let i = 0; i < statements.length; i++) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: statements[i] }),
      });

      // If the RPC endpoint doesn't work, try the pg-meta SQL endpoint
      if (!response.ok) {
        // Try alternative: use the Supabase pg-meta endpoint
        const altResponse = await fetch(`${supabaseUrl}/pg/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: statements[i] }),
        });

        if (!altResponse.ok) {
          const errorText = await altResponse.text();
          results.push({ index: i, status: 'error', error: errorText });
          continue;
        }
      }

      results.push({ index: i, status: 'ok' });
    } catch (err) {
      results.push({ index: i, status: 'error', error: String(err) });
    }
  }

  const allOk = results.every(r => r.status === 'ok');
  const errors = results.filter(r => r.status === 'error');

  return NextResponse.json({
    success: allOk,
    message: allOk
      ? 'All squares tables created successfully'
      : `${results.filter(r => r.status === 'ok').length}/${statements.length} statements succeeded`,
    results,
    errors,
    hint: errors.length > 0
      ? 'If the API endpoints failed, run the SQL manually in Supabase Dashboard > SQL Editor. The migration file is at supabase/migrations/20260208_add_squares_game.sql'
      : undefined,
  });
}
