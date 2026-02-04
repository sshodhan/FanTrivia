-- ============================================
-- SEED DATA: 2025 Season + Super Bowl Heroes + Hall of Fame
-- Run this AFTER schema_user.sql to add comprehensive data
-- Verified: February 2026
-- ============================================

-- ============================================
-- PLAYER CATEGORIES:
-- 1. 2025 Seahawks Roster (is_active = true)
-- 2. 2025 Comparison QBs (is_active = true)
-- 3. Super Bowl XLVIII Heroes (is_active = false)
-- 4. Super Bowl XLIX Context (is_active = false)
-- 5. Hall of Fame Legends (is_active = false)
-- ============================================

-- Clear existing players to avoid duplicates
DELETE FROM players WHERE id IS NOT NULL;

-- ============================================
-- CATEGORY 1: 2025 Seahawks Roster
-- ============================================
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Sam Darnold', 14, 'Quarterback', 1,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3912547.png',
  'Seahawks QB - 2025 Season - Super Bowl LX',
  '{"Pass Yds": "4,048", "Pass TD": "25", "INT": "14", "Passer Rating": "99.1", "CMP%": "67.7%", "Record": "14-3"}'::jsonb,
  '["Led Seahawks to 14-3 record and Super Bowl LX appearance", "Second QB in NFL history with 14-3 record (after Tom Brady)", "Threw for 470 yards, 4 TDs, 0 INTs in first two playoff games", "Signed with Seattle after breakout 2024 season in Minnesota"]'::jsonb,
  true
),
(
  'Jaxon Smith-Njigba', 11, 'Wide Receiver', 2,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4430878.png',
  'Seahawks WR - 2025 NFL Receiving Leader',
  '{"Receptions": "119", "Rec Yds": "1,793", "Rec TD": "10", "Yds/Rec": "15.1", "Targets": "163"}'::jsonb,
  '["Led NFL in receiving yards in 2025 with 1,793", "Set Seahawks franchise single-season receiving record", "NFC Offensive Player of the Month (October 2025)", "Had 10 catches for 153 yards in NFC Championship win"]'::jsonb,
  true
),
(
  'Kenneth Walker III', 9, 'Running Back', 3,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4567048.png',
  'Seahawks RB - 2025 Workhorse Back',
  '{"Rush Yds": "1,027", "Rush TD": "5", "Carries": "221", "Yds/Carry": "4.6", "Receptions": "31"}'::jsonb,
  '["Rushed for over 1,000 yards in 2025 regular season", "Career-high 1,309 scrimmage yards", "Had 116 rush yards and 3 TDs in Divisional Round win", "Became clear workhorse after Charbonnet ACL injury"]'::jsonb,
  true
),
(
  'Jason Myers', 5, 'Place Kicker', 4,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2473037.png',
  'Seahawks K - 2025 Season',
  '{"FG%": "85.4%", "XP%": "100%", "Long FG": "57", "Points": "171"}'::jsonb,
  '["Perfect on extra points in 2025 (100%)", "Scored 171 total points in regular season", "Longest field goal of 57 yards", "Reliable veteran kicker for Super Bowl run"]'::jsonb,
  true
),
(
  'Michael Dickson', 4, 'Punter', 5,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3929851.png',
  'Seahawks P - 2025 Season',
  '{"Punts": "52", "Avg Yds": "49.0", "Long": "60", "Inside 20": "20"}'::jsonb,
  '["Averaged 49.0 yards per punt in 2025", "Pinned opponents inside 20 twenty times", "Longest punt of 60 yards", "Elite field position specialist"]'::jsonb,
  true
),
(
  'Mike Macdonald', 0, 'Head Coach', 10,
  NULL,
  'Seahawks Head Coach - 2025 Season',
  '{"Record": "14-3", "Playoff Wins": "2", "Division": "NFC West", "Super Bowl": "LX"}'::jsonb,
  '["First-year Seahawks head coach in 2025", "Led team to Super Bowl LX appearance", "Previously defensive coordinator for Baltimore Ravens", "Youngest coach to reach Super Bowl since Sean McVay"]'::jsonb,
  true
);

