-- Seahawks Super Bowl Trivia App Database Schema
-- Simplified with username-based auth
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS photo_likes CASCADE;
DROP TABLE IF EXISTS photo_uploads CASCADE;
DROP TABLE IF EXISTS team_daily_progress CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS game_day_rounds CASCADE;
DROP TABLE IF EXISTS daily_trivia_sets CASCADE;
DROP TABLE IF EXISTS trivia_questions CASCADE;
DROP TABLE IF EXISTS seahawks_players CASCADE;
DROP TABLE IF EXISTS admin_action_logs CASCADE;
DROP TABLE IF EXISTS game_state CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE (simplified auth)
-- ============================================
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  avatar TEXT NOT NULL DEFAULT 'hawk',
  is_preset_image BOOLEAN DEFAULT true,
  image_url TEXT,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  days_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ,
  CONSTRAINT valid_avatar CHECK (
    avatar IN ('hawk', 'blitz', '12', 'superfan', '12th_man', 'girls_rule', 'hero', 'champion', 'trophy', 'queen', 'sparkle', 'fire')
  ),
  CONSTRAINT username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 30)
);

-- Index for leaderboard queries
CREATE INDEX idx_users_total_points ON users(total_points DESC);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- TRIVIA QUESTIONS TABLE
-- ============================================
CREATE TABLE trivia_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  image_url TEXT,
  image_source TEXT CHECK (image_source IN ('web', 'generated', 'uploaded')),
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  hint_text TEXT,
  time_limit_seconds INTEGER DEFAULT 15,
  points INTEGER DEFAULT 100,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_category ON trivia_questions(category);
CREATE INDEX idx_questions_difficulty ON trivia_questions(difficulty);
CREATE INDEX idx_questions_active ON trivia_questions(is_active);

-- ============================================
-- DAILY TRIVIA SETS TABLE
-- ============================================
CREATE TABLE daily_trivia_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_identifier TEXT NOT NULL UNIQUE,
  display_date DATE NOT NULL,
  question_ids UUID[] NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_sets_day ON daily_trivia_sets(day_identifier);
CREATE INDEX idx_daily_sets_active ON daily_trivia_sets(is_active);

-- ============================================
-- GAME DAY ROUNDS TABLE (for live synchronized play)
-- ============================================
CREATE TABLE game_day_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_number INTEGER NOT NULL,
  question_ids UUID[] NOT NULL,
  is_live BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- ============================================
-- DAILY ANSWERS TABLE (tracks individual responses)
-- ============================================
CREATE TABLE daily_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
  day_identifier TEXT,
  selected_answer TEXT NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0,
  streak_bonus INTEGER DEFAULT 0,
  time_taken_ms INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(username, question_id, (answered_at::DATE))
);

CREATE INDEX idx_answers_username ON daily_answers(username);
CREATE INDEX idx_answers_day ON daily_answers(day_identifier);
CREATE INDEX idx_answers_date ON daily_answers((answered_at::DATE));

-- ============================================
-- PHOTO UPLOADS TABLE
-- ============================================
CREATE TABLE photo_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  like_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_username ON photo_uploads(username);
CREATE INDEX idx_photos_approved ON photo_uploads(is_approved, is_hidden, created_at DESC);

-- ============================================
-- PHOTO LIKES TABLE
-- ============================================
CREATE TABLE photo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photo_uploads(id) ON DELETE CASCADE,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, username)
);

CREATE INDEX idx_photo_likes_photo ON photo_likes(photo_id);

-- ============================================
-- PLAYERS TABLE (Super Bowl Heroes)
-- ============================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  jersey_number INTEGER NOT NULL,
  position TEXT NOT NULL,
  image_url TEXT,
  stats JSONB,                    -- Flexible key-value stats: {"Passing Yards": "206", "Touchdowns": "2"}
  trivia JSONB,                   -- Array of trivia facts: ["Fact 1", "Fact 2", "Fact 3"]
  bio TEXT,
  super_bowl_highlight TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_players_active ON players(is_active, display_order);

-- ============================================
-- GAME SETTINGS TABLE (singleton)
-- ============================================
CREATE TABLE game_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  game_day_mode BOOLEAN DEFAULT false,
  questions_per_day INTEGER DEFAULT 5,
  timer_duration INTEGER DEFAULT 15,
  scores_locked BOOLEAN DEFAULT false,
  current_day TEXT DEFAULT 'day_minus_4',
  live_question_index INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO game_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ADMIN ACTION LOGS TABLE
