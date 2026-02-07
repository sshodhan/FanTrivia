-- Add unlocked_categories column to game_settings
-- Stores an array of category IDs that are unlocked regardless of the current day
ALTER TABLE game_settings
ADD COLUMN IF NOT EXISTS unlocked_categories JSONB DEFAULT '[]'::jsonb;