-- ============================================
-- CATEGORY 2: 2025 Comparison QBs (Other Teams)
-- ============================================
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Drake Maye', 10, 'Quarterback', 20,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4431452.png',
  'Patriots QB - 2025 Season - Super Bowl LX',
  '{"Pass Yds": "4,394", "Pass TD": "31", "INT": "8", "Passer Rating": "113.5", "CMP%": "68.2%"}'::jsonb,
  '["Led Patriots to first playoff berth since 2021", "First NFL QB to complete 90%+ with 250 yds and 5 TDs in a game", "Set Patriots franchise completion % record (91.3%)", "Second consecutive Pro Bowl selection"]'::jsonb,
  true
),
(
  'Matthew Stafford', 9, 'Quarterback', 21,
  'https://a.espncdn.com/i/headshots/nfl/players/full/12483.png',
  'Rams QB - 2025 NFL Passing Leader',
  '{"Pass Yds": "4,707", "Pass TD": "46", "INT": "8", "QBR": "71.0", "Games": "17"}'::jsonb,
  '["Led NFL in both passing yards (4,707) and TDs (46) in 2025", "Career-high 46 touchdown passes", "First-team All-Pro and MVP finalist", "Lost NFC Championship to Seahawks 31-27"]'::jsonb,
  true
);

-- ============================================
-- CATEGORY 3: Super Bowl XLVIII Heroes (2014)
-- ============================================
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Russell Wilson', 3, 'Quarterback', 30,
  NULL,
  'Super Bowl XLVIII Champion QB',
  '{"SB Pass Yds": "206", "SB Pass TD": "2", "SB CMP/ATT": "18/25", "SB INT": "0", "SB Rating": "123.1"}'::jsonb,
  '["Led Seahawks to 43-8 Super Bowl XLVIII victory", "Became 2nd Black QB to win a Super Bowl", "Led game-opening 80-yard TD drive in 12 plays", "At 25, one of youngest QBs to win championship"]'::jsonb,
  false
),
(
  'Marshawn Lynch', 24, 'Running Back', 31,
  NULL,
  'Super Bowl XLVIII Champion RB - Beast Mode',
  '{"SB Rush Yds": "39", "SB Rush TD": "1", "SB Carries": "15", "SB YPC": "2.6"}'::jsonb,
  '["Scored Seahawks first Super Bowl TD in franchise history", "Iconic power runner nicknamed Beast Mode", "Famous Beast Quake run in 2011 playoffs", "Fan favorite known for loving Skittles"]'::jsonb,
  false
),
(
  'Richard Sherman', 25, 'Cornerback', 32,
  NULL,
  'Legion of Boom - All-Pro Corner',
  '{"SB Tackles": "3", "SB Pass Deflections": "2", "Pro Bowls": "5", "All-Pro": "3x First Team"}'::jsonb,
  '["Made famous tip play to seal 2013 NFC Championship", "3-time First-Team All-Pro cornerback", "Stanford graduate with Communications degree", "Leader of the Legion of Boom secondary"]'::jsonb,
  false
),
(
  'Malcolm Smith', 53, 'Linebacker', 33,
  NULL,
  'Super Bowl XLVIII MVP',
  '{"SB Tackles": "10", "SB INT": "1", "SB INT Return Yds": "69", "SB Fumble Recovery": "1"}'::jsonb,
  '["Named Super Bowl XLVIII MVP", "Returned interception 69 yards for touchdown", "Also recovered a fumble in the game", "Unsung hero who rose to biggest moment"]'::jsonb,
  false
),
(
  'Earl Thomas', 29, 'Safety', 34,
  NULL,
  'Legion of Boom - Elite Free Safety',
  '{"SB Tackles": "5", "SB Pass Deflections": "2", "Pro Bowls": "7", "All-Pro": "3x First Team"}'::jsonb,
  '["3-time First-Team All-Pro safety", "Fastest safety in the Legion of Boom", "7 Pro Bowl selections total", "Elite ball hawk and center fielder"]'::jsonb,
  false
),
(
  'Kam Chancellor', 31, 'Safety', 35,
  NULL,
  'Legion of Boom - The Enforcer',
  '{"SB Tackles": "7", "SB Forced Fumbles": "1", "SB Pass Deflections": "1", "Pro Bowls": "4"}'::jsonb,
  '["Known as Bam Bam Kam for devastating hits", "4-time Pro Bowl selection", "Key enforcer of Legion of Boom", "Forced crucial fumble in Super Bowl"]'::jsonb,
  false
);

