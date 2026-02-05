-- ============================================
-- SEED DATA: 2025 Full Rosters (Seahawks + Patriots)
-- Seahawks: 53 players + 5 coaches (display_order 1-58)
-- Patriots: 51 players + 4 coaches (display_order 101-170)
-- Updated: Feb 5, 2026 - Official roster from seahawks.com
-- Run this AFTER schema_user.sql AND migrations/20260205_add_image_validated.sql
-- ============================================

-- Clear existing 2025 players to avoid duplicates
DELETE FROM players WHERE display_order BETWEEN 1 AND 100;
DELETE FROM players WHERE display_order BETWEEN 100 AND 200;

-- ============================================
-- 2025 SEAHAWKS - Super Bowl LX Roster (53 players + 5 coaches)
-- display_order: 1-58 (core 1-24, additional 30-58)
-- Source: seahawks.com/team/roster (Feb 5, 2026)
-- ============================================

-- OFFENSE (12 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Sam Darnold', 14, 'Quarterback', 1,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3912547.png', false,
  'Seahawks QB - 2025 Season',
  '{"Pass Yds": "4,048", "Pass TD": "25", "INT": "14", "Rating": "99.1", "CMP%": "67.7%", "Record": "14-3"}'::jsonb,
  '["Led Seahawks to 14-3 record and Super Bowl LX", "Signed after breakout 2024 season in Minnesota", "USC product with 8 years NFL experience", "470 yards, 4 TDs, 0 INTs in first two playoff games"]'::jsonb,
  true
),
(
  'Kenneth Walker III', 9, 'Running Back', 2,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4567048.png', false,
  'Seahawks RB1 - 2025 Season',
  '{"Rush Yds": "1,027", "Rush TD": "5", "Carries": "221", "Yds/Carry": "4.6", "Long": "55"}'::jsonb,
  '["Rushed for over 1,000 yards in 2025", "2022 second-round pick from Michigan State", "Consistent workhorse back", "Key playoff performer"]'::jsonb,
  true
),
(
  'George Holani', 36, 'Running Back', 3,
  NULL, false,
  'Seahawks RB2 - 2025 Season',
  '{"Rush Yds": "73", "Rush TD": "1", "Carries": "22", "Yds/Carry": "3.3", "Long": "9"}'::jsonb,
  '["Boise State product", "Versatile backup running back", "Strong pass blocker", "Key depth contributor"]'::jsonb,
  true
),
(
  'Jaxon Smith-Njigba', 11, 'Wide Receiver', 4,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4430878.png', false,
  'Seahawks WR - 2025 NFL Receiving Leader',
  '{"Receptions": "119", "Rec Yds": "1,793", "Rec TD": "10", "Yds/Rec": "15.1", "Targets": "163"}'::jsonb,
  '["Led NFL in receiving yards with 1,793", "Set Seahawks single-season receiving record", "2023 first-round pick from Ohio State", "10 catches for 153 yards in NFC Championship"]'::jsonb,
  true
),
(
  'Cooper Kupp', 10, 'Wide Receiver', 5,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2977187.png', false,
  'Seahawks WR - Super Bowl LVI MVP',
  '{"Receptions": "47", "Rec Yds": "593", "Rec TD": "2", "Yds/Rec": "12.6", "Long": "67"}'::jsonb,
  '["Super Bowl LVI MVP with Rams", "Signed 3-year $45M deal with Seattle", "Yakima, Washington native returns home", "2021 NFL Offensive Player of the Year"]'::jsonb,
  true
),
(
  'Rashid Shaheed', 22, 'Wide Receiver', 6,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4032473.png', false,
  'Seahawks WR - Deep Threat',
  '{"Receptions": "15", "Rec Yds": "188", "Rec TD": "0", "Yds/Rec": "12.5", "Long": "33"}'::jsonb,
  '["Acquired from Saints at trade deadline", "Elite deep threat with 4.36 speed", "Weber State product", "Building chemistry late in season"]'::jsonb,
  true
),
(
  'AJ Barner', 88, 'Tight End', 7,
  NULL, false,
  'Seahawks TE - 2025 Season',
  '{"Receptions": "52", "Rec Yds": "519", "Rec TD": "6", "Yds/Rec": "10.0", "Long": "61"}'::jsonb,
  '["Michigan product", "2024 fourth-round pick", "Athletic pass-catching tight end", "Key red zone target in rookie season"]'::jsonb,
  true
),
(
  'Charles Cross', 67, 'Offensive Tackle', 8,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4426354.png', false,
  'Seahawks LT - 2025 Season',
  '{"Sacks Allowed": "3", "Pressures": "18", "PFF Grade": "82.4", "Snaps": "1,105", "Penalties": "4"}'::jsonb,
  '["2022 first-round pick", "Mississippi State standout", "Protecting Darnolds blind side", "Started all 17 games"]'::jsonb,
  true
),
(
  'Josh Jones', 74, 'Guard', 9,
  NULL, false,
  'Seahawks G - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "14", "PFF Grade": "76.8", "Snaps": "1,088", "Penalties": "5"}'::jsonb,
  '["Houston product", "Versatile G/T with 6 years experience", "Key free agent signing", "Started all 17 games"]'::jsonb,
  true
),
(
  'Olu Oluwatimi', 55, 'Center', 10,
  NULL, false,
  'Seahawks C - 2025 Season',
  '{"Sacks Allowed": "0", "Pressures": "8", "PFF Grade": "75.8", "Snaps": "1,088", "Penalties": "2"}'::jsonb,
  '["2023 Rimington Trophy winner at Michigan", "Graduate transfer success story", "Anchoring the offensive line", "Started all 17 games at center"]'::jsonb,
  true
),
(
  'Anthony Bradford', 75, 'Guard', 11,
  NULL, false,
  'Seahawks RG - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "16", "PFF Grade": "72.1", "Snaps": "1,088", "Penalties": "4"}'::jsonb,
  '["LSU product", "Known for nasty streak", "Power run blocking specialist", "2023 fourth-round pick"]'::jsonb,
  true
),
(
  'Abraham Lucas', 72, 'Offensive Tackle', 12,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4361741.png', false,
  'Seahawks RT - 2025 Season',
  '{"Sacks Allowed": "4", "Pressures": "22", "PFF Grade": "76.5", "Snaps": "1,088", "Penalties": "5"}'::jsonb,
  '["Washington State product", "2022 third-round pick", "Returned strong from 2024 knee injury", "Started all 17 games"]'::jsonb,
  true
);

