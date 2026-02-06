-- ============================================
-- SEED DAILY TRIVIA SETS
-- Maps day_identifiers to questions by category
-- ============================================
-- Run this AFTER schema_complete.sql and seed_2025_data.sql
--
-- Day 1 (day_minus_4): Super Bowl XLVIII (10 questions)
-- Day 2 (day_minus_3): Legion of Boom (6 questions)
-- Day 3 (day_minus_2): 2025 Season Stats (8 questions)
-- Day 4 (day_minus_1): 2025 Comparison QBs (6 questions)
-- Day 5 (game_day):    Players & Numbers (6 questions)
-- ============================================

-- Clear existing sets
DELETE FROM daily_trivia_sets;

-- Day 1: Super Bowl XLVIII
INSERT INTO daily_trivia_sets (day_identifier, display_date, question_ids, is_active)
SELECT
  'day_minus_4',
  CURRENT_DATE,
  ARRAY_AGG(id ORDER BY difficulty, created_at),
  true
FROM trivia_questions
WHERE category = 'Super Bowl XLVIII' AND is_active = true;

-- Day 2: Legion of Boom
INSERT INTO daily_trivia_sets (day_identifier, display_date, question_ids, is_active)
SELECT
  'day_minus_3',
  CURRENT_DATE + INTERVAL '1 day',
  ARRAY_AGG(id ORDER BY difficulty, created_at),
  true
FROM trivia_questions
WHERE category = 'Legion of Boom' AND is_active = true;

-- Day 3: 2025 Season Stats
INSERT INTO daily_trivia_sets (day_identifier, display_date, question_ids, is_active)
SELECT
  'day_minus_2',
  CURRENT_DATE + INTERVAL '2 days',
  ARRAY_AGG(id ORDER BY difficulty, created_at),
  true
FROM trivia_questions
WHERE category = '2025 Season Stats' AND is_active = true;

-- Day 4: 2025 Comparison QBs
INSERT INTO daily_trivia_sets (day_identifier, display_date, question_ids, is_active)
SELECT
  'day_minus_1',
  CURRENT_DATE + INTERVAL '3 days',
  ARRAY_AGG(id ORDER BY difficulty, created_at),
  true
FROM trivia_questions
WHERE category = '2025 Comparison QBs' AND is_active = true;

-- Day 5: Players & Numbers
INSERT INTO daily_trivia_sets (day_identifier, display_date, question_ids, is_active)
SELECT
  'game_day',
  CURRENT_DATE + INTERVAL '4 days',
  ARRAY_AGG(id ORDER BY difficulty, created_at),
  true
FROM trivia_questions
WHERE category = 'Players & Numbers' AND is_active = true;

-- Verify
SELECT
  day_identifier,
  display_date,
  is_active,
  ARRAY_LENGTH(question_ids, 1) AS question_count
FROM daily_trivia_sets
ORDER BY day_identifier;