-- ============================================
-- CATEGORY 4: Super Bowl XLIX Context (2015)
-- ============================================
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Tom Brady', 12, 'Quarterback', 40,
  NULL,
  'Patriots Dynasty QB - Super Bowl XLIX Winner',
  '{"SB Pass Yds": "328", "SB Pass TD": "4", "SB CMP/ATT": "37/50", "SB INT": "2", "Super Bowls": "7"}'::jsonb,
  '["Beat Seattle in Super Bowl XLIX (28-24)", "Threw 4 TD passes in Super Bowl XLIX", "Won 7 Super Bowl titles overall", "Greatest QB in NFL history by championships"]'::jsonb,
  false
);

-- ============================================
-- CATEGORY 5: Hall of Fame Legends
-- ============================================
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Steve Largent', 80, 'Wide Receiver', 50,
  'https://www.profootballhof.com/pfhof/media/Default/Items/Largent_Steve_HS_150.jpg',
  'Seahawks Legend - Hall of Fame (1995)',
  '{"HOF Class": "1995", "Career Rec": "819", "Career Yds": "13,089", "Career TD": "100"}'::jsonb,
  '["First Seahawk inducted into Pro Football Hall of Fame", "Elected to HOF on January 28, 1995", "Held NFL records for receptions and yards at retirement", "Played entire 14-year career with Seattle"]'::jsonb,
  false
),
(
  'Cortez Kennedy', 96, 'Defensive Tackle', 51,
  'https://www.profootballhof.com/pfhof/media/Default/Items/Kennedy_Cortez_Action_Bio.jpg',
  'Seahawks Legend - Hall of Fame (2012)',
  '{"HOF Class": "2012", "Pro Bowls": "8", "All-Pro": "3x", "Sacks": "58"}'::jsonb,
  '["Dominant Seahawks defensive tackle", "Hall of Fame Class of 2012", "8-time Pro Bowl selection", "1992 NFL Defensive Player of the Year"]'::jsonb,
  false
),
(
  'Walter Jones', 71, 'Offensive Tackle', 52,
  'https://www.profootballhof.com/pfhof/media/Default/Items/Jones_Walter_HS-Capsule.jpg',
  'Seahawks Legend - Hall of Fame (2014)',
  '{"HOF Class": "2014", "Pro Bowls": "9", "All-Pro": "4x First Team", "Sacks Allowed": "23 in 5,703 snaps"}'::jsonb,
  '["One of greatest left tackles in NFL history", "Hall of Fame Class of 2014", "Played entire 13-year career for Seattle", "Allowed only 23 sacks in entire career"]'::jsonb,
  false
),
(
  'Kenny Easley', 45, 'Safety', 53,
  'https://www.profootballhof.com/pfhof/media/Default/Items/Easley_Kenny_HS_150.jpg',
  'Seahawks Legend - Hall of Fame (2017)',
  '{"HOF Class": "2017", "Pro Bowls": "5", "All-Pro": "3x", "INT": "32"}'::jsonb,
  '["Hall of Fame Class of 2017", "1984 NFL Defensive Player of the Year", "Played entire 7-year career in Seattle", "Elite range and impact plays in secondary"]'::jsonb,
  false
);

