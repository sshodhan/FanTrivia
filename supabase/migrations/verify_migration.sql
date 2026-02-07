-- =============================================
-- RUN THIS BEFORE AND AFTER THE MIGRATION
-- Compare outputs to verify everything is correct
-- =============================================

-- 1. Check if category column exists on daily_answers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_answers'
ORDER BY ordinal_position;

-- 2. Total answers in the system
SELECT count(*) AS total_answers FROM daily_answers;

-- 3. Answers with/without category populated
SELECT
  count(*) FILTER (WHERE category IS NOT NULL) AS has_category,
  count(*) FILTER (WHERE category IS NULL)     AS missing_category
FROM daily_answers;

-- 4. Per-user, per-category progress snapshot
-- This is what the progress API computes — compare before/after
SELECT
  da.username,
  COALESCE(da.category, tq.category) AS category,
  count(DISTINCT da.question_id)     AS unique_questions_answered,
  count(*)                           AS total_answer_rows,
  sum(CASE WHEN da.is_correct THEN 1 ELSE 0 END) AS correct,
  sum(da.points_earned + da.streak_bonus)          AS total_points
FROM daily_answers da
JOIN trivia_questions tq ON tq.id = da.question_id
GROUP BY da.username, COALESCE(da.category, tq.category)
ORDER BY da.username, category;

-- 5. Verify category values match between daily_answers and trivia_questions
-- After migration this should return 0 rows (no mismatches)
SELECT da.id, da.category AS da_category, tq.category AS tq_category
FROM daily_answers da
JOIN trivia_questions tq ON tq.id = da.question_id
WHERE da.category IS NOT NULL
  AND da.category != tq.category
LIMIT 20;

-- 6. User point totals (to verify reset doesn't corrupt points)
SELECT username, total_points, current_streak, days_played
FROM users
WHERE total_points > 0
ORDER BY total_points DESC;

-- 7. Check the index exists (after migration only)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'daily_answers'
ORDER BY indexname;
