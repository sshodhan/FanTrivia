-- ============================================
-- SEED DATA: Super Bowl LX (2026) - Seahawks 2026 Super Bowl Moments
-- Run this AFTER schema_complete.sql
-- Created: 2026-02-09
-- ============================================
-- 10 Questions (6 medium, 4 hard)
-- Category: "Super Bowl LX (2026)"
-- Tab: Daily
-- ============================================

-- ============================================
-- CATEGORY: Super Bowl LX (2026)
-- Seahawks defeat Patriots 29-13
-- ============================================
INSERT INTO trivia_questions (id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  '2a8c7d46-6094-4737-a1b4-41b63fc323c3',
  'Who was named the Most Valuable Player (MVP) of Super Bowl LX (2026)?',
  'Sam Darnold',
  'Jaxon Smith-Njigba',
  'Kenneth Walker III',
  'Devon Witherspoon',
  'c',
  'medium',
  'Super Bowl LX (2026)'
),
(
  '2414162a-2967-4f74-992f-703fe4b92663',
  'What was the final score of Super Bowl LX, in which the Seattle Seahawks defeated the New England Patriots?',
  'Seahawks 24, Patriots 10',
  'Seahawks 29, Patriots 13',
  'Seahawks 34, Patriots 17',
  'Seahawks 31, Patriots 20',
  'b',
  'medium',
  'Super Bowl LX (2026)'
),
(
  '3d728a80-705b-48c0-a7be-c5ef81fbb6f4',
  'How many total sacks did the Seahawks defense record against the Patriots in Super Bowl LX?',
  '3',
  '4',
  '6',
  '8',
  'c',
  'hard',
  'Super Bowl LX (2026)'
),
(
  '9ee4200f-fa11-4953-8963-843c14f17765',
  'Seahawks kicker Jason Myers set a Super Bowl record by making how many field goals in Super Bowl LX?',
  '3',
  '4',
  '5',
  '6',
  'c',
  'hard',
  'Super Bowl LX (2026)'
),
(
  '652b946d-d961-4d25-959b-c7e3230d961a',
  'How many interceptions did Seahawks quarterback Sam Darnold throw in Super Bowl LX?',
  '0',
  '1',
  '2',
  '3',
  'a',
  'medium',
  'Super Bowl LX (2026)'
),
(
  'c9de802d-b930-4507-b9c5-dfa793b0ad73',
  'Which artist headlined the Super Bowl LX halftime show?',
  'Post Malone',
  'Billie Eilish',
  'Bad Bunny',
  'Tyler, the Creator',
  'c',
  'medium',
  'Super Bowl LX (2026)'
),
(
  '6212af06-100a-43a9-8b8b-efdf5acde8c6',
  'How many total turnovers did Patriots quarterback Drake Maye commit in Super Bowl LX?',
  '1',
  '2',
  '3',
  '4',
  'c',
  'hard',
  'Super Bowl LX (2026)'
),
(
  '8ae42342-0598-4453-8c68-e2821f20cde5',
  'At age 38, which Seahawks head coach became one of the youngest to win a Super Bowl by leading Seattle to victory in Super Bowl LX?',
  'Sean McVay',
  'Mike Macdonald',
  'Kevin O''Connell',
  'Dan Campbell',
  'b',
  'medium',
  'Super Bowl LX (2026)'
),
(
  'd5fe323f-3d6b-4926-8e5b-71f909e09d49',
  'For how many consecutive quarters did the Patriots fail to score points in Super Bowl LX?',
  '1',
  '2',
  '3',
  '4',
  'c',
  'hard',
  'Super Bowl LX (2026)'
),
(
  '7fe0377a-16c8-4b65-8ce5-629de54efe9f',
  'Which Seahawks defensive player recorded a pick-six in Super Bowl LX (2026) against the Patriots?',
  'Devon Witherspoon',
  'Boye Mafe',
  'Julian Love',
  'Uchenna Nwosu',
  'd',
  'medium',
  'Super Bowl LX (2026)'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DONE! Super Bowl LX (2026) data seeded.
--
-- Summary:
-- - 10 Trivia Questions:
--   * 6 medium difficulty
--   * 4 hard difficulty
--   * Category: "Super Bowl LX (2026)"
-- ============================================