-- ============================================
-- TRIVIA QUESTIONS BY CATEGORY
-- ============================================

-- ============================================
-- CATEGORY: 2025 Season Stats
-- ============================================
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  'In the 2025 regular season, which QB had the MOST passing yards: Sam Darnold (Seahawks), Drake Maye (Patriots), or Matthew Stafford (Rams)?',
  'Sam Darnold - 4,048 (SEA)',
  'Drake Maye - 4,394 (NE)',
  'Matthew Stafford - 4,707 (LAR)',
  'All three tied',
  'c',
  'easy',
  '2025 Season Stats'
),
(
  'In the 2025 regular season, which QB threw the MOST passing touchdowns?',
  'Sam Darnold - 25 (SEA)',
  'Drake Maye - 31 (NE)',
  'Matthew Stafford - 46 (LAR)',
  'All three tied',
  'c',
  'easy',
  '2025 Season Stats'
),
(
  'How many interceptions did Sam Darnold throw in the 2025 regular season?',
  '8',
  '10',
  '14',
  '17',
  'c',
  'medium',
  '2025 Season Stats'
),
(
  'What was Sam Darnold''s passer rating in the 2025 regular season?',
  '92.4',
  '99.1',
  '86.5',
  '104.6',
  'b',
  'hard',
  '2025 Season Stats'
),
(
  'What was Sam Darnold''s completion percentage in the 2025 regular season?',
  '62.3%',
  '67.7%',
  '71.0%',
  '64.7%',
  'b',
  'medium',
  '2025 Season Stats'
),
(
  'What jersey number does Sam Darnold wear with the Seahawks?',
  '#7',
  '#12',
  '#14',
  '#3',
  'c',
  'easy',
  '2025 Season Stats'
),
(
  'Who is the Seahawks head coach in the 2025 season?',
  'Pete Carroll',
  'Mike Vrabel',
  'Mike Macdonald',
  'Dan Quinn',
  'c',
  'easy',
  '2025 Season Stats'
),
(
  'What was the Seahawks'' regular season record in 2025?',
  '12-5',
  '14-3',
  '10-7',
  '13-4',
  'b',
  'medium',
  '2025 Season Stats'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- CATEGORY: 2025 Seahawks Stars
-- ============================================
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  'How many receiving yards did Jaxon Smith-Njigba have in the 2025 regular season?',
  '1,543',
  '1,650',
  '1,793',
  '1,892',
  'c',
  'medium',
  '2025 Seahawks Stars'
),
(
  'Who led the NFL in receiving yards in 2025?',
  'Puka Nacua (Rams)',
  'Jaxon Smith-Njigba (Seahawks)',
  'George Pickens (Cowboys)',
  'Ja''Marr Chase (Bengals)',
  'b',
  'easy',
  '2025 Seahawks Stars'
),
(
  'How many rushing yards did Kenneth Walker III have in 2025?',
  '876',
  '952',
  '1,027',
  '1,156',
  'c',
  'medium',
  '2025 Seahawks Stars'
),
(
  'How many receptions did Jaxon Smith-Njigba have in 2025?',
  '98',
  '107',
  '119',
  '125',
  'c',
  'hard',
  '2025 Seahawks Stars'
),
(
  'Who did the Seahawks defeat in the 2025 NFC Championship Game?',
  'San Francisco 49ers',
  'Dallas Cowboys',
  'Los Angeles Rams',
  'Philadelphia Eagles',
  'c',
  'easy',
  '2025 Seahawks Stars'
),
(
  'What jersey number does Jaxon Smith-Njigba wear?',
  '#1',
  '#11',
  '#13',
  '#19',
  'b',
  'easy',
  '2025 Seahawks Stars'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- CATEGORY: Seahawks Hall of Fame
-- ============================================
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  'Which Seahawks legend was elected to the Pro Football Hall of Fame on January 28, 1995?',
  'Walter Jones',
  'Cortez Kennedy',
  'Steve Largent',
  'Kenny Easley',
  'c',
  'easy',
  'Seahawks Hall of Fame'
),
(
  'Cortez Kennedy was inducted into the Pro Football Hall of Fame in which class year?',
  '2010',
  '2012',
  '2014',
  '2017',
  'b',
  'medium',
  'Seahawks Hall of Fame'
),
(
  'Walter Jones was enshrined into the Pro Football Hall of Fame in which year?',
  '2012',
  '2013',
  '2014',
  '2017',
  'c',
  'medium',
  'Seahawks Hall of Fame'
),
(
  'Kenny Easley was enshrined in the Pro Football Hall of Fame in which year?',
  '1995',
  '2012',
  '2014',
  '2017',
  'd',
  'hard',
  'Seahawks Hall of Fame'
),
(
  'How many Pro Bowl selections did Steve Largent earn in his career?',
  '5',
  '7',
  '9',
  '11',
  'b',
  'hard',
  'Seahawks Hall of Fame'
),
(
  'What position did Cortez Kennedy play?',
  'Linebacker',
  'Defensive End',
  'Defensive Tackle',
  'Safety',
  'c',
  'easy',
  'Seahawks Hall of Fame'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- CATEGORY: Super Bowl Connections
-- (Links 2025 team to Super Bowl history)
-- ============================================
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category) VALUES
(
  'The Seahawks are appearing in Super Bowl LX in 2026. What was the final score of their Super Bowl XLVIII victory?',
  '34-7',
  '43-8',
  '38-10',
  '28-24',
  'b',
  'easy',
  'Super Bowl Connections'
),
(
  'Both Sam Darnold (2025) and Russell Wilson (SB XLVIII) posted 14-3 records. Who else had a 14-3 record as starting QB?',
  'Peyton Manning',
  'Aaron Rodgers',
  'Tom Brady',
  'Drew Brees',
  'c',
  'hard',
  'Super Bowl Connections'
),
(
  'The Seahawks'' 2025 receiving leader Jaxon Smith-Njigba broke whose single-season receiving record?',
  'Steve Largent',
  'Doug Baldwin',
  'DK Metcalf',
  'Tyler Lockett',
  'c',
  'medium',
  'Super Bowl Connections'
),
(
  'In the 2025 NFC Championship, the Seahawks beat the Rams 31-27. In Super Bowl XLVIII, they beat the Broncos by how many points?',
  '21 points',
  '28 points',
  '35 points',
  '42 points',
  'c',
  'medium',
  'Super Bowl Connections'
),
(
  'The Seahawks'' 2025 opponent in Super Bowl LX is the Patriots. Who won Super Bowl XLIX between these teams?',
  'Seahawks (28-24)',
  'Patriots (28-24)',
  'Seahawks (24-21)',
  'Patriots (34-28)',
  'b',
  'easy',
  'Super Bowl Connections'
),
(
  'What do Malcolm Smith (SB XLVIII) and which 2025 Seahawk have in common - both had standout playoff performances that surprised fans?',
  'Sam Darnold',
  'Kenneth Walker III',
  'Jaxon Smith-Njigba',
  'Both B and C',
  'd',
  'medium',
  'Super Bowl Connections'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- DONE! Data seeded successfully.
--
-- Summary:
-- - 13 Players (6 current 2025, 2 comparison QBs, 5 SB heroes)
-- - 26 Trivia Questions across 5 categories:
--   * 2025 Season Stats (8)
--   * 2025 Seahawks Stars (6)
--   * Seahawks Hall of Fame (6)
--   * Super Bowl Connections (6)
-- ============================================