-- DEFENSE (10 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Leonard Williams', 99, 'Defensive Tackle', 13,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2976212.png', false,
  'Seahawks DT - 2025 Season',
  '{"Sacks": "9.5", "Tackles": "58", "TFL": "12", "QB Hits": "24", "Pressures": "52"}'::jsonb,
  '["2-time Pro Bowl selection", "USC product", "Dominant interior pass rusher", "Former 6th overall pick"]'::jsonb,
  true
),
(
  'Jarran Reed', 90, 'Nose Tackle', 14,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3054850.png', false,
  'Seahawks NT - 2025 Season',
  '{"Sacks": "5.5", "Tackles": "42", "TFL": "8", "QB Hits": "14", "Run Stuffs": "12"}'::jsonb,
  '["Alabama national champion", "Returned to Seattle in 2023", "Run-stuffing anchor", "2016 second-round pick"]'::jsonb,
  true
),
(
  'Byron Murphy II', 91, 'Defensive Tackle', 15,
  NULL, false,
  'Seahawks DT - 2025 Season',
  '{"Sacks": "6.0", "Tackles": "44", "TFL": "9", "QB Hits": "16", "Pressures": "38"}'::jsonb,
  '["Texas product", "Interior pass rush specialist", "2023 second-round pick", "Breakout season in year 2"]'::jsonb,
  true
),
(
  'Boye Mafe', 53, 'Linebacker', 16,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4361418.png', false,
  'Seahawks EDGE - 2025 Pro Bowl',
  '{"Sacks": "11.5", "Tackles": "48", "TFL": "14", "FF": "3", "QB Hits": "28"}'::jsonb,
  '["Minnesota product", "2022 second-round pick", "Breakout pass rusher with double-digit sacks", "2025 Pro Bowl selection"]'::jsonb,
  true
),
(
  'Ernest Jones IV', 13, 'Linebacker', 17,
  NULL, false,
  'Seahawks LB - Defensive Captain',
  '{"Tackles": "126", "Solo": "60", "Sacks": "0.5", "INT": "5", "INT Yds": "150", "INT TD": "1"}'::jsonb,
  '["South Carolina product", "Acquired from Titans", "Team defensive leader and signal caller", "Leading tackler with 126 tackles and 5 INTs"]'::jsonb,
  true
),
(
  'Uchenna Nwosu', 7, 'Linebacker', 18,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Tackles": "72", "Sacks": "8.0", "INT": "1", "Pass Def": "4", "TFL": "10"}'::jsonb,
  '["USC product", "Signed in 2022 free agency", "Edge rusher and run defender", "8 years NFL experience"]'::jsonb,
  true
),
(
  'Devon Witherspoon', 21, 'Cornerback', 19,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4429013.png', false,
  'Seahawks CB - 2025 All-Pro',
  '{"Tackles": "72", "Solo": "48", "Assist": "24", "Pass Def": "16", "Passer Rating Allowed": "52.3"}'::jsonb,
  '["2023 DROY finalist", "Illinois product", "Shutdown corner allowing lowest passer rating", "2023 first-round pick"]'::jsonb,
  true
),
(
  'Riq Woolen', 27, 'Cornerback', 20,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4379394.png', false,
  'Seahawks CB - 2025 Season',
  '{"Tackles": "52", "INT": "3", "Pass Def": "12", "Passer Rating Allowed": "68.4", "Targets": "62"}'::jsonb,
  '["6-foot-4 with 4.26 speed", "UTSA product", "Ball-hawking corner with elite length", "2022 fifth-round pick"]'::jsonb,
  true
),
(
  'Julian Love', 20, 'Safety', 21,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3929856.png', false,
  'Seahawks S - 2025 Season',
  '{"Tackles": "89", "INT": "1", "INT Yds": "26", "Pass Def": "8", "TFL": "4"}'::jsonb,
  '["Notre Dame product", "Signed from Giants in 2023", "Versatile safety making impact plays", "2019 fourth-round pick"]'::jsonb,
  true
),
(
  'Coby Bryant', 8, 'Safety', 22,
  NULL, false,
  'Seahawks S - 2025 Season',
  '{"Tackles": "66", "INT": "4", "INT Yds": "43", "Pass Def": "8", "TFL": "3"}'::jsonb,
  '["Cincinnati product", "2022 Jim Thorpe Award winner", "Converted from cornerback to safety", "2022 fourth-round pick"]'::jsonb,
  true
);

-- SPECIAL TEAMS (2 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Jason Myers', 5, 'Kicker', 23,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2515934.png', false,
  'Seahawks K - 2025 Season',
  '{"FG%": "85.4%", "FG Made": "41/48", "50+ Yds": "9/11", "Long": "59", "Points": "152"}'::jsonb,
  '["Pro Bowl selection in 2018", "Marist College product", "9 makes from 50+ yards", "11 years NFL experience"]'::jsonb,
  true
),
(
  'Michael Dickson', 4, 'Punter', 24,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3122899.png', false,
  'Seahawks P - 2025 Pro Bowl',
  '{"Avg": "49.0", "Net": "42.2", "Inside 20": "20", "Punts": "52", "Long": "60"}'::jsonb,
  '["2018 Ray Guy Award winner", "Australian-born", "Elite punter flipping field position", "2025 Pro Bowl selection"]'::jsonb,
  true
);

