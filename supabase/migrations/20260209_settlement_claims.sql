-- Settlement Identity Claims
-- Migration: 20260209_settlement_claims.sql
--
-- Stores identity mappings (NOT financial data) so people can
-- self-identify across systems: app username, squares name, WhatsApp name.
-- Admin reviews and approves before using in settlement calculations.

CREATE TABLE IF NOT EXISTS settlement_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES squares_games(id) ON DELETE CASCADE,

  -- Identity from Squares
  squares_player_name TEXT NOT NULL,

  -- Identity from WhatsApp (self-reported)
  whatsapp_name TEXT NOT NULL,

  -- Identity from app login (if logged in when claiming)
  app_user_id TEXT DEFAULT NULL,
  app_username TEXT DEFAULT NULL,

  -- How many squares they have (denormalized for display, not authoritative)
  squares_count INT DEFAULT 0,

  -- Admin review
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One claim per squares player name per game
  UNIQUE(game_id, squares_player_name)
);

CREATE INDEX IF NOT EXISTS idx_settlement_claims_game_id ON settlement_claims(game_id);
CREATE INDEX IF NOT EXISTS idx_settlement_claims_status ON settlement_claims(status);

-- RLS policies
ALTER TABLE settlement_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to settlement_claims"
  ON settlement_claims FOR ALL
  USING (true)
  WITH CHECK (true);
