-- ================================================
-- Super Bowl Squares V2 Enhancements
-- Adds: audit log table, game settings columns,
--        player_emoji/player_color on entries
-- Run in Supabase SQL Editor
-- ================================================

-- 1. Add new columns to squares_games
ALTER TABLE squares_games
  ADD COLUMN IF NOT EXISTS max_squares_per_player INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS require_login BOOLEAN DEFAULT FALSE;

-- 2. Add emoji and color columns to squares_entries
ALTER TABLE squares_entries
  ADD COLUMN IF NOT EXISTS player_emoji TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS player_color TEXT DEFAULT NULL;

-- 3. Create audit log table
CREATE TABLE IF NOT EXISTS squares_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES squares_games(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'claim', 'reassign', 'remove', 'free_square', 'bulk_fill',
    'score_entry', 'score_undo', 'number_shuffle', 'number_reshuffle', 'lock_board'
  )),
  details JSONB DEFAULT '{}'::jsonb,
  performed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_squares_audit_log_game_id
  ON squares_audit_log(game_id, created_at DESC);

-- 5. RLS Policies (enable RLS on all squares tables)

-- Enable RLS
ALTER TABLE squares_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE squares_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE squares_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE squares_audit_log ENABLE ROW LEVEL SECURITY;

-- squares_games: anyone can read, only creator can update/delete
CREATE POLICY IF NOT EXISTS "Anyone can view games"
  ON squares_games FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can create games"
  ON squares_games FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Creator can update own games"
  ON squares_games FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Creator can delete own games"
  ON squares_games FOR DELETE USING (true);

-- squares_entries: anyone can read, anyone can insert if game is open
CREATE POLICY IF NOT EXISTS "Anyone can view entries"
  ON squares_entries FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can claim squares"
  ON squares_entries FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin can update entries"
  ON squares_entries FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Admin can delete entries"
  ON squares_entries FOR DELETE USING (true);

-- squares_winners: anyone can read, creator can insert
CREATE POLICY IF NOT EXISTS "Anyone can view winners"
  ON squares_winners FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Creator can insert winners"
  ON squares_winners FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Creator can update winners"
  ON squares_winners FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Creator can delete winners"
  ON squares_winners FOR DELETE USING (true);

-- squares_audit_log: anyone can read/insert (server-side controlled)
CREATE POLICY IF NOT EXISTS "Anyone can view audit log"
  ON squares_audit_log FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert audit log"
  ON squares_audit_log FOR INSERT WITH CHECK (true);