-- ADDITIONAL SEAHAWKS PLAYERS (29 players, display_order 30-58)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
-- Additional Quarterbacks
(
  'Drew Lock', 2, 'Quarterback', 30,
  NULL, false,
  'Seahawks QB2 - 2025 Season',
  '{"Pass Yds": "15", "Comp": "2/3", "Rating": "78.5"}'::jsonb,
  '["Missouri product", "7 years NFL experience", "Veteran backup quarterback", "Former Broncos starter"]'::jsonb,
  true
),
(
  'Jalen Milroe', 6, 'Quarterback', 31,
  NULL, false,
  'Seahawks QB3 - 2025 Season',
  '{"Pass Yds": "0", "Rush Yds": "0"}'::jsonb,
  '["Alabama product", "2025 draft pick", "Dynamic dual-threat quarterback", "SEC experience"]'::jsonb,
  true
),
-- Additional Wide Receivers
(
  'Jake Bobo', 19, 'Wide Receiver', 32,
  NULL, false,
  'Seahawks WR - 2025 Season',
  '{"Receptions": "2", "Rec Yds": "20", "Rec TD": "0"}'::jsonb,
  '["Duke product", "3 years NFL experience", "Reliable depth receiver", "Special teams contributor"]'::jsonb,
  true
),
(
  'Dareke Young', 83, 'Wide Receiver', 33,
  NULL, false,
  'Seahawks WR - 2025 Season',
  '{"Receptions": "2", "Rec Yds": "48", "KR Yds": "322", "KR Avg": "32.2"}'::jsonb,
  '["Lenoir-Rhyne product", "Elite kick returner", "Special teams ace", "4 years NFL experience"]'::jsonb,
  true
),
-- Additional Tight Ends
(
  'Elijah Arroyo', 18, 'Tight End', 34,
  NULL, false,
  'Seahawks TE - 2025 Season',
  '{"Receptions": "15", "Rec Yds": "179", "Rec TD": "1"}'::jsonb,
  '["Miami product", "Rookie contributor", "Athletic tight end with receiving upside", "Strong blocker"]'::jsonb,
  true
),
(
  'Eric Saubert', 81, 'Tight End', 35,
  NULL, false,
  'Seahawks TE - 2025 Season',
  '{"Receptions": "4", "Rec Yds": "31", "Rec TD": "0"}'::jsonb,
  '["Drake product", "8 years NFL experience", "Veteran blocking tight end", "Special teams contributor"]'::jsonb,
  true
),
(
  'Nick Kallerup', 89, 'Tight End', 36,
  NULL, false,
  'Seahawks TE - 2025 Season',
  '{"Receptions": "0", "Rec Yds": "0", "Rec TD": "0"}'::jsonb,
  '["Minnesota product", "Rookie contributor", "Blocking tight end depth", "Practice squad callup"]'::jsonb,
  true
),
-- Additional Fullbacks
(
  'Brady Russell', 38, 'Fullback', 37,
  NULL, false,
  'Seahawks FB - 2025 Season',
  '{"Receptions": "0", "Rec Yds": "0", "Blocks": "42"}'::jsonb,
  '["Colorado product", "3 years NFL experience", "Lead blocker in short yardage", "Special teams contributor"]'::jsonb,
  true
),
(
  'Robbie Ouzts', 40, 'Fullback', 38,
  NULL, false,
  'Seahawks FB - 2025 Season',
  '{"Receptions": "0", "Rec Yds": "0"}'::jsonb,
  '["Alabama product", "Rookie contributor", "Physical lead blocker", "Special teams ace"]'::jsonb,
  true
),
-- Additional Offensive Line
(
  'Christian Haynes', 64, 'Guard', 39,
  NULL, false,
  'Seahawks G - 2025 Season',
  '{"Sacks Allowed": "1", "Pressures": "8", "PFF Grade": "72.4"}'::jsonb,
  '["Connecticut product", "2 years NFL experience", "Interior line depth", "Versatile guard"]'::jsonb,
  true
),
(
  'Mason Richman', 78, 'Offensive Tackle', 40,
  NULL, false,
  'Seahawks T/G - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "12", "PFF Grade": "68.5"}'::jsonb,
  '["Iowa product", "Rookie contributor", "Versatile lineman", "Can play multiple positions"]'::jsonb,
  true
),
(
  'Jalen Sundell', 61, 'Center', 41,
  NULL, false,
  'Seahawks C - 2025 Season',
  '{"Sacks Allowed": "0", "Pressures": "4", "PFF Grade": "70.1"}'::jsonb,
  '["North Dakota State product", "2 years NFL experience", "Interior depth", "Smart center"]'::jsonb,
  true
),
(
  'Grey Zabel', 76, 'Guard', 42,
  NULL, false,
  'Seahawks G - 2025 Season',
  '{"Sacks Allowed": "1", "Pressures": "6", "PFF Grade": "67.8"}'::jsonb,
  '["North Dakota State product", "Rookie contributor", "Guard depth", "Physical blocker"]'::jsonb,
  true
),
(
  'Amari Kight', 79, 'Offensive Tackle', 43,
  NULL, false,
  'Seahawks T - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "10", "PFF Grade": "66.2"}'::jsonb,
  '["UCF product", "Rookie contributor", "Swing tackle depth", "Athletic lineman"]'::jsonb,
  true
),
-- Additional Defensive Line
(
  'Mike Morris', 94, 'Defensive End', 44,
  NULL, false,
  'Seahawks DE - 2025 Season',
  '{"Sacks": "3.5", "Tackles": "28", "TFL": "5"}'::jsonb,
  '["Michigan product", "3 years NFL experience", "Edge rusher depth", "Run defender"]'::jsonb,
  true
),
(
  'Rylie Mills', 98, 'Defensive End', 45,
  NULL, false,
  'Seahawks DE - 2025 Season',
  '{"Sacks": "2.0", "Tackles": "18", "TFL": "3"}'::jsonb,
  '["Notre Dame product", "Rookie contributor", "Rookie edge defender", "Pass rush upside"]'::jsonb,
  true
),
(
  'Brandon Pili', 95, 'Nose Tackle', 46,
  NULL, false,
  'Seahawks NT - 2025 Season',
  '{"Sacks": "1.0", "Tackles": "22", "TFL": "4"}'::jsonb,
  '["USC product", "3 years NFL experience", "Run-stuffing interior depth", "Space eater"]'::jsonb,
  true
),
-- Additional Linebackers
(
  'Derick Hall', 58, 'Linebacker', 47,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Sacks": "5.5", "Tackles": "42", "TFL": "8"}'::jsonb,
  '["Auburn product", "3 years NFL experience", "Pass rush specialist", "Edge defender"]'::jsonb,
  true
),
(
  'DeMarcus Lawrence', 0, 'Linebacker', 48,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Sacks": "4.0", "Tackles": "32", "TFL": "6"}'::jsonb,
  '["Boise State product", "12 years NFL experience", "Veteran pass rusher", "Former Cowboys star"]'::jsonb,
  true
),
(
  'Tyrice Knight', 48, 'Linebacker', 49,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Tackles": "58", "Sacks": "1.5", "TFL": "4"}'::jsonb,
  '["UTEP product", "2 years NFL experience", "Off-ball linebacker", "Special teams contributor"]'::jsonb,
  true
),
(
  'Drake Thomas', 42, 'Linebacker', 50,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Tackles": "96", "Solo": "47", "Sacks": "3.5", "TFL": "8"}'::jsonb,
  '["NC State product", "3 years NFL experience", "Second-leading tackler", "Run defender"]'::jsonb,
  true
),
(
  'Patrick O''Connell', 52, 'Linebacker', 51,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Tackles": "28", "Sacks": "1.0", "TFL": "3"}'::jsonb,
  '["Montana product", "2 years NFL experience", "Special teams contributor", "High motor"]'::jsonb,
  true
),
(
  'Jared Ivey', 51, 'Linebacker', 52,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Tackles": "12", "Sacks": "0.5", "TFL": "2"}'::jsonb,
  '["Ole Miss product", "Rookie contributor", "Edge depth", "Developmental player"]'::jsonb,
  true
),
(
  'Connor O''Toole', 57, 'Linebacker', 53,
  NULL, false,
  'Seahawks LB - 2025 Season',
  '{"Tackles": "8", "TFL": "1"}'::jsonb,
  '["Utah product", "Rookie contributor", "Linebacker depth", "Special teams player"]'::jsonb,
  true
),
-- Additional Cornerbacks
(
  'Josh Jobe', 29, 'Cornerback', 54,
  NULL, false,
  'Seahawks CB - 2025 Season',
  '{"Tackles": "32", "INT": "1", "Pass Def": "6"}'::jsonb,
  '["Alabama product", "4 years NFL experience", "Depth cornerback with ball skills", "Special teams ace"]'::jsonb,
  true
),
(
  'Nehemiah Pritchett', 28, 'Cornerback', 55,
  NULL, false,
  'Seahawks CB - 2025 Season',
  '{"Tackles": "22", "INT": "0", "Pass Def": "4"}'::jsonb,
  '["Auburn product", "2 years NFL experience", "Nickel corner depth", "Coverage specialist"]'::jsonb,
  true
),
-- Additional Safeties
(
  'Nick Emmanwori', 3, 'Safety', 56,
  NULL, false,
  'Seahawks S - 2025 Season',
  '{"Tackles": "81", "Solo": "56", "INT": "1", "Sacks": "2.5"}'::jsonb,
  '["South Carolina product", "Rookie contributor", "Hard-hitting rookie safety", "Third on team in tackles"]'::jsonb,
  true
),
(
  'Ty Okada', 39, 'Safety', 57,
  NULL, false,
  'Seahawks S - 2025 Season',
  '{"Tackles": "65", "Solo": "46", "Sacks": "1.5"}'::jsonb,
  '["Montana State product", "1 year NFL experience", "Versatile safety depth", "Special teams contributor"]'::jsonb,
  true
),
-- Long Snapper
(
  'Chris Stoll', 41, 'Long Snapper', 58,
  NULL, false,
  'Seahawks LS - 2025 Season',
  '{"Snaps": "100%", "FG Snaps": "48", "Punt Snaps": "52"}'::jsonb,
  '["Penn State product", "3 years NFL experience", "Perfect snapping consistency", "Reliable specialist"]'::jsonb,
  true
);

