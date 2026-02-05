-- ============================================
-- MIGRATION: Update Patriots 2025 Roster
-- Date: Feb 5, 2026
-- Purpose: Update existing Patriots stats and add missing players
-- This script UPDATES existing records (no data loss) and INSERTS new players
-- ============================================

-- ============================================
-- PART 1: UPDATE existing Patriots player stats
-- These players already exist in the database, just need stat corrections
-- ============================================

-- Drake Maye - Updated stats from official screenshots
UPDATE players SET
  stats = '{"Pass Yds": "4,394", "Pass TD": "31", "INT": "8", "Rating": "113.5", "CMP%": "72%", "Record": "14-3"}'::jsonb,
  trivia = '["2024 first-round pick from North Carolina", "Youngest QB in franchise history to start Super Bowl", "Led Patriots to first playoff berth since 2021", "113.5 passer rating - career high"]'::jsonb
WHERE name = 'Drake Maye' AND display_order = 101;

-- Rhamondre Stevenson - Now RB2 behind Henderson
UPDATE players SET
  bio = 'Patriots RB2 - 2025 Season',
  stats = '{"Rush Yds": "603", "Rush TD": "7", "Rec": "32", "Rec Yds": "345", "Rec TD": "2"}'::jsonb,
  trivia = '["Oklahoma product", "Elite pass-catching running back", "Veteran leader in backfield", "Strong receiving option out of backfield"]'::jsonb
WHERE name = 'Rhamondre Stevenson' AND display_order = 102;

-- TreVeyon Henderson - RB1 with official stats
UPDATE players SET
  bio = 'Patriots RB1 - 2025 Season',
  stats = '{"Rush Yds": "911", "Rush TD": "9", "Rec": "35", "Rec Yds": "221", "Rec TD": "1"}'::jsonb,
  trivia = '["2025 second-round pick from Ohio State", "Lead back with 911 rush yards", "9 rushing TDs in rookie season", "Explosive complement to Stevenson"]'::jsonb
WHERE name = 'TreVeyon Henderson' AND display_order = 103;

-- Stefon Diggs - Updated to official stats
UPDATE players SET
  stats = '{"Receptions": "85", "Rec Yds": "1,013", "Rec TD": "4", "Yds/Rec": "11.9", "Targets": "124"}'::jsonb,
  trivia = '["4-time Pro Bowl selection", "Maryland product", "Signed from Houston in 2025 free agency", "Over 1,000 receiving yards in first Patriots season"]'::jsonb
WHERE name = 'Stefon Diggs' AND display_order = 106;

-- Hunter Henry - Updated to official stats
UPDATE players SET
  stats = '{"Receptions": "60", "Rec Yds": "768", "Rec TD": "7", "Yds/Rec": "12.8", "Red Zone Targets": "22"}'::jsonb,
  trivia = '["Arkansas product", "2016 second-round pick", "Red zone weapon with 7 TDs", "Career year in 2025"]'::jsonb
WHERE name = 'Hunter Henry' AND display_order = 107;

-- Mack Hollins - Updated to official stats
UPDATE players SET
  stats = '{"Receptions": "46", "Rec Yds": "550", "Rec TD": "2", "Yds/Rec": "12.0", "Long": "54"}'::jsonb
WHERE name = 'Mack Hollins' AND display_order = 133;

-- Kayshon Boutte - Updated to official stats
UPDATE players SET
  stats = '{"Receptions": "33", "Rec Yds": "551", "Rec TD": "6", "Yds/Rec": "16.7", "Long": "39"}'::jsonb,
  trivia = '["LSU product", "2023 sixth-round pick", "Deep threat with 6 TDs", "Breakout season in year 2"]'::jsonb
WHERE name = 'Kayshon Boutte' AND display_order = 134;

-- Robert Spillane - Updated to official stats
UPDATE players SET
  stats = '{"Tackles": "97", "Sacks": "1.0", "INT": "2", "Pass Def": "7", "TFL": "8"}'::jsonb,
  trivia = '["Western Michigan product", "Signed from Raiders", "Leading tackler with 97 tackles", "Physical downhill linebacker"]'::jsonb
WHERE name = 'Robert Spillane' AND display_order = 118;

-- Christian Gonzalez - Updated to official stats
UPDATE players SET
  stats = '{"Tackles": "69", "INT": "0", "Pass Def": "14", "Passer Rating Allowed": "48.2", "Targets": "72"}'::jsonb,
  trivia = '["Oregon product", "2023 first-round pick", "Elite shutdown corner - opponents avoid his side", "69 tackles in 2025"]'::jsonb
WHERE name = 'Christian Gonzalez' AND display_order = 119;

-- Marcus Jones - Updated to official stats
UPDATE players SET
  stats = '{"Tackles": "42", "INT": "3", "INT TD": "1", "Pass Def": "8"}'::jsonb,
  trivia = '["Houston product", "2022 third-round pick", "Ball hawk with 3 INTs and a pick-six", "Dynamic return man"]'::jsonb
