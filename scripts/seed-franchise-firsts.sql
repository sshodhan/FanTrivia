-- ============================================
-- SEED: Franchise Firsts (6 questions)
-- Category: Franchise Firsts
-- ============================================

INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  'Who scored the first touchdown in Seattle Seahawks history?',
  'Steve Largent',
  'Jim Zorn',
  'Sherman Smith',
  'Sam McCullum',
  'd',
  'hard',
  'Franchise Firsts'
),
(
  'Who was the first Seahawks player inducted into the Pro Football Hall of Fame?',
  'Steve Largent',
  'Walter Jones',
  'Cortez Kennedy',
  'Kenny Easley',
  'a',
  'medium',
  'Franchise Firsts'
),
(
  'In what year did the Seahawks win their first division title?',
  '1988',
  '1999',
  '2004',
  '2010',
  'b',
  'hard',
  'Franchise Firsts'
),
(
  'Who threw the first pass in Seahawks franchise history?',
  'Dave Krieg',
  'Jim Zorn',
  'Warren Moon',
  'Dan McGwire',
  'b',
  'medium',
  'Franchise Firsts'
),
(
  'Who was the Seahawks first ever first-round draft pick in 1976?',
  'Steve Niehaus',
  'Jim Zorn',
  'Steve Largent',
  'Sherman Smith',
  'a',
  'hard',
  'Franchise Firsts'
),
(
  'What was the result of the Seahawks first regular season game in 1976?',
  'Win vs Tampa Bay',
  'Loss vs St. Louis Cardinals',
  'Win vs Atlanta Falcons',
  'Loss vs Green Bay Packers',
  'b',
  'hard',
  'Franchise Firsts'
)
ON CONFLICT DO NOTHING;
