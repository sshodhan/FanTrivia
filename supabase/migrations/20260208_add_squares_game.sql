-- Super Bowl Squares Game Tables
-- Migration: 20260208_add_squares_game.sql

-- ============================================
-- SQUARES GAMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS squares_games (
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
);

-- ============================================
-- SQUARES ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS squares_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES squares_games(id) ON DELETE CASCADE,
  row_index INT NOT NULL CHECK (row_index >= 0 AND row_index <= 9),
  col_index INT NOT NULL CHECK (col_index >= 0 AND col_index <= 9),
  player_name TEXT NOT NULL,
  player_user_id TEXT DEFAULT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, row_index, col_index)
);

-- ============================================
-- SQUARES WINNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS squares_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES squares_games(id) ON DELETE CASCADE,
  quarter INT NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  entry_id UUID NOT NULL REFERENCES squares_entries(id) ON DELETE CASCADE,
  winning_row_digit INT NOT NULL,
  winning_col_digit INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, quarter)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_squares_entries_game_id ON squares_entries(game_id);
CREATE INDEX IF NOT EXISTS idx_squares_winners_game_id ON squares_winners(game_id);
CREATE INDEX IF NOT EXISTS idx_squares_games_share_code ON squares_games(share_code);
CREATE INDEX IF NOT EXISTS idx_squares_games_created_by ON squares_games(created_by);

-- ============================================
-- UPDATE TRIGGER for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_squares_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_squares_games_updated_at
  BEFORE UPDATE ON squares_games
  FOR EACH ROW
  EXECUTE FUNCTION update_squares_games_updated_at();