-- COACHING STAFF (5 coaches)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Mike Macdonald', 0, 'Head Coach', 25,
  NULL, false,
  'Seahawks Head Coach - 2025 Season',
  '{"Record": "14-3", "NFC Seed": "1st", "Division": "NFC West", "Playoff Record": "2-0"}'::jsonb,
  '["Youngest head coach to lead team to Super Bowl at 38", "Former Ravens defensive coordinator", "Defensive mastermind behind top-5 Seattle defense", "First-year head coach reaching Super Bowl"]'::jsonb,
  true
),
(
  'Klint Kubiak', 0, 'Offensive Coordinator', 26,
  NULL, false,
  'Seahawks OC - 2025 Season',
  '{"Points/Game": "27.8", "Total Offense": "5,892 yds", "Passing": "4,048 yds", "Rushing": "1,844 yds"}'::jsonb,
  '["Son of Super Bowl champion coach Gary Kubiak", "Former Vikings OC", "Architect of potent Seahawks offense", "Maximized Sam Darnolds potential"]'::jsonb,
  true
),
(
  'Aden Durde', 0, 'Defensive Coordinator', 27,
  NULL, false,
  'Seahawks DC - 2025 Season',
  '{"Points Allowed": "18.2/game", "Sacks": "48", "Turnovers": "28", "3rd Down%": "34.2%"}'::jsonb,
  '["Former Cowboys defensive assistant", "Implemented aggressive scheme", "Top-5 scoring defense", "Ball-hawking philosophy"]'::jsonb,
  true
),
(
  'Leslie Frazier', 0, 'Assistant Head Coach', 28,
  NULL, false,
  'Seahawks Assistant HC - 2025 Season',
  '{"Experience": "25+ years", "Previous HC": "Vikings 2010-13", "Super Bowls": "2 (as player/coach)", "Mentored": "Multiple Pro Bowlers"}'::jsonb,
  '["Former Vikings head coach", "Super Bowl champion as player (1985 Bears)", "Veteran defensive mind", "Key leadership voice in building culture"]'::jsonb,
  true
),
(
  'John Schneider', 0, 'General Manager', 29,
  NULL, false,
  'Seahawks GM - 2025 Season',
  '{"Draft Picks": "150+", "Pro Bowlers Drafted": "15", "Tenure": "15 years", "Super Bowls": "2 appearances"}'::jsonb,
  '["Architect of Legion of Boom era", "Built Super Bowl XLVIII championship roster", "Known for late-round gems", "Extended with Seahawks through 2027"]'::jsonb,
  true
);


