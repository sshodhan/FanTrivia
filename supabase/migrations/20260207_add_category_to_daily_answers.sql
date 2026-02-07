-- Add category column to daily_answers for direct filtering
-- instead of requiring a join to trivia_questions
ALTER TABLE daily_answers ADD COLUMN IF NOT EXISTS category TEXT;

-- Backfill existing rows from the trivia_questions table
UPDATE daily_answers da
SET category = tq.category
FROM trivia_questions tq
WHERE da.question_id = tq.id
  AND da.category IS NULL;

-- Index for progress and reset queries that filter by username + category
CREATE INDEX IF NOT EXISTS idx_answers_username_category
  ON daily_answers(username, category);
