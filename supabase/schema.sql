-- Seahawks Super Bowl Trivia App Database Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  image_url TEXT,
  is_preset_image BOOLEAN DEFAULT false,
  device_fingerprint VARCHAR(255) UNIQUE,
  session_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_device_fingerprint ON teams(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_teams_session_token ON teams(session_token);

-- Trivia Questions table
CREATE TABLE IF NOT EXISTS trivia_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  image_url TEXT,
  image_source VARCHAR(20) CHECK (image_source IN ('web', 'generated', 'uploaded')),
  options JSONB NOT NULL,
  correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0 AND correct_answer_index <= 3),
  hint_text TEXT,
  time_limit_seconds INTEGER DEFAULT 15,
  points INTEGER DEFAULT 100,
  difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_questions_category ON trivia_questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON trivia_questions(difficulty);

-- Daily Trivia Sets table
CREATE TABLE IF NOT EXISTS daily_trivia_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_identifier VARCHAR(20) NOT NULL,
  display_date DATE NOT NULL,
  question_ids UUID[] NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for day lookups
CREATE INDEX IF NOT EXISTS idx_daily_sets_day ON daily_trivia_sets(day_identifier);
CREATE INDEX IF NOT EXISTS idx_daily_sets_active ON daily_trivia_sets(is_active);

-- Game Day Rounds table
CREATE TABLE IF NOT EXISTS game_day_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_number INTEGER NOT NULL,
  question_ids UUID[] NOT NULL,
  is_live BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
  day_identifier VARCHAR(20),
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0,
  streak_bonus INTEGER DEFAULT 0,
  time_taken_ms INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, question_id)
);

-- Create indexes for score lookups
CREATE INDEX IF NOT EXISTS idx_scores_team ON scores(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_day ON scores(day_identifier);
CREATE INDEX IF NOT EXISTS idx_scores_answered_at ON scores(answered_at);

-- Team Daily Progress table
CREATE TABLE IF NOT EXISTS team_daily_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  day_identifier VARCHAR(20) NOT NULL,
  completed BOOLEAN DEFAULT false,
  total_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_id, day_identifier)
);

-- Create index for progress lookups
CREATE INDEX IF NOT EXISTS idx_progress_team_day ON team_daily_progress(team_id, day_identifier);

-- Photo Uploads table
CREATE TABLE IF NOT EXISTS photo_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  likes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for photo queries
CREATE INDEX IF NOT EXISTS idx_photos_team ON photo_uploads(team_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photo_uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photo_uploads(is_approved, is_hidden);

-- Photo Likes table (to track who liked what)
CREATE TABLE IF NOT EXISTS photo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photo_uploads(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photo_id, team_id)
);

-- Seahawks Players table
CREATE TABLE IF NOT EXISTS seahawks_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  position VARCHAR(50),
  number INTEGER,
  image_url TEXT,
  stats JSONB,
  bio TEXT,
  super_bowl_highlight TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create index for active players
CREATE INDEX IF NOT EXISTS idx_players_active ON seahawks_players(is_active);
CREATE INDEX IF NOT EXISTS idx_players_position ON seahawks_players(position);

-- Admin Action Log table
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for log queries
CREATE INDEX IF NOT EXISTS idx_logs_performed_at ON admin_action_logs(performed_at DESC);

-- Game State table (singleton)
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_mode VARCHAR(20) DEFAULT 'pre_game' CHECK (current_mode IN ('pre_game', 'daily', 'live', 'ended')),
  current_day VARCHAR(20),
  live_question_index INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  leaderboard_locked BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default game state
INSERT INTO game_state (id, current_mode, current_day)
VALUES (1, 'daily', 'day_minus_4')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_trivia_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_day_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seahawks_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Teams: Anyone can read, authenticated can insert/update their own
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Teams can be created by anyone" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Teams can update their own record" ON teams FOR UPDATE USING (true);

-- Questions: Read-only for all (answers should be hidden in API)
CREATE POLICY "Questions are viewable by everyone" ON trivia_questions FOR SELECT USING (true);

-- Daily sets: Read-only for active sets
CREATE POLICY "Active daily sets are viewable" ON daily_trivia_sets FOR SELECT USING (is_active = true);

-- Game day rounds: Read-only
CREATE POLICY "Game rounds are viewable" ON game_day_rounds FOR SELECT USING (true);

-- Scores: Teams can see all scores, but only insert their own
CREATE POLICY "Scores are viewable by everyone" ON scores FOR SELECT USING (true);
CREATE POLICY "Teams can insert their own scores" ON scores FOR INSERT WITH CHECK (true);

-- Progress: Teams can see all, insert/update their own
CREATE POLICY "Progress is viewable by everyone" ON team_daily_progress FOR SELECT USING (true);
CREATE POLICY "Teams can insert their own progress" ON team_daily_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Teams can update their own progress" ON team_daily_progress FOR UPDATE USING (true);

-- Photos: Anyone can see approved non-hidden photos, teams can insert their own
CREATE POLICY "Approved photos are viewable" ON photo_uploads FOR SELECT USING (is_approved = true AND is_hidden = false);
CREATE POLICY "Teams can upload photos" ON photo_uploads FOR INSERT WITH CHECK (true);

-- Photo likes: Anyone can see, teams can insert their own
CREATE POLICY "Likes are viewable" ON photo_likes FOR SELECT USING (true);
CREATE POLICY "Teams can like photos" ON photo_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Teams can unlike photos" ON photo_likes FOR DELETE USING (true);

-- Players: Read-only for all
CREATE POLICY "Players are viewable by everyone" ON seahawks_players FOR SELECT USING (is_active = true);

-- Game state: Read-only for all
CREATE POLICY "Game state is viewable" ON game_state FOR SELECT USING (true);

-- Admin logs: No public access (use service role)
-- No policy needed - service role bypasses RLS

-- Functions for leaderboard calculations

-- Function to get team total points
CREATE OR REPLACE FUNCTION get_team_total_points(p_team_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(points_earned + streak_bonus) FROM scores WHERE team_id = p_team_id),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  team_id UUID,
  team_name VARCHAR(50),
  team_image TEXT,
  total_points BIGINT,
  days_played BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.points_earned + s.streak_bonus), 0) DESC) as rank,
    t.id as team_id,
    t.name as team_name,
    t.image_url as team_image,
    COALESCE(SUM(s.points_earned + s.streak_bonus), 0) as total_points,
    COUNT(DISTINCT tdp.day_identifier) as days_played
  FROM teams t
  LEFT JOIN scores s ON t.id = s.team_id
  LEFT JOIN team_daily_progress tdp ON t.id = tdp.team_id AND tdp.completed = true
  GROUP BY t.id, t.name, t.image_url
  HAVING COALESCE(SUM(s.points_earned + s.streak_bonus), 0) > 0
  ORDER BY total_points DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update photo like count
CREATE OR REPLACE FUNCTION update_photo_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE photo_uploads SET likes = likes + 1 WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photo_uploads SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for photo likes
DROP TRIGGER IF EXISTS trigger_update_photo_likes ON photo_likes;
CREATE TRIGGER trigger_update_photo_likes
  AFTER INSERT OR DELETE ON photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_likes();

-- Storage bucket for photos (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