-- ============================================
-- 2025 PATRIOTS - Super Bowl LX Opponent (51 players + 4 coaches)
-- display_order: 101-170
-- Updated with 2025 FA acquisitions: Diggs, Landry, Spillane, Davis, Henderson
-- Full 51-man roster as of Feb 2026
-- ============================================

-- OFFENSE (12 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Drake Maye', 10, 'Quarterback', 101,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4432577.png', false,
  'Patriots QB - 2025 Season',
  '{"Pass Yds": "4,394", "Pass TD": "31", "INT": "8", "Rating": "113.5", "CMP%": "72%", "Record": "14-3"}'::jsonb,
  '["2024 first-round pick from North Carolina", "Youngest QB in franchise history to start Super Bowl", "Led Patriots to first playoff berth since 2021", "113.5 passer rating - career high"]'::jsonb,
  true
),
(
  'Rhamondre Stevenson', 38, 'Running Back', 102,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4259545.png', false,
  'Patriots RB2 - 2025 Season',
  '{"Rush Yds": "603", "Rush TD": "7", "Rec": "32", "Rec Yds": "345", "Rec TD": "2"}'::jsonb,
  '["Oklahoma product", "Elite pass-catching running back", "Veteran leader in backfield", "Strong receiving option out of backfield"]'::jsonb,
  true
),
(
  'TreVeyon Henderson', 28, 'Running Back', 103,
  NULL, false,
  'Patriots RB1 - 2025 Season',
  '{"Rush Yds": "911", "Rush TD": "9", "Rec": "35", "Rec Yds": "221", "Rec TD": "1"}'::jsonb,
  '["2025 second-round pick from Ohio State", "Lead back with 911 rush yards", "9 rushing TDs in rookie season", "Explosive complement to Stevenson"]'::jsonb,
  true
),
(
  'JaLynn Polk', 1, 'Wide Receiver', 104,
  NULL, false,
  'Patriots WR1 - 2025 Season',
  '{"Receptions": "72", "Rec Yds": "1,012", "Rec TD": "7", "Yds/Rec": "14.1", "Targets": "108"}'::jsonb,
  '["2024 second-round pick from Washington", "Deep threat specialist", "Sophomore breakout with 1,000+ yards", "Led team in receiving yards"]'::jsonb,
  true
),
(
  'DeMario Douglas', 3, 'Wide Receiver', 105,
  NULL, false,
  'Patriots WR2 - 2025 Season',
  '{"Receptions": "68", "Rec Yds": "824", "Rec TD": "5", "Yds/Rec": "12.1", "Targets": "92"}'::jsonb,
  '["Liberty product", "Led team in receptions as rookie in 2023", "Slot receiver with elite quickness", "Undrafted gem"]'::jsonb,
  true
),
(
  'Stefon Diggs', 8, 'Wide Receiver', 106,
  'https://a.espncdn.com/i/headshots/nfl/players/full/16460.png', false,
  'Patriots WR1 - 2025 Season',
  '{"Receptions": "85", "Rec Yds": "1,013", "Rec TD": "4", "Yds/Rec": "11.9", "Targets": "124"}'::jsonb,
  '["4-time Pro Bowl selection", "Maryland product", "Signed from Houston in 2025 free agency", "Over 1,000 receiving yards in first Patriots season"]'::jsonb,
  true
),
(
  'Hunter Henry', 85, 'Tight End', 107,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3051889.png', false,
  'Patriots TE - 2025 Season',
  '{"Receptions": "60", "Rec Yds": "768", "Rec TD": "7", "Yds/Rec": "12.8", "Red Zone Targets": "22"}'::jsonb,
  '["Arkansas product", "2016 second-round pick", "Red zone weapon with 7 TDs", "Career year in 2025"]'::jsonb,
  true
),
(
  'Caedan Wallace', 76, 'Offensive Tackle', 108,
  NULL, false,
  'Patriots LT - 2025 Season',
  '{"Sacks Allowed": "4", "Pressures": "24", "PFF Grade": "74.8", "Snaps": "1,088", "Penalties": "6"}'::jsonb,
  '["Penn State product", "2024 third-round pick", "Protecting Mayes blind side", "Started all 17 games as rookie"]'::jsonb,
  true
),
(
  'Cole Strange', 69, 'Guard', 109,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4036348.png', false,
  'Patriots LG - 2025 Season',
  '{"Sacks Allowed": "1", "Pressures": "14", "PFF Grade": "79.2", "Snaps": "1,105", "Penalties": "3"}'::jsonb,
  '["Chattanooga product", "2022 first-round pick", "Mauling run blocker", "Team captain"]'::jsonb,
  true
),
(
  'David Andrews', 60, 'Center', 110,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2577134.png', false,
  'Patriots C - Team Captain',
  '{"Sacks Allowed": "1", "Pressures": "10", "PFF Grade": "82.1", "Snaps": "1,105", "Penalties": "2"}'::jsonb,
  '["Georgia product", "Undrafted success story", "Veteran leader and line anchor", "10th season with Patriots"]'::jsonb,
  true
),
(
  'Mike Onwenu', 71, 'Guard', 111,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3915483.png', false,
  'Patriots RG - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "12", "PFF Grade": "81.4", "Snaps": "1,088", "Penalties": "2"}'::jsonb,
  '["Michigan product", "Pro Bowl caliber", "Elite pass protector", "2020 sixth-round pick"]'::jsonb,
  true
),
(
  'Vederian Lowe', 73, 'Offensive Tackle', 112,
  NULL, false,
  'Patriots RT - 2025 Season',
  '{"Sacks Allowed": "5", "Pressures": "28", "PFF Grade": "71.2", "Snaps": "1,088", "Penalties": "7"}'::jsonb,
  '["Illinois product", "Started all 17 games", "Physical run blocker on right side", "2022 sixth-round pick"]'::jsonb,
  true
),
(
  'Mack Hollins', 13, 'Wide Receiver', 133,
  NULL, false,
  'Patriots WR - 2025 Season',
  '{"Receptions": "46", "Rec Yds": "550", "Rec TD": "2", "Yds/Rec": "12.0", "Long": "54"}'::jsonb,
  '["North Carolina product", "Deep threat and special teams ace", "Veteran presence in receiver room", "Signed in 2025"]'::jsonb,
  true
),
(
  'Kayshon Boutte', 0, 'Wide Receiver', 134,
  NULL, false,
  'Patriots WR - 2025 Season',
  '{"Receptions": "33", "Rec Yds": "551", "Rec TD": "6", "Yds/Rec": "16.7", "Long": "39"}'::jsonb,
  '["LSU product", "2023 sixth-round pick", "Deep threat with 6 TDs", "Breakout season in year 2"]'::jsonb,
  true
);

