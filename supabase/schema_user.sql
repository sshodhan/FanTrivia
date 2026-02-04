-- HawkTrivia Schema Update: Username-based Auth
-- Run this to migrate from teams-based to username-based auth
-- This is a TARGETED update - run AFTER the original schema

-- ============================================
-- STEP 1: Drop old tables that will be replaced
-- ============================================
DROP TABLE IF EXISTS photo_likes CASCADE;
DROP TABLE IF EXISTS photo_uploads CASCADE;
DROP TABLE IF EXISTS team_daily_progress CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS game_state CASCADE;
DROP TABLE IF EXISTS seahawks_players CASCADE;

-- ============================================
-- STEP 2: Create new USERS table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- STEP 3: Update TRIVIA_QUESTIONS table
-- ============================================
-- Drop and recreate with new column structure
DROP TABLE IF EXISTS trivia_questions CASCADE;

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

CREATE INDEX IF NOT EXISTS idx_questions_category ON trivia_questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON trivia_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON trivia_questions(is_active);

-- ============================================
-- STEP 4: Create DAILY_ANSWERS table (replaces scores)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_answers (
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

CREATE INDEX IF NOT EXISTS idx_answers_username ON daily_answers(username);
CREATE INDEX IF NOT EXISTS idx_answers_day ON daily_answers(day_identifier);
CREATE INDEX IF NOT EXISTS idx_answers_date ON daily_answers((answered_at::DATE));

-- ============================================
-- STEP 5: Create new PHOTO_UPLOADS table
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

CREATE INDEX IF NOT EXISTS idx_photos_username ON photo_uploads(username);
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photo_uploads(is_approved, is_hidden, created_at DESC);

-- ============================================
-- STEP 6: Create new PHOTO_LIKES table
-- ============================================
CREATE TABLE photo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photo_uploads(id) ON DELETE CASCADE,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, username)
);

CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON photo_likes(photo_id);

-- ============================================
-- STEP 7: Create PLAYERS table (replaces seahawks_players)
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

CREATE INDEX IF NOT EXISTS idx_players_active ON players(is_active, display_order);

-- ============================================
-- STEP 8: Create GAME_SETTINGS table (replaces game_state)
-- ============================================
CREATE TABLE game_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_mode TEXT DEFAULT 'daily' CHECK (current_mode IN ('pre_game', 'daily', 'live', 'ended')),
  questions_per_day INTEGER DEFAULT 5,
  timer_duration INTEGER DEFAULT 15,
  scores_locked BOOLEAN DEFAULT false,
  current_day TEXT DEFAULT 'day_minus_4',
  live_question_index INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO game_settings (id, current_mode) VALUES (1, 'daily') ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 9: Enable Row Level Security
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can register" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Questions are viewable" ON trivia_questions;
DROP POLICY IF EXISTS "Answers are viewable" ON daily_answers;
DROP POLICY IF EXISTS "Users can submit answers" ON daily_answers;
DROP POLICY IF EXISTS "Approved photos are viewable" ON photo_uploads;
DROP POLICY IF EXISTS "Users can upload photos" ON photo_uploads;
DROP POLICY IF EXISTS "Likes are viewable" ON photo_likes;
DROP POLICY IF EXISTS "Users can like photos" ON photo_likes;
DROP POLICY IF EXISTS "Users can unlike photos" ON photo_likes;
DROP POLICY IF EXISTS "Players are viewable" ON players;
DROP POLICY IF EXISTS "Settings are viewable" ON game_settings;

-- Create new policies
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can register" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (true);

CREATE POLICY "Questions are viewable" ON trivia_questions FOR SELECT USING (is_active = true);

CREATE POLICY "Answers are viewable" ON daily_answers FOR SELECT USING (true);
CREATE POLICY "Users can submit answers" ON daily_answers FOR INSERT WITH CHECK (true);

