-- ============================================
-- SEED: LOB Secondary (6 questions)
-- Distinct from "Legion of Boom" which covers unit overview
-- This category focuses on secondary-specific coverage, stats, and moments
-- ============================================

INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  'What coverage technique was the Legion of Boom secondary famous for using?',
  'Cover 2 Zone',
  'Prevent Defense',
  'Press-Man Coverage',
  'Nickel Blitz',
  'c',
  'medium',
  'LOB Secondary'
),
(
  'Which LOB cornerback stood 6''4" and was known for jamming receivers at the line?',
  'Richard Sherman',
  'Brandon Browner',
  'Byron Maxwell',
  'Walter Thurmond',
  'b',
  'medium',
  'LOB Secondary'
),
(
  'How many interceptions did Richard Sherman have during the 2013 regular season?',
  '4',
  '6',
  '8',
  '10',
  'c',
  'hard',
  'LOB Secondary'
),
(
  'What did Richard Sherman shout during his famous postgame interview after the 2013 NFC Championship?',
  '"We are the best defense ever"',
  '"Don''t you ever talk about me"',
  '"I''m the best corner in the game"',
  '"Legion of Boom, baby"',
  'b',
  'easy',
  'LOB Secondary'
),
(
  'Which undrafted LOB cornerback started in Super Bowl XLVIII and later signed a big free agent deal with Philadelphia?',
  'Walter Thurmond',
  'DeShawn Shead',
  'Byron Maxwell',
  'Marcus Trufant',
  'c',
  'hard',
  'LOB Secondary'
),
(
  'The 2013 Seahawks secondary allowed the fewest passing yards in the NFL. How many passing touchdowns did they allow all season?',
  '9',
  '11',
  '15',
  '18',
  'b',
  'hard',
  'LOB Secondary'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Seahawks Legends Heritage (6 questions)
-- Distinct from "Seahawks Legends" which covers modern franchise records
-- This category focuses on pre-2000s historical legacy and deeper lore
-- ============================================

INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  'Which Seahawks legend later served as a US Congressman representing Oklahoma?',
  'Walter Jones',
  'Steve Largent',
  'Dave Krieg',
  'Kenny Easley',
  'b',
  'hard',
  'Seahawks Legends Heritage'
),
(
  'Who won the 1992 NFL Defensive Player of the Year award as a Seahawk?',
  'Kenny Easley',
  'Jacob Green',
  'Cortez Kennedy',
  'Eugene Robinson',
  'c',
  'medium',
  'Seahawks Legends Heritage'
),
(
  'Running back Curt Warner rushed for over 1,400 yards in which rookie season?',
  '1981',
  '1983',
  '1985',
  '1987',
  'b',
  'hard',
  'Seahawks Legends Heritage'
),
(
  'Which head coach led the Seahawks to their first playoff appearance and three consecutive postseasons in the 1980s?',
  'Jack Patera',
  'Tom Flores',
  'Chuck Knox',
  'Dennis Erickson',
  'c',
  'medium',
  'Seahawks Legends Heritage'
),
(
  'Safety Kenny Easley won the 1984 NFL Defensive Player of the Year. How many interceptions did he have that season?',
  '5',
  '7',
  '10',
  '12',
  'c',
  'hard',
  'Seahawks Legends Heritage'
),
(
  'How many consecutive seasons did Steve Largent lead the Seahawks in receiving?',
  '8',
  '10',
  '12',
  '14',
  'b',
  'medium',
  'Seahawks Legends Heritage'
)
ON CONFLICT DO NOTHING;
