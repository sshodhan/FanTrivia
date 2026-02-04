-- Add Trivia Questions Script
-- Run this script to add sample Seahawks Super Bowl trivia questions

-- Question 1: Easy - Super Bowl XLVIII Score
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'What was the final score of Super Bowl XLVIII?',
  '["43-8", "34-7", "48-10", "35-14"]',
  0,
  'easy',
  'Super Bowl XLVIII',
  'It was one of the most lopsided Super Bowls in history',
  15,
  100
);

-- Question 2: Medium - MVP
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'Who was named the MVP of Super Bowl XLVIII?',
  '["Russell Wilson", "Malcolm Smith", "Richard Sherman", "Marshawn Lynch"]',
  1,
  'medium',
  'Super Bowl XLVIII',
  'This linebacker had a key interception returned for a touchdown',
  15,
  150
);

-- Question 3: Hard - First Play
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'What happened on the very first play of Super Bowl XLVIII?',
  '["Interception by Kam Chancellor", "Safety by Cliff Avril", "Fumble recovery", "Touchdown pass"]',
  1,
  'hard',
  'The ball sailed over Peyton Manning''s head',
  15,
  200
);

-- Question 4: Easy - Head Coach
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'Who was the head coach of the Seahawks during Super Bowl XLVIII?',
  '["Pete Carroll", "Mike Holmgren", "Chuck Knox", "Tom Flores"]',
  0,
  'easy',
  'He also won national championships at USC',
  15,
  100
);

-- Question 5: Medium - Legion of Boom
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'Which player was NOT part of the original "Legion of Boom" secondary?',
  '["Earl Thomas", "Kam Chancellor", "Bobby Wagner", "Richard Sherman"]',
  2,
  'medium',
  'This player is actually a linebacker',
  15,
  150
);

-- Question 6: Hard - Stadium
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'In which stadium was Super Bowl XLVIII played?',
  '["University of Phoenix Stadium", "MetLife Stadium", "Lucas Oil Stadium", "Mercedes-Benz Stadium"]',
  1,
  'hard',
  'It was the first outdoor cold-weather Super Bowl',
  15,
  200
);

-- Question 7: Easy - Quarterback
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'Who was the Seahawks starting quarterback in Super Bowl XLVIII?',
  '["Matt Hasselbeck", "Russell Wilson", "Trevone Boykin", "Charlie Whitehurst"]',
  1,
  'easy',
  'He was a third-round pick in 2012',
  15,
  100
);

-- Question 8: Medium - Beast Mode
INSERT INTO trivia_questions (question_text, options, correct_answer_index, difficulty, category, hint_text, time_limit_seconds, points)
VALUES (
  'How many rushing touchdowns did Marshawn Lynch score in Super Bowl XLVIII?',
  '["0", "1", "2", "3"]',
  1,
  'medium',
  'Beast Mode found the end zone at least once',
  15,
  150
);

-- Verify the inserted questions
SELECT id, question_text, difficulty, category, points 
FROM trivia_questions 
ORDER BY created_at DESC 
LIMIT 10;