CREATE POLICY "Approved photos are viewable" ON photo_uploads FOR SELECT USING (is_approved = true AND is_hidden = false);
CREATE POLICY "Users can upload photos" ON photo_uploads FOR INSERT WITH CHECK (true);

CREATE POLICY "Likes are viewable" ON photo_likes FOR SELECT USING (true);
CREATE POLICY "Users can like photos" ON photo_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unlike photos" ON photo_likes FOR DELETE USING (true);

CREATE POLICY "Players are viewable" ON players FOR SELECT USING (is_active = true);

CREATE POLICY "Settings are viewable" ON game_settings FOR SELECT USING (true);

-- ============================================
-- STEP 10: Create/Update Functions
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

DROP TRIGGER IF EXISTS trigger_update_photo_likes ON photo_likes;
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

DROP TRIGGER IF EXISTS trigger_update_user_stats ON daily_answers;
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
-- STEP 11: Seed Data - Super Bowl Heroes
-- ============================================
INSERT INTO players (name, jersey_number, position, display_order, super_bowl_highlight, bio, stats, trivia) VALUES
(
  'Russell Wilson', 3, 'Quarterback', 1,
  'Led the Seahawks to a 43-8 victory in Super Bowl XLVIII',
  'Super Bowl XLVIII Champion QB',
  '{"Passing Yards": "206", "Touchdowns": "2", "Completion %": "72.4%", "QBR": "123.1"}'::jsonb,
  '["Became the 2nd Black QB to win a Super Bowl", "Led game-opening 80-yard TD drive in 12 plays", "Threw TD passes to Jermaine Kearse and Doug Baldwin", "At 25, one of the youngest QBs to win a championship"]'::jsonb
),
(
  'Marshawn Lynch', 24, 'Running Back', 2,
  'Beast Mode touchdown run in Super Bowl XLVIII',
  'Beast Mode - Super Bowl Champion',
  '{"Rushing Yards": "39", "Touchdowns": "1", "Receptions": "2", "Total Yards": "52"}'::jsonb,
  '["Scored on a powerful 1-yard TD run in the 3rd quarter", "Known as Beast Mode for his punishing running style", "Had the iconic Beast Quake run in 2011 playoffs", "Fan favorite who loved Skittles"]'::jsonb
),
(
  'Richard Sherman', 25, 'Cornerback', 3,
  'Key interception sealing NFC Championship',
  'Legion of Boom - All-Pro Corner',
  '{"Tackles": "3", "Pass Deflections": "2", "Interceptions": "0", "QB Rating Allowed": "52.1"}'::jsonb,
  '["Made the famous tip play to seal 2013 NFC Championship", "3-time First-Team All-Pro cornerback", "Stanford graduate with degree in Communications", "Led the Legion of Boom secondary"]'::jsonb
),
(
  'Malcolm Smith', 53, 'Linebacker', 4,
  'Super Bowl XLVIII MVP with pick-six',
  'Super Bowl XLVIII MVP',
  '{"Tackles": "10", "Interceptions": "1", "INT Return Yards": "69", "Fumble Recovery": "1"}'::jsonb,
  '["Named Super Bowl XLVIII MVP", "Returned an interception 69 yards for a touchdown", "Also recovered a fumble in the game", "Unsung hero who rose to the biggest moment"]'::jsonb
),
(
  'Earl Thomas', 29, 'Safety', 5,
  'Legion of Boom leader, 2 interceptions in playoffs',
  'Legion of Boom - Elite Free Safety',
  '{"Tackles": "5", "Interceptions": "0", "Pass Deflections": "2", "QB Hits": "1"}'::jsonb,
  '["3-time First-Team All-Pro safety", "Fastest safety in the Legion of Boom", "5 Pro Bowl selections with Seattle", "Elite ball hawk and center fielder"]'::jsonb
),
(
  'Kam Chancellor', 31, 'Safety', 6,
  'Devastating hits and forced fumbles',
  'Legion of Boom - The Enforcer',
  '{"Tackles": "7", "Forced Fumbles": "1", "Pass Deflections": "1", "TFL": "1"}'::jsonb,
  '["Known as Bam Bam Kam for devastating hits", "4-time Pro Bowl selection", "Key enforcer of the Legion of Boom", "Forced crucial fumble in Super Bowl"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 12: Seed Data - Trivia Questions by Category
-- Categories available for daily rounds:
--   1. Super Bowl XLVIII (10 questions)
--   2. Legion of Boom (6 questions)
--   3. Russell Wilson Era (6 questions)
--   4. Seahawks Legends (6 questions)
--   5. Stadium & 12s (5 questions)
--   6. Memorable Moments (6 questions)
--   7. Players & Numbers (6 questions)
--   8. Seahawks History (6 questions)
-- ============================================

-- Category: Super Bowl XLVIII
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('What year did the Seattle Seahawks win their first Super Bowl?', '2012', '2013', '2014', '2015', 'b', 'easy', 'Super Bowl XLVIII'),
('Who was named MVP of Super Bowl XLVIII?', 'Russell Wilson', 'Marshawn Lynch', 'Malcolm Smith', 'Richard Sherman', 'c', 'easy', 'Super Bowl XLVIII'),
('What was the final score of Super Bowl XLVIII?', '43-8', '34-7', '38-10', '41-14', 'a', 'medium', 'Super Bowl XLVIII'),
('Which team did the Seahawks defeat in Super Bowl XLVIII?', 'New England Patriots', 'San Francisco 49ers', 'Denver Broncos', 'Green Bay Packers', 'c', 'easy', 'Super Bowl XLVIII'),
('Who returned an interception for a touchdown in Super Bowl XLVIII?', 'Richard Sherman', 'Earl Thomas', 'Malcolm Smith', 'Kam Chancellor', 'c', 'medium', 'Super Bowl XLVIII'),
('How many seconds into Super Bowl XLVIII did the Seahawks score their first points?', '8 seconds', '12 seconds', '15 seconds', '20 seconds', 'b', 'hard', 'Super Bowl XLVIII'),
('Who caught the first touchdown pass in Super Bowl XLVIII?', 'Golden Tate', 'Doug Baldwin', 'Percy Harvin', 'Jermaine Kearse', 'd', 'hard', 'Super Bowl XLVIII'),
('What stadium hosted Super Bowl XLVIII?', 'CenturyLink Field', 'MetLife Stadium', 'Lucas Oil Stadium', 'University of Phoenix Stadium', 'b', 'medium', 'Super Bowl XLVIII'),
('Who kicked off Super Bowl XLVIII with a safety on the first play?', 'Cliff Avril', 'Michael Bennett', 'The snap went over Peyton Manning', 'Bobby Wagner', 'c', 'medium', 'Super Bowl XLVIII'),
('How many turnovers did the Seahawks force in Super Bowl XLVIII?', '2', '3', '4', '5', 'c', 'hard', 'Super Bowl XLVIII')
ON CONFLICT DO NOTHING;

-- Category: Legion of Boom
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('What was the nickname of the Seahawks legendary defense?', 'Steel Curtain', 'Legion of Boom', 'Purple People Eaters', 'Monsters of the Midway', 'b', 'easy', 'Legion of Boom'),
('Which three players formed the core of the Legion of Boom secondary?', 'Sherman, Thomas, Chancellor', 'Sherman, Thomas, Maxwell', 'Chancellor, Browner, Thomas', 'Sherman, Chancellor, Lane', 'a', 'easy', 'Legion of Boom'),
('What position did Richard Sherman play?', 'Free Safety', 'Strong Safety', 'Cornerback', 'Linebacker', 'c', 'easy', 'Legion of Boom'),
('What jersey number did Earl Thomas wear?', '25', '29', '31', '33', 'b', 'medium', 'Legion of Boom'),
('Which Legion of Boom member was known for devastating hits at the line of scrimmage?', 'Earl Thomas', 'Richard Sherman', 'Kam Chancellor', 'Brandon Browner', 'c', 'medium', 'Legion of Boom'),
('In what year did the Legion of Boom lead the NFL in fewest points allowed?', '2012', '2013', '2014', '2015', 'b', 'hard', 'Legion of Boom')
ON CONFLICT DO NOTHING;

-- Category: Russell Wilson Era
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('What round was Russell Wilson drafted in the 2012 NFL Draft?', '1st round', '2nd round', '3rd round', '4th round', 'c', 'medium', 'Russell Wilson Era'),
('Which college did Russell Wilson transfer to before being drafted?', 'NC State', 'Wisconsin', 'Stanford', 'Oregon', 'b', 'medium', 'Russell Wilson Era'),
('What jersey number did Russell Wilson wear with the Seahawks?', '1', '3', '7', '12', 'b', 'easy', 'Russell Wilson Era'),
('How many Pro Bowls did Russell Wilson make as a Seahawk?', '5', '7', '9', '11', 'c', 'hard', 'Russell Wilson Era'),
('Who did Russell Wilson marry in 2016?', 'Ashton Meem', 'Ciara', 'Gisele Bundchen', 'Carrie Underwood', 'b', 'medium', 'Russell Wilson Era'),
('What was Russell Wilsons signature phrase?', 'Go Hawks', 'Why Not Us', 'Beast Mode', 'Blue Friday', 'b', 'easy', 'Russell Wilson Era')
ON CONFLICT DO NOTHING;

-- Category: Seahawks Legends
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('Who is the Seahawks all-time leading rusher?', 'Marshawn Lynch', 'Shaun Alexander', 'Chris Warren', 'Curt Warner', 'b', 'medium', 'Seahawks Legends'),
('Which Seahawk won NFL MVP in 2005?', 'Matt Hasselbeck', 'Shaun Alexander', 'Walter Jones', 'Steve Largent', 'b', 'medium', 'Seahawks Legends'),
('Who holds the Seahawks record for most receiving yards in a career?', 'Steve Largent', 'Doug Baldwin', 'Tyler Lockett', 'Brian Blades', 'a', 'easy', 'Seahawks Legends'),
('Which legendary left tackle protected Seahawks QBs for 13 seasons?', 'Walter Jones', 'Russell Okung', 'Max Unger', 'Steve Hutchinson', 'a', 'medium', 'Seahawks Legends'),
('Who was the head coach when Seattle went to Super Bowl XL?', 'Pete Carroll', 'Mike Holmgren', 'Chuck Knox', 'Tom Flores', 'b', 'medium', 'Seahawks Legends'),
('Which Seahawks running back was known as "Beast Mode"?', 'Shaun Alexander', 'Marshawn Lynch', 'Thomas Rawls', 'Chris Carson', 'b', 'easy', 'Seahawks Legends')
ON CONFLICT DO NOTHING;

-- Category: Stadium & 12s
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('What is the current name of the Seahawks home stadium?', 'CenturyLink Field', 'Lumen Field', 'Qwest Field', 'T-Mobile Park', 'b', 'easy', 'Stadium & 12s'),
('Why is 12 a special number for Seahawks fans?', 'It was Steve Largents number', 'It represents the 12th man (fans)', 'The team was founded in 1912', 'They won 12 games their first season', 'b', 'easy', 'Stadium & 12s'),
('The Seahawks retired what jersey number to honor their fans?', '1', '10', '12', '99', 'c', 'easy', 'Stadium & 12s'),
('Seahawks fans once caused a minor earthquake during a game. Who were they playing?', 'San Francisco 49ers', 'New Orleans Saints', 'Green Bay Packers', 'Dallas Cowboys', 'b', 'hard', 'Stadium & 12s'),
('What year did the Seahawks move into their current stadium?', '1998', '2000', '2002', '2004', 'c', 'medium', 'Stadium & 12s')
ON CONFLICT DO NOTHING;

-- Category: Memorable Moments
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('Which Seahawk had the famous "tip" play in the 2013 NFC Championship?', 'Earl Thomas', 'Richard Sherman', 'Kam Chancellor', 'Byron Maxwell', 'b', 'medium', 'Memorable Moments'),
('What was the famous Marshawn Lynch run in the 2010 playoffs called?', 'The Run', 'Beast Quake', 'Thunder Run', 'Lynch Mob', 'b', 'easy', 'Memorable Moments'),
('Against which team did the "Beast Quake" run occur?', 'Green Bay Packers', 'New Orleans Saints', 'Dallas Cowboys', 'Atlanta Falcons', 'b', 'medium', 'Memorable Moments'),
('Who caught the game-winning touchdown in the 2014 NFC Championship overtime?', 'Doug Baldwin', 'Jermaine Kearse', 'Golden Tate', 'Percy Harvin', 'b', 'hard', 'Memorable Moments'),
('What controversial play ended Super Bowl XLIX against the Patriots?', 'Fumble at the goal line', 'Interception by Malcolm Butler', 'Missed field goal', 'Incomplete pass', 'b', 'medium', 'Memorable Moments'),
('Who intercepted the pass at the goal line in Super Bowl XLIX?', 'Darrelle Revis', 'Malcolm Butler', 'Brandon Browner', 'Devin McCourty', 'b', 'medium', 'Memorable Moments')
ON CONFLICT DO NOTHING;

-- Category: Players & Numbers
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('What jersey number did Beast Mode Marshawn Lynch wear?', '20', '22', '24', '28', 'c', 'easy', 'Players & Numbers'),
('What number did wide receiver Steve Largent wear?', '80', '81', '84', '88', 'a', 'medium', 'Players & Numbers'),
('Which number did linebacker Bobby Wagner wear?', '50', '52', '54', '56', 'c', 'medium', 'Players & Numbers'),
('What position did Michael Bennett play?', 'Linebacker', 'Defensive End', 'Safety', 'Cornerback', 'b', 'easy', 'Players & Numbers'),
('What number did kicker Steven Hauschka wear?', '2', '4', '6', '8', 'b', 'hard', 'Players & Numbers'),
('Which Seahawk wore number 89 and was a key receiver in the Super Bowl era?', 'Golden Tate', 'Doug Baldwin', 'Jermaine Kearse', 'Tyler Lockett', 'b', 'medium', 'Players & Numbers')
ON CONFLICT DO NOTHING;

-- Category: Seahawks History
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
('What year were the Seattle Seahawks founded?', '1974', '1976', '1978', '1980', 'b', 'medium', 'Seahawks History'),
('What division are the Seahawks currently in?', 'NFC West', 'NFC North', 'AFC West', 'NFC South', 'a', 'easy', 'Seahawks History'),
('Who was the Seahawks first head coach?', 'Chuck Knox', 'Jack Patera', 'Tom Flores', 'Dennis Erickson', 'b', 'hard', 'Seahawks History'),
('How many times have the Seahawks appeared in the Super Bowl?', '1', '2', '3', '4', 'c', 'medium', 'Seahawks History'),
('Which team did the Seahawks lose to in Super Bowl XL?', 'New England Patriots', 'Indianapolis Colts', 'Pittsburgh Steelers', 'Denver Broncos', 'c', 'medium', 'Seahawks History'),
('What are the official team colors of the Seahawks?', 'Blue and Green', 'College Navy, Action Green, and Wolf Grey', 'Navy Blue and Silver', 'Royal Blue and Lime Green', 'b', 'medium', 'Seahawks History')
ON CONFLICT DO NOTHING;

-- ============================================
-- DONE! Your database is now updated.
-- ============================================
