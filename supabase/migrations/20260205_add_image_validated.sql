-- ============================================
-- Migration: Add image_validated column to players table
-- Date: 2026-02-05
-- Purpose: Allow admin portal to validate player images
--          Only show images that have been verified
-- ============================================

-- Add image_validated column (default false for existing rows)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS image_validated BOOLEAN DEFAULT false;

-- Add index for filtering validated images
CREATE INDEX IF NOT EXISTS idx_players_image_validated
ON players(image_validated) WHERE image_validated = true;

-- Comment for documentation
COMMENT ON COLUMN players.image_validated IS 'Set to true when admin has verified the image_url is correct and appropriate';