-- ============================================
CREATE TABLE admin_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_performed_at ON admin_action_logs(performed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_trivia_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_day_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, anyone can insert (registration), anyone can update
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can register" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (true);

-- Questions: Read-only for active questions
CREATE POLICY "Questions are viewable" ON trivia_questions FOR SELECT USING (is_active = true);

-- Daily sets: Read-only for active sets
CREATE POLICY "Active daily sets are viewable" ON daily_trivia_sets FOR SELECT USING (is_active = true);

-- Game day rounds: Read-only
CREATE POLICY "Game rounds are viewable" ON game_day_rounds FOR SELECT USING (true);

-- Daily answers: Anyone can read, anyone can insert
CREATE POLICY "Answers are viewable" ON daily_answers FOR SELECT USING (true);
CREATE POLICY "Users can submit answers" ON daily_answers FOR INSERT WITH CHECK (true);

-- Photos: Only approved non-hidden photos visible, anyone can upload
CREATE POLICY "Approved photos are viewable" ON photo_uploads FOR SELECT USING (is_approved = true AND is_hidden = false);
CREATE POLICY "Users can upload photos" ON photo_uploads FOR INSERT WITH CHECK (true);

-- Photo likes: Anyone can see and create/delete
CREATE POLICY "Likes are viewable" ON photo_likes FOR SELECT USING (true);
CREATE POLICY "Users can like photos" ON photo_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unlike photos" ON photo_likes FOR DELETE USING (true);

-- Players: Read-only for active players
CREATE POLICY "Players are viewable" ON players FOR SELECT USING (is_active = true);

-- Game settings: Read-only
CREATE POLICY "Settings are viewable" ON game_settings FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update photo like count
CREATE OR REPLACE FUNCTION update_photo_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE photo_uploads SET like_count = like_count + 1 WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photo_uploads SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_photo_likes
  AFTER INSERT OR DELETE ON photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_like_count();

-- Function to update user stats after answering
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    total_points = total_points + NEW.points_earned + NEW.streak_bonus,
    last_played_at = NOW()
  WHERE username = NEW.username;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON daily_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  username TEXT,
  avatar TEXT,
  total_points INTEGER,
  current_streak INTEGER,
  days_played INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY u.total_points DESC) as rank,
    u.username,
    u.avatar,
    u.total_points,
    u.current_streak,
    u.days_played
  FROM users u
  WHERE u.total_points > 0
  ORDER BY u.total_points DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- SEED DATA: Super Bowl Heroes
-- ============================================
INSERT INTO players (name, jersey_number, position, display_order, super_bowl_highlight) VALUES
('Russell Wilson', 3, 'Quarterback', 1, 'Led the Seahawks to a 43-8 victory in Super Bowl XLVIII'),
('Marshawn Lynch', 24, 'Running Back', 2, 'Beast Mode touchdown run in Super Bowl XLVIII'),
('Richard Sherman', 25, 'Cornerback', 3, 'Key interception sealing NFC Championship'),
('Malcolm Smith', 53, 'Linebacker', 4, 'Super Bowl XLVIII MVP with pick-six'),
('Earl Thomas', 29, 'Safety', 5, 'Legion of Boom leader, 2 interceptions in playoffs'),
('Kam Chancellor', 31, 'Safety', 6, 'Devastating hits and forced fumbles');

-- ============================================
-- SEED DATA: Sample Trivia Questions
-- ============================================
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('What year did the Seattle Seahawks win their first Super Bowl?', '2012', '2013', '2014', '2015', 'b', 'easy', 'Super Bowl XLVIII'),
('Who was named MVP of Super Bowl XLVIII?', 'Russell Wilson', 'Marshawn Lynch', 'Malcolm Smith', 'Richard Sherman', 'c', 'easy', 'Super Bowl XLVIII'),
('What was the final score of Super Bowl XLVIII?', '43-8', '34-7', '38-10', '41-14', 'a', 'medium', 'Super Bowl XLVIII'),
('Which team did the Seahawks defeat in Super Bowl XLVIII?', 'New England Patriots', 'San Francisco 49ers', 'Denver Broncos', 'Green Bay Packers', 'c', 'easy', 'Super Bowl XLVIII'),
('Who returned an interception for a touchdown in Super Bowl XLVIII?', 'Richard Sherman', 'Earl Thomas', 'Malcolm Smith', 'Kam Chancellor', 'c', 'medium', 'Super Bowl XLVIII'),
('What was the nickname of the Seahawks legendary defense?', 'Steel Curtain', 'Legion of Boom', 'Purple People Eaters', 'Monsters of the Midway', 'b', 'easy', 'Seahawks History'),
('How many seconds into Super Bowl XLVIII did the Seahawks score their first points?', '8 seconds', '12 seconds', '15 seconds', '20 seconds', 'b', 'hard', 'Super Bowl XLVIII'),
('Who caught the first touchdown pass in Super Bowl XLVIII?', 'Golden Tate', 'Doug Baldwin', 'Percy Harvin', 'Jermaine Kearse', 'd', 'hard', 'Super Bowl XLVIII'),
('What jersey number did Beast Mode Marshawn Lynch wear?', '20', '22', '24', '28', 'c', 'easy', 'Seahawks History'),
('Which Seahawk had the famous "tip" play in the NFC Championship?', 'Earl Thomas', 'Richard Sherman', 'Kam Chancellor', 'Byron Maxwell', 'b', 'medium', 'Seahawks History');