WHERE name = 'Marcus Jones' AND display_order = 137;

-- Craig Woodson - Updated to official stats
UPDATE players SET
  stats = '{"Tackles": "79", "INT": "0", "Pass Def": "6", "TFL": "4"}'::jsonb,
  trivia = '["Texas product", "2025 draft pick", "Sure tackler with 79 stops", "Rookie contributor"]'::jsonb
WHERE name = 'Craig Woodson' AND display_order = 135;

-- Marte Mapu - Updated to official stats
UPDATE players SET
  stats = '{"Tackles": "65", "INT": "1", "Pass Def": "5", "TFL": "4"}'::jsonb,
  trivia = '["Sacramento State product", "2023 third-round pick", "Hybrid safety/linebacker", "Key interception in playoffs"]'::jsonb
WHERE name = 'Marte Mapu' AND display_order = 138;


-- ============================================
-- PART 2: INSERT new Patriots players (if they don't exist)
-- These are the 24 players added to complete the 51-man roster
-- Uses INSERT ... ON CONFLICT DO NOTHING pattern for safety
-- ============================================

-- Additional Quarterbacks
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Tommy DeVito', 3, 'Quarterback', 141, NULL, false, 'Patriots QB3 - 2025 Season',
  '{"Pass Yds": "0", "Pass TD": "0", "INT": "0"}'::jsonb,
  '["Illinois product", "Former Giants starter", "Experienced backup quarterback", "Fan favorite"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Tommy DeVito' AND display_order = 141);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Joshua Dobbs', 5, 'Quarterback', 142, NULL, false, 'Patriots QB2 - 2025 Season',
  '{"Pass Yds": "0", "Pass TD": "0", "INT": "0"}'::jsonb,
  '["Tennessee product", "Aerospace engineer", "Veteran backup with starting experience", "Passtronaut"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Joshua Dobbs' AND display_order = 142);

-- Additional Wide Receivers
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Efton Chism III', 88, 'Wide Receiver', 144, NULL, false, 'Patriots WR - 2025 Season',
  '{"Receptions": "12", "Rec Yds": "145", "Rec TD": "1"}'::jsonb,
  '["Arkansas product", "2025 draft pick", "Rookie receiver with upside", "Physical receiver"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Efton Chism III' AND display_order = 144);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Kyle Williams', 18, 'Wide Receiver', 145, NULL, false, 'Patriots WR - 2025 Season',
  '{"Receptions": "8", "Rec Yds": "95", "Rec TD": "0"}'::jsonb,
  '["Arizona State product", "Key special teams player", "Depth receiver", "Return specialist"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Kyle Williams' AND display_order = 145);

-- Fullback
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Jack Westover', 47, 'Fullback', 146, NULL, false, 'Patriots FB - 2025 Season',
  '{"Receptions": "5", "Rec Yds": "42", "Rush TD": "1"}'::jsonb,
  '["BYU product", "Key special teams contributor", "Lead blocker in short yardage", "Physical blocker"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Jack Westover' AND display_order = 146);

-- Additional Tight End
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'CJ Dippre', 86, 'Tight End', 147, NULL, false, 'Patriots TE - 2025 Season',
  '{"Receptions": "15", "Rec Yds": "168", "Rec TD": "2"}'::jsonb,
  '["Alabama product", "2025 draft pick", "Blocking tight end with receiving upside", "Athletic TE"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'CJ Dippre' AND display_order = 147);

-- Additional Offensive Linemen
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Morgan Moses', 78, 'Offensive Tackle', 148, NULL, false, 'Patriots T - 2025 Season',
  '{"Sacks Allowed": "4", "Pressures": "22", "PFF Grade": "74.5"}'::jsonb,
  '["Virginia product", "10+ year NFL veteran", "Veteran tackle depth", "Reliable starter"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Morgan Moses' AND display_order = 148);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Jared Wilson', 62, 'Center', 149, NULL, false, 'Patriots C - 2025 Season',
  '{"Sacks Allowed": "1", "Pressures": "8", "PFF Grade": "72.1"}'::jsonb,
  '["Georgia product", "Key depth piece", "Reliable interior lineman", "Power blocker"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Jared Wilson' AND display_order = 149);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Ben Brown', 60, 'Center', 150, NULL, false, 'Patriots C - 2025 Season',
  '{"Sacks Allowed": "0", "Pressures": "5", "PFF Grade": "68.4"}'::jsonb,
  '["Ole Miss product", "Versatile backup", "Interior line depth", "Smart lineman"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Ben Brown' AND display_order = 150);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Garrett Bradbury', 56, 'Center', 151, NULL, false, 'Patriots C - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "12", "PFF Grade": "71.8"}'::jsonb,
  '["NC State product", "Former Vikings starter", "Veteran center depth", "Former first-round pick"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Garrett Bradbury' AND display_order = 151);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Thayer Munford Jr.', 77, 'Offensive Tackle', 152, NULL, false, 'Patriots T - 2025 Season',
  '{"Sacks Allowed": "3", "Pressures": "18", "PFF Grade": "70.2"}'::jsonb,
  '["Ohio State product", "Versatile lineman", "Swing tackle", "Can play guard"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Thayer Munford Jr.' AND display_order = 152);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Marcus Bryant', 65, 'Offensive Tackle', 153, NULL, false, 'Patriots T - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "14", "PFF Grade": "68.5"}'::jsonb,
  '["Wisconsin product", "Practice squad call-up", "Developmental tackle", "Young talent"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Marcus Bryant' AND display_order = 153);