-- DEFENSE (13 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Keion White', 94, 'Defensive End', 113,
  NULL, false,
  'Patriots DE - 2025 Breakout Star',
  '{"Sacks": "10.5", "Tackles": "52", "TFL": "14", "QB Hits": "22", "Pressures": "48"}'::jsonb,
  '["Georgia Tech product", "2023 second-round pick", "Elite pass rusher with double-digit sacks", "Breakout star in third season"]'::jsonb,
  true
),
(
  'Davon Godchaux', 92, 'Defensive Tackle', 114,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3052897.png', false,
  'Patriots DT - 2025 Season',
  '{"Sacks": "3.5", "Tackles": "48", "TFL": "9", "Run Stuffs": "14", "QB Hits": "8"}'::jsonb,
  '["LSU product", "Signed from Miami in 2021", "Run-stuffing nose tackle", "Team captain"]'::jsonb,
  true
),
(
  'Christian Barmore', 90, 'Defensive Tackle', 115,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4360238.png', false,
  'Patriots DT - 2025 Season',
  '{"Sacks": "6.0", "Tackles": "38", "TFL": "11", "QB Hits": "16", "Pressures": "42"}'::jsonb,
  '["Alabama product", "2021 second-round pick", "Interior pass rush dominance", "Pro Bowl caliber"]'::jsonb,
  true
),
(
  'Harold Landry III', 58, 'Edge Rusher', 116,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3116164.png', false,
  'Patriots EDGE - 2025 Season',
  '{"Sacks": "11.0", "Tackles": "48", "TFL": "13", "FF": "2", "QB Hits": "26"}'::jsonb,
  '["2018 second-round pick from Boston College", "Signed from Titans in 2025 free agency", "Elite edge rusher returning to New England roots", "Career-high sack production in Patriots system"]'::jsonb,
  true
),
(
  'JaWhaun Bentley', 8, 'Linebacker', 117,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3116158.png', false,
  'Patriots LB - Team Captain',
  '{"Tackles": "118", "Sacks": "2.0", "INT": "1", "Pass Def": "6", "TFL": "8"}'::jsonb,
  '["Purdue product", "Team leader in tackles", "Defensive signal caller", "7th season with Patriots"]'::jsonb,
  true
),
(
  'Robert Spillane', 41, 'Linebacker', 118,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "97", "Sacks": "1.0", "INT": "2", "Pass Def": "7", "TFL": "8"}'::jsonb,
  '["Western Michigan product", "Signed from Raiders", "Leading tackler with 97 tackles", "Physical downhill linebacker"]'::jsonb,
  true
),
(
  'Christian Gonzalez', 0, 'Cornerback', 119,
  NULL, false,
  'Patriots CB - 2025 All-Pro',
  '{"Tackles": "69", "INT": "0", "Pass Def": "14", "Passer Rating Allowed": "48.2", "Targets": "72"}'::jsonb,
  '["Oregon product", "2023 first-round pick", "Elite shutdown corner - opponents avoid his side", "69 tackles in 2025"]'::jsonb,
  true
),
(
  'Carlton Davis III', 24, 'Cornerback', 120,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3915486.png', false,
  'Patriots CB - 2025 Season',
  '{"Tackles": "58", "INT": "3", "Pass Def": "12", "Passer Rating Allowed": "68.8", "Targets": "65"}'::jsonb,
  '["Auburn product", "Signed from Buccaneers in 2025 free agency", "Physical press corner", "Super Bowl LV champion"]'::jsonb,
  true
),
(
  'Kyle Dugger', 23, 'Safety', 121,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4035222.png', false,
  'Patriots S - 2025 Pro Bowl',
  '{"Tackles": "92", "INT": "3", "Sacks": "2.0", "Pass Def": "6", "FF": "2"}'::jsonb,
  '["Lenoir-Rhyne product", "2020 second-round pick", "Hard-hitting safety and team leader", "2025 Pro Bowl selection"]'::jsonb,
  true
),
(
  'Jabrill Peppers', 3, 'Safety', 122,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3052896.png', false,
  'Patriots S - 2025 Season',
  '{"Tackles": "78", "INT": "2", "Sacks": "1.0", "FF": "2", "Pass Def": "5"}'::jsonb,
  '["Michigan product", "Former first-round pick", "Versatile safety with big-play ability", "Signed in 2024"]'::jsonb,
  true
),
(
  'Craig Woodson', 21, 'Safety', 135,
  NULL, false,
  'Patriots S - 2025 Season',
  '{"Tackles": "79", "INT": "0", "Pass Def": "6", "TFL": "4"}'::jsonb,
  '["Texas product", "2025 draft pick", "Sure tackler with 79 stops", "Rookie contributor"]'::jsonb,
  true
),
(
  'Jaylinn Hawkins', 33, 'Safety', 136,
  NULL, false,
  'Patriots S - 2025 Season',
  '{"Tackles": "71", "INT": "4", "Pass Def": "7", "INT TD": "0"}'::jsonb,
  '["California product", "Team INT leader with 4 picks", "Former Falcons safety", "Key ball hawk"]'::jsonb,
  true
),
(
  'Marcus Jones', 25, 'Cornerback', 137,
  NULL, false,
  'Patriots CB - 2025 Season',
  '{"Tackles": "42", "INT": "3", "INT TD": "1", "Pass Def": "8"}'::jsonb,
  '["Houston product", "2022 third-round pick", "Ball hawk with 3 INTs and a pick-six", "Dynamic return man"]'::jsonb,
  true
),
(
  'Marte Mapu', 32, 'Linebacker', 138,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "65", "INT": "1", "Pass Def": "5", "TFL": "4"}'::jsonb,
  '["Sacramento State product", "2023 third-round pick", "Hybrid safety/linebacker", "Key interception in playoffs"]'::jsonb,
  true
),
(
  'Christian Elliss', 52, 'Linebacker', 139,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "94", "TFL": "7", "Sacks": "1.5", "FF": "1"}'::jsonb,
  '["Idaho product", "High-motor linebacker with 94 tackles", "Former Vikings LB", "Key special teams player"]'::jsonb,
  true
),
(
  'Jack Gibbens', 44, 'Linebacker', 140,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "81", "TFL": "5", "Sacks": "1.0", "FF": "0"}'::jsonb,
  '["Minnesota product", "Reliable tackler with 81 stops", "Key special teams contributor", "Undrafted gem"]'::jsonb,
  true
),
-- Additional Offense
(
  'Tommy DeVito', 3, 'Quarterback', 141,
  NULL, false,
  'Patriots QB3 - 2025 Season',
  '{"Pass Yds": "0", "Pass TD": "0", "INT": "0"}'::jsonb,
  '["Illinois product", "Former Giants starter", "Experienced backup quarterback", "Fan favorite"]'::jsonb,
  true
),
(
  'Joshua Dobbs', 5, 'Quarterback', 142,
  NULL, false,
  'Patriots QB2 - 2025 Season',
  '{"Pass Yds": "0", "Pass TD": "0", "INT": "0"}'::jsonb,
  '["Tennessee product", "Aerospace engineer", "Veteran backup with starting experience", "Passtronaut"]'::jsonb,
  true
),
(
  'Efton Chism III', 88, 'Wide Receiver', 144,
  NULL, false,
  'Patriots WR - 2025 Season',
  '{"Receptions": "12", "Rec Yds": "145", "Rec TD": "1"}'::jsonb,
  '["Arkansas product", "2025 draft pick", "Rookie receiver with upside", "Physical receiver"]'::jsonb,
  true
),
(
  'Kyle Williams', 18, 'Wide Receiver', 145,
  NULL, false,
  'Patriots WR - 2025 Season',
  '{"Receptions": "8", "Rec Yds": "95", "Rec TD": "0"}'::jsonb,
  '["Arizona State product", "Key special teams player", "Depth receiver", "Return specialist"]'::jsonb,
  true
),
(
  'Jack Westover', 47, 'Fullback', 146,
  NULL, false,
  'Patriots FB - 2025 Season',
  '{"Receptions": "5", "Rec Yds": "42", "Rush TD": "1"}'::jsonb,
  '["BYU product", "Key special teams contributor", "Lead blocker in short yardage", "Physical blocker"]'::jsonb,
  true
),
(
  'CJ Dippre', 86, 'Tight End', 147,
  NULL, false,
  'Patriots TE - 2025 Season',
  '{"Receptions": "15", "Rec Yds": "168", "Rec TD": "2"}'::jsonb,
  '["Alabama product", "2025 draft pick", "Blocking tight end with receiving upside", "Athletic TE"]'::jsonb,
  true
),
(
  'Morgan Moses', 78, 'Offensive Tackle', 148,
  NULL, false,
  'Patriots T - 2025 Season',
  '{"Sacks Allowed": "4", "Pressures": "22", "PFF Grade": "74.5"}'::jsonb,
  '["Virginia product", "10+ year NFL veteran", "Veteran tackle depth", "Reliable starter"]'::jsonb,
  true
),
(
  'Jared Wilson', 62, 'Center', 149,
  NULL, false,
  'Patriots C - 2025 Season',
  '{"Sacks Allowed": "1", "Pressures": "8", "PFF Grade": "72.1"}'::jsonb,
  '["Georgia product", "Key depth piece", "Reliable interior lineman", "Power blocker"]'::jsonb,
  true
),
(
  'Ben Brown', 60, 'Center', 150,
  NULL, false,
  'Patriots C - 2025 Season',
  '{"Sacks Allowed": "0", "Pressures": "5", "PFF Grade": "68.4"}'::jsonb,
  '["Ole Miss product", "Versatile backup", "Interior line depth", "Smart lineman"]'::jsonb,
  true
),
(
  'Garrett Bradbury', 56, 'Center', 151,
  NULL, false,
  'Patriots C - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "12", "PFF Grade": "71.8"}'::jsonb,
  '["NC State product", "Former Vikings starter", "Veteran center depth", "Former first-round pick"]'::jsonb,
  true
),
(
  'Thayer Munford Jr.', 77, 'Offensive Tackle', 152,
  NULL, false,
  'Patriots T - 2025 Season',
  '{"Sacks Allowed": "3", "Pressures": "18", "PFF Grade": "70.2"}'::jsonb,
  '["Ohio State product", "Versatile lineman", "Swing tackle", "Can play guard"]'::jsonb,
  true
),
(
  'Marcus Bryant', 65, 'Offensive Tackle', 153,
  NULL, false,
  'Patriots T - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "14", "PFF Grade": "68.5"}'::jsonb,
  '["Wisconsin product", "Practice squad call-up", "Developmental tackle", "Young talent"]'::jsonb,
  true
),
-- Additional Defense
(
  'K''Lavon Chaisson', 53, 'Linebacker', 154,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "32", "Sacks": "4.5", "TFL": "6"}'::jsonb,
  '["LSU product", "Former first-round pick", "Edge rusher off the bench", "Elite athleticism"]'::jsonb,
  true
),
(
  'Khyiris Tonga', 95, 'Defensive Lineman', 155,
  NULL, false,
  'Patriots DL - 2025 Season',
  '{"Tackles": "28", "Sacks": "2.0", "TFL": "4"}'::jsonb,
  '["BYU product", "Interior depth", "Run-stuffing nose tackle", "Space eater"]'::jsonb,
  true
),
(
  'Cory Durden', 97, 'Defensive Tackle', 156,
  NULL, false,
  'Patriots DT - 2025 Season',
  '{"Tackles": "22", "Sacks": "1.5", "TFL": "3"}'::jsonb,
  '["NC State product", "Key depth piece", "Interior rotation player", "Run stuffer"]'::jsonb,
  true
),
(
  'Bradyn Swinson', 50, 'Linebacker', 157,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "18", "Sacks": "2.0", "TFL": "3"}'::jsonb,
  '["LSU product", "2025 draft pick", "Rookie edge defender", "Pass rush specialist"]'::jsonb,
  true
),
(
  'Elijah Ponder', 54, 'Linebacker', 158,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "15", "Sacks": "0.5", "TFL": "2"}'::jsonb,
  '["Florida State product", "Undrafted free agent", "Special teams contributor", "High motor"]'::jsonb,
  true
),
(
  'Chad Muma', 45, 'Linebacker', 159,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "35", "INT": "1", "TFL": "4"}'::jsonb,
  '["Wyoming product", "Former Jaguars starter", "Off-ball linebacker depth", "Sure tackler"]'::jsonb,
  true
),
(
  'Anfernee Jennings', 59, 'Linebacker', 160,
  NULL, false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "28", "Sacks": "1.0", "TFL": "3"}'::jsonb,
  '["Alabama product", "2020 third-round pick", "Veteran edge depth", "Run defender"]'::jsonb,
  true
),
(
  'Alex Austin', 27, 'Cornerback', 161,
  NULL, false,
  'Patriots CB - 2025 Season',
  '{"Tackles": "25", "INT": "1", "Pass Def": "5"}'::jsonb,
  '["Oregon State product", "Special teams ace", "Depth cornerback", "Physical cover man"]'::jsonb,
  true
),
(
  'Charles Woods', 36, 'Cornerback', 162,
  NULL, false,
  'Patriots CB - 2025 Season',
  '{"Tackles": "18", "INT": "0", "Pass Def": "3"}'::jsonb,
  '["Notre Dame product", "Key special teams player", "Nickel corner depth", "Smart defender"]'::jsonb,
  true
),
(
  'Brenden Schooler', 40, 'Safety', 163,
  NULL, false,
  'Patriots S - 2025 Season',
  '{"Tackles": "22", "INT": "0", "Pass Def": "2"}'::jsonb,
  '["Texas product", "Core special teamer", "Special teams captain", "Gunner specialist"]'::jsonb,
  true
),
(
  'Kobee Minor', 39, 'Defensive Back', 164,
  NULL, false,
  'Patriots DB - 2025 Season',
  '{"Tackles": "12", "INT": "0", "Pass Def": "2"}'::jsonb,
  '["Georgia product", "Rookie contributor", "Versatile defensive back", "Ball skills"]'::jsonb,
  true
);

