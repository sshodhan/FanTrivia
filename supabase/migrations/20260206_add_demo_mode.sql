-- Add demo_mode column to game_settings table
-- Default is false (Supabase is used by default)
ALTER TABLE game_settings ADD COLUMN IF NOT EXISTS demo_mode BOOLEAN NOT NULL DEFAULT false;
