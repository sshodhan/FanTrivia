-- Query all trivia quests (questions) across all categories
-- Returns questions grouped by category with summary stats

-- 1. All questions across every category
SELECT
  id,
  category,
  difficulty,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  hint_text,
  points,
  time_limit_seconds,
  is_active,
  created_at
FROM trivia_questions
WHERE is_active = true
ORDER BY category, difficulty, created_at;

-- 2. Summary: question count per category
SELECT
  category,
  COUNT(*) AS total_questions,
  COUNT(*) FILTER (WHERE difficulty = 'easy') AS easy,
  COUNT(*) FILTER (WHERE difficulty = 'medium') AS medium,
  COUNT(*) FILTER (WHERE difficulty = 'hard') AS hard,
  SUM(points) AS total_possible_points
FROM trivia_questions
WHERE is_active = true
GROUP BY category
ORDER BY category;
