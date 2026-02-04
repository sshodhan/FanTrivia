-- ============================================
-- HawkTrivia Schema Validation Tests
-- Run after schema_complete.sql to verify setup
-- ============================================

-- ============================================
-- 1. TABLE EXISTENCE CHECKS
-- ============================================
SELECT 'TABLE EXISTENCE CHECKS' as test_section;

SELECT
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'trivia_questions', 'daily_trivia_sets', 'game_day_rounds',
    'daily_answers', 'photo_uploads', 'photo_likes', 'players',
    'game_settings', 'admin_action_logs'
  )
ORDER BY table_name;

-- ============================================
-- 2. ROW COUNT SUMMARY
-- ============================================
SELECT 'ROW COUNT SUMMARY' as test_section;

SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'trivia_questions', COUNT(*) FROM trivia_questions
UNION ALL SELECT 'daily_trivia_sets', COUNT(*) FROM daily_trivia_sets
UNION ALL SELECT 'game_day_rounds', COUNT(*) FROM game_day_rounds
UNION ALL SELECT 'daily_answers', COUNT(*) FROM daily_answers
UNION ALL SELECT 'photo_uploads', COUNT(*) FROM photo_uploads
UNION ALL SELECT 'photo_likes', COUNT(*) FROM photo_likes
UNION ALL SELECT 'players', COUNT(*) FROM players
UNION ALL SELECT 'game_settings', COUNT(*) FROM game_settings
UNION ALL SELECT 'admin_action_logs', COUNT(*) FROM admin_action_logs
ORDER BY table_name;

-- ============================================
-- 3. TRIVIA QUESTIONS VALIDATION
-- ============================================
SELECT 'TRIVIA QUESTIONS BY CATEGORY' as test_section;

SELECT
  category,
  COUNT(*) as question_count,
  COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy,
  COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium,
  COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard
FROM trivia_questions
GROUP BY category
ORDER BY category;

-- Verify all questions have valid answers
SELECT 'QUESTIONS WITH INVALID ANSWERS' as test_section;
SELECT id, question_text, correct_answer
FROM trivia_questions
WHERE correct_answer NOT IN ('a', 'b', 'c', 'd');

-- ============================================
-- 4. PLAYERS VALIDATION
-- ============================================
SELECT 'PLAYERS DATA' as test_section;

SELECT
  name,
  jersey_number,
  position,
  is_active,
  jsonb_array_length(trivia) as trivia_facts_count
FROM players
ORDER BY display_order;

-- ============================================
-- 5. GAME SETTINGS VALIDATION
-- ============================================
SELECT 'GAME SETTINGS' as test_section;

SELECT
  id,
  current_mode,
  questions_per_day,
  timer_duration,
  scores_locked,
  current_day
FROM game_settings;

-- Verify singleton constraint (should be id = 1)
SELECT 'GAME SETTINGS SINGLETON CHECK' as test_section;
SELECT
  CASE
    WHEN COUNT(*) = 1 AND MAX(id) = 1 THEN '✓ Valid singleton (id=1)'
    WHEN COUNT(*) = 0 THEN '⚠ No game_settings row - insert one'
    ELSE '✗ Invalid: multiple rows or wrong id'
  END as singleton_status
FROM game_settings;

-- ============================================
-- 6. FUNCTION EXISTENCE CHECKS
-- ============================================
SELECT 'FUNCTION EXISTENCE CHECKS' as test_section;

SELECT
  routine_name,
  '✓ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_leaderboard', 'update_user_stats', 'update_photo_like_count');

-- ============================================
-- 7. TRIGGER EXISTENCE CHECKS
-- ============================================
SELECT 'TRIGGER EXISTENCE CHECKS' as test_section;

SELECT
  trigger_name,
  event_object_table as on_table,
  action_timing || ' ' || event_manipulation as fires_on
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- ============================================
-- 8. TEST USER CREATION
-- ============================================
SELECT 'TEST: USER CREATION' as test_section;

-- Insert a test user
INSERT INTO users (username, avatar)
VALUES ('test_user_validation', 'hawk')
ON CONFLICT (username) DO NOTHING;

-- Verify user was created with defaults
SELECT
  username,
  avatar,
  total_points,
  current_streak,
  days_played,
  CASE
    WHEN total_points = 0 AND current_streak = 0 THEN '✓ Defaults correct'
    ELSE '✗ Defaults incorrect'
  END as validation
FROM users
WHERE username = 'test_user_validation';

-- ============================================
-- 9. TEST ANSWER SUBMISSION & TRIGGER
-- ============================================
SELECT 'TEST: ANSWER SUBMISSION & TRIGGER' as test_section;

-- Get a random question ID
DO $$
DECLARE
  v_question_id UUID;
  v_points_before INTEGER;
  v_points_after INTEGER;
BEGIN
  -- Get a question
  SELECT id INTO v_question_id FROM trivia_questions LIMIT 1;

  -- Get points before
  SELECT total_points INTO v_points_before
  FROM users WHERE username = 'test_user_validation';

  -- Submit an answer
  INSERT INTO daily_answers (username, question_id, day_identifier, selected_answer, is_correct, points_earned, streak_bonus)
  VALUES ('test_user_validation', v_question_id, 'test_day', 'a', true, 100, 10)
  ON CONFLICT DO NOTHING;

  -- Get points after
  SELECT total_points INTO v_points_after
  FROM users WHERE username = 'test_user_validation';

  -- Report result
  RAISE NOTICE 'Points before: %, Points after: %, Expected: %',
    v_points_before, v_points_after, v_points_before + 110;

  IF v_points_after = v_points_before + 110 THEN
    RAISE NOTICE '✓ Trigger update_user_stats working correctly';
  ELSE
    RAISE NOTICE '⚠ Trigger may not be working (or answer already existed)';
  END IF;
