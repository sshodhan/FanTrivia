-- ============================================
-- SEED DATA: 2025 Full Rosters (Seahawks + Patriots)
-- Seahawks: 24 players + 5 coaches (display_order 1-29)
-- Patriots: 24 players + 4 coaches (display_order 101-128)
-- Updated: Feb 5, 2026 - Official roster from seahawks.com
-- Run this AFTER schema_user.sql AND migrations/20260205_add_image_validated.sql
-- ============================================

-- Clear existing 2025 players to avoid duplicates
DELETE FROM players WHERE display_order BETWEEN 1 AND 50;
DELETE FROM players WHERE display_order BETWEEN 100 AND 150;

-- ============================================
-- 2025 SEAHAWKS - Super Bowl LX Roster (24 players + 5 coaches)
-- display_order: 1-29
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
  '{"Tackles": "89", "INT": "3", "Pass Def": "8", "TFL": "4", "FF": "1"}'::jsonb,
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
  '{"FG%": "92.3%", "FG Made": "24/26", "XP%": "100%", "Long": "56", "Points": "168"}'::jsonb,
  '["Pro Bowl selection in 2018", "Marist College product", "Automatic from 50+ yards", "Perfect on extra points"]'::jsonb,
  true
),
(
  'Michael Dickson', 4, 'Punter', 24,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3122899.png', false,
  'Seahawks P - 2025 Pro Bowl',
  '{"Avg": "48.2", "Net": "44.1", "Inside 20": "28", "Long": "64", "Touchbacks": "4"}'::jsonb,
  '["2018 Ray Guy Award winner", "Australian-born", "Elite punter flipping field position", "2025 Pro Bowl selection"]'::jsonb,
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
-- 2025 PATRIOTS - Super Bowl LX Opponent (24 players + 4 coaches)
-- display_order: 101-128
-- Updated with 2025 FA acquisitions: Diggs, Landry, Spillane, Davis, Henderson
-- ============================================

-- OFFENSE (12 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, image_validated, bio, stats, trivia, is_active) VALUES
(
  'Drake Maye', 10, 'Quarterback', 101,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4432577.png', false,
  'Patriots QB - 2025 Season',
  '{"Pass Yds": "3,892", "Pass TD": "28", "INT": "10", "Rating": "96.4", "CMP%": "68.2%", "Record": "12-5"}'::jsonb,
  '["2024 first-round pick from North Carolina", "Youngest QB in franchise history to start Super Bowl", "Led Patriots to first playoff berth since 2021", "Second consecutive Pro Bowl selection"]'::jsonb,
  true
),
(
  'Rhamondre Stevenson', 38, 'Running Back', 102,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4259545.png', false,
  'Patriots RB1 - 2025 Season',
  '{"Rush Yds": "1,156", "Rush TD": "8", "Rec Yds": "421", "Total Yds": "1,577", "Yds/Carry": "4.4"}'::jsonb,
  '["Oklahoma product", "Elite pass-catching running back", "Workhorse back powering Patriots playoff run", "Over 1,500 yards from scrimmage"]'::jsonb,
  true
),
(
  'TreVeyon Henderson', 28, 'Running Back', 103,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4567675.png', false,
  'Patriots RB2 - 2025 Season',
  '{"Rush Yds": "512", "Rush TD": "5", "Rec Yds": "285", "Total Yds": "797", "Yds/Carry": "5.1"}'::jsonb,
  '["2025 second-round pick from Ohio State", "Dynamic speed back with home-run ability", "Explosive complement to Stevenson", "Averaged 6.1 YPC in college career"]'::jsonb,
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
  'Stefon Diggs', 14, 'Wide Receiver', 106,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2976212.png', false,
  'Patriots WR - 2025 Season',
  '{"Receptions": "82", "Rec Yds": "1,108", "Rec TD": "9", "Yds/Rec": "13.5", "Targets": "124"}'::jsonb,
  '["4-time Pro Bowl selection", "Maryland product", "Elite route runner signed in 2025 free agency", "Over 1,000 receiving yards for 5th straight season"]'::jsonb,
  true
),
(
  'Hunter Henry', 85, 'Tight End', 107,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3051889.png', false,
  'Patriots TE - 2025 Season',
  '{"Receptions": "58", "Rec Yds": "642", "Rec TD": "6", "Yds/Rec": "11.1", "Red Zone Targets": "18"}'::jsonb,
  '["Arkansas product", "2016 second-round pick", "Red zone weapon with sure hands", "Team leader in TD receptions"]'::jsonb,
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
);

-- DEFENSE (10 players)
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
  'https://a.espncdn.com/i/headshots/nfl/players/full/3128685.png', false,
  'Patriots LB - 2025 Season',
  '{"Tackles": "102", "Sacks": "2.5", "INT": "2", "Pass Def": "7", "TFL": "8"}'::jsonb,
  '["Western Michigan product", "Signed from Raiders in 2025 free agency", "Physical downhill linebacker", "Over 100 tackles in second Patriots season"]'::jsonb,
  true
),
(
  'Christian Gonzalez', 0, 'Cornerback', 119,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4426354.png', false,
  'Patriots CB - 2025 All-Pro',
  '{"Tackles": "58", "INT": "5", "Pass Def": "14", "Passer Rating Allowed": "48.2", "Targets": "72"}'::jsonb,
  '["Oregon product", "2023 first-round pick", "Elite shutdown corner anchoring secondary", "First-team All-Pro in 2025"]'::jsonb,
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
-- SELECT 'Seahawks 2025' as category, COUNT(*) FROM players WHERE display_order BETWEEN 1 AND 30;
-- SELECT 'Patriots 2025' as category, COUNT(*) FROM players WHERE display_order BETWEEN 100 AND 130;