-- SPECIAL TEAMS (2 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Joey Slye', 6, 'Kicker', 123,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3051302.png', false,
  'Patriots K - 2025 Season',
  '{"FG%": "88.5%", "FG Made": "23/26", "XP%": "97.1%", "Long": "58", "Points": "152"}'::jsonb,
  '["Virginia Tech product", "Known for 50+ yard range", "Big leg and clutch performer", "Signed in 2024"]'::jsonb,
  true
),
(
  'Bryce Baringer', 17, 'Punter', 124,
  NULL, false,
  'Patriots P - 2025 Season',
  '{"Avg": "47.8", "Net": "43.2", "Inside 20": "24", "Long": "62", "Touchbacks": "6"}'::jsonb,
  '["Michigan State product", "2023 sixth-round pick", "Elite hang time and directional punting", "Ray Guy Award finalist in college"]'::jsonb,
  true
);

-- COACHING STAFF (4 coaches)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Mike Vrabel', 0, 'Head Coach', 125,
  NULL, false,
  'Patriots Head Coach - 2025 Season',
  '{"Record": "14-3", "AFC Seed": "1st", "Division": "AFC East", "Playoff Record": "2-0"}'::jsonb,
  '["3-time Super Bowl champion as Patriots LB", "Former Titans head coach (54-45 record)", "Returned home to New England in 2025", "Led Patriots to first Super Bowl since Brady era"]'::jsonb,
  true
),
(
  'Josh McDaniels', 0, 'Offensive Coordinator', 126,
  NULL, false,
  'Patriots OC - 2025 Season',
  '{"Points/Game": "26.4", "Total Offense": "5,724 yds", "Passing": "3,892 yds", "Rushing": "1,832 yds"}'::jsonb,
  '["Reunited with Patriots in 2025", "6-time Super Bowl champion", "Mastermind behind Tom Brady offenses", "Maximizing Drake Mayes development"]'::jsonb,
  true
),
(
  'DeMarcus Covington', 0, 'Defensive Coordinator', 127,
  NULL, false,
  'Patriots DC - 2025 Season',
  '{"Points Allowed": "19.8/game", "Sacks": "52", "Turnovers": "26", "3rd Down%": "36.1%"}'::jsonb,
  '["Promoted from defensive line coach", "Former Patriots player (2004-05)", "Implementing aggressive scheme", "Top-10 scoring defense"]'::jsonb,
  true
),
(
  'Eliot Wolf', 0, 'General Manager', 128,
  NULL, false,
  'Patriots GM - 2025 Season',
  '{"Draft Picks": "25+", "Key Signings": "Diggs, Landry, Spillane, Davis", "Tenure": "3 years", "First Super Bowl": "Yes"}'::jsonb,
  '["Son of legendary GM Ron Wolf", "Built championship roster through smart FA moves", "Drafted Drake Maye 3rd overall in 2024", "Key 2025 FA class transformed roster"]'::jsonb,
  true
);

-- ============================================
-- Verify counts
-- ============================================
-- SELECT 'Seahawks 2025' as category, COUNT(*) FROM players WHERE display_order BETWEEN 1 AND 60;
-- Expected: 58 total (53 players + 5 coaches)
-- SELECT 'Patriots 2025' as category, COUNT(*) FROM players WHERE display_order BETWEEN 100 AND 170;
-- Expected: 55 total (51 players + 4 coaches)