END $$;

-- Show test user's updated stats
SELECT
  username,
  total_points,
  last_played_at,
  CASE
    WHEN total_points >= 110 THEN '✓ Points updated by trigger'
    ELSE '⚠ Check trigger'
  END as trigger_status
FROM users
WHERE username = 'test_user_validation';

-- ============================================
-- 10. TEST GET_LEADERBOARD FUNCTION
-- ============================================
SELECT 'TEST: GET_LEADERBOARD FUNCTION' as test_section;

SELECT * FROM get_leaderboard(10);

-- ============================================
-- 11. CONSTRAINT VALIDATION
-- ============================================
SELECT 'CONSTRAINT TESTS' as test_section;

-- Test username length constraint (should fail for single char)
DO $$
BEGIN
  INSERT INTO users (username) VALUES ('X');
  RAISE NOTICE '✗ Username length constraint NOT enforced';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE '✓ Username length constraint working';
END $$;

-- Test avatar constraint (should fail for invalid avatar)
DO $$
BEGIN
  INSERT INTO users (username, avatar) VALUES ('test_avatar_check', 'invalid_avatar');
  RAISE NOTICE '✗ Avatar constraint NOT enforced';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE '✓ Avatar constraint working';
END $$;

-- Test answer constraint (should fail for invalid answer)
DO $$
DECLARE
  v_question_id UUID;
BEGIN
  SELECT id INTO v_question_id FROM trivia_questions LIMIT 1;
  INSERT INTO daily_answers (username, question_id, day_identifier, selected_answer, is_correct)
  VALUES ('test_user_validation', v_question_id, 'constraint_test', 'z', false);
  RAISE NOTICE '✗ Answer constraint NOT enforced';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE '✓ Answer constraint working (a/b/c/d only)';
END $$;

-- Test game_settings id constraint
DO $$
BEGIN
  INSERT INTO game_settings (id, current_mode) VALUES (2, 'daily');
  RAISE NOTICE '✗ Game settings id=1 constraint NOT enforced';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE '✓ Game settings id=1 constraint working';
END $$;

-- ============================================
-- 12. UNIQUE CONSTRAINT TEST
-- ============================================
SELECT 'UNIQUE CONSTRAINT TEST' as test_section;

DO $$
DECLARE
  v_question_id UUID;
BEGIN
  SELECT id INTO v_question_id FROM trivia_questions LIMIT 1;

  -- Try to insert duplicate answer (same user, question, day)
  INSERT INTO daily_answers (username, question_id, day_identifier, selected_answer, is_correct)
  VALUES ('test_user_validation', v_question_id, 'test_day', 'b', false);

  RAISE NOTICE '✗ Unique constraint NOT enforced (duplicate answer allowed)';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE '✓ Unique constraint working (one answer per user/question/day)';
END $$;

-- ============================================
-- 13. SAMPLE QUERIES FOR FRONTEND
-- ============================================
SELECT 'SAMPLE FRONTEND QUERIES' as test_section;

-- Daily trivia query (what frontend would get)
SELECT 'Sample: Get 5 random questions for daily play' as query_description;
SELECT
  id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  -- correct_answer is NOT returned to frontend
  difficulty,
  category
FROM trivia_questions
WHERE is_active = true
ORDER BY RANDOM()
LIMIT 5;

-- Player cards query
SELECT 'Sample: Get active players for display' as query_description;
SELECT
  name,
  jersey_number,
  position,
  image_url,
  stats,
  trivia
FROM players
WHERE is_active = true
ORDER BY display_order
LIMIT 3;

-- ============================================
-- 14. CLEANUP TEST DATA
-- ============================================
SELECT 'CLEANUP TEST DATA' as test_section;

DELETE FROM daily_answers WHERE username = 'test_user_validation';
DELETE FROM users WHERE username = 'test_user_validation';

SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE username = 'test_user_validation')
    THEN '✓ Test data cleaned up'
    ELSE '✗ Test data not cleaned up'
  END as cleanup_status;

-- ============================================
-- 15. FINAL SUMMARY
-- ============================================
SELECT 'FINAL SUMMARY' as test_section;

SELECT
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM trivia_questions) as questions_count,
  (SELECT COUNT(*) FROM players) as players_count,
  (SELECT COUNT(*) FROM game_settings) as game_settings_count,
  CASE
    WHEN (SELECT COUNT(*) FROM trivia_questions) >= 51 THEN '✓ Schema + Seed OK'
    ELSE '⚠ Run seed_2025_data.sql for more content'
  END as overall_status;

-- ============================================
-- DONE!
-- Expected results after schema_complete.sql:
--   - 10 tables created
--   - 51 trivia questions
--   - 6 players (Super Bowl XLVIII heroes)
--   - 1 game_settings row
--   - All constraints working
--   - All triggers working
--   - get_leaderboard function working
-- ============================================