-- Additional Defensive Players
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'K''Lavon Chaisson', 53, 'Linebacker', 154, NULL, false, 'Patriots LB - 2025 Season',
  '{"Tackles": "32", "Sacks": "4.5", "TFL": "6"}'::jsonb,
  '["LSU product", "Former first-round pick", "Edge rusher off the bench", "Elite athleticism"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'K''Lavon Chaisson' AND display_order = 154);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Khyiris Tonga', 95, 'Defensive Lineman', 155, NULL, false, 'Patriots DL - 2025 Season',
  '{"Tackles": "28", "Sacks": "2.0", "TFL": "4"}'::jsonb,
  '["BYU product", "Interior depth", "Run-stuffing nose tackle", "Space eater"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Khyiris Tonga' AND display_order = 155);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Cory Durden', 97, 'Defensive Tackle', 156, NULL, false, 'Patriots DT - 2025 Season',
  '{"Tackles": "22", "Sacks": "1.5", "TFL": "3"}'::jsonb,
  '["NC State product", "Key depth piece", "Interior rotation player", "Run stuffer"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Cory Durden' AND display_order = 156);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Bradyn Swinson', 50, 'Linebacker', 157, NULL, false, 'Patriots LB - 2025 Season',
  '{"Tackles": "18", "Sacks": "2.0", "TFL": "3"}'::jsonb,
  '["LSU product", "2025 draft pick", "Rookie edge defender", "Pass rush specialist"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Bradyn Swinson' AND display_order = 157);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Elijah Ponder', 54, 'Linebacker', 158, NULL, false, 'Patriots LB - 2025 Season',
  '{"Tackles": "15", "Sacks": "0.5", "TFL": "2"}'::jsonb,
  '["Florida State product", "Undrafted free agent", "Special teams contributor", "High motor"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Elijah Ponder' AND display_order = 158);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Chad Muma', 45, 'Linebacker', 159, NULL, false, 'Patriots LB - 2025 Season',
  '{"Tackles": "35", "INT": "1", "TFL": "4"}'::jsonb,
  '["Wyoming product", "Former Jaguars starter", "Off-ball linebacker depth", "Sure tackler"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Chad Muma' AND display_order = 159);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Anfernee Jennings', 59, 'Linebacker', 160, NULL, false, 'Patriots LB - 2025 Season',
  '{"Tackles": "28", "Sacks": "1.0", "TFL": "3"}'::jsonb,
  '["Alabama product", "2020 third-round pick", "Veteran edge depth", "Run defender"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Anfernee Jennings' AND display_order = 160);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Alex Austin', 27, 'Cornerback', 161, NULL, false, 'Patriots CB - 2025 Season',
  '{"Tackles": "25", "INT": "1", "Pass Def": "5"}'::jsonb,
  '["Oregon State product", "Special teams ace", "Depth cornerback", "Physical cover man"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Alex Austin' AND display_order = 161);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Charles Woods', 36, 'Cornerback', 162, NULL, false, 'Patriots CB - 2025 Season',
  '{"Tackles": "18", "INT": "0", "Pass Def": "3"}'::jsonb,
  '["Notre Dame product", "Key special teams player", "Nickel corner depth", "Smart defender"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Charles Woods' AND display_order = 162);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Brenden Schooler', 40, 'Safety', 163, NULL, false, 'Patriots S - 2025 Season',
  '{"Tackles": "22", "INT": "0", "Pass Def": "2"}'::jsonb,
  '["Texas product", "Core special teamer", "Special teams captain", "Gunner specialist"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Brenden Schooler' AND display_order = 163);

INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active)
SELECT 'Kobee Minor', 39, 'Defensive Back', 164, NULL, false, 'Patriots DB - 2025 Season',
  '{"Tackles": "12", "INT": "0", "Pass Def": "2"}'::jsonb,
  '["Georgia product", "Rookie contributor", "Versatile defensive back", "Ball skills"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Kobee Minor' AND display_order = 164);


-- ============================================
-- PART 3: Verify the updates
-- ============================================
-- Run these queries to verify the migration worked:
-- SELECT name, position, stats->>'Pass Yds' as pass_yds, stats->>'Pass TD' as pass_td FROM players WHERE name = 'Drake Maye';
-- SELECT COUNT(*) as patriots_count FROM players WHERE display_order BETWEEN 100 AND 170;
-- Expected: 55 total (51 players + 4 coaches)
