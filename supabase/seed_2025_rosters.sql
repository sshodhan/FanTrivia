-- ============================================
-- SEED DATA: 2025 Full Rosters (Seahawks + Patriots)
-- 24 players each: Offense, Defense, Special Teams
-- Run this AFTER schema_user.sql
-- ============================================

-- Clear existing 2025 players to avoid duplicates
DELETE FROM players WHERE display_order BETWEEN 1 AND 50;
DELETE FROM players WHERE display_order BETWEEN 100 AND 150;

-- ============================================
-- 2025 SEAHAWKS - Super Bowl LX Roster (24 players)
-- display_order: 1-24
-- ============================================

-- OFFENSE (12 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Sam Darnold', 14, 'Quarterback', 1,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3912547.png',
  'Seahawks QB - 2025 Season',
  '{"Pass Yds": "4,048", "Pass TD": "25", "INT": "14", "Rating": "99.1", "CMP%": "67.7%", "Record": "14-3"}'::jsonb,
  '["Led Seahawks to 14-3 record and Super Bowl LX", "Signed after breakout 2024 season in Minnesota", "Second QB in NFL history with 14-3 record after Tom Brady", "470 yards, 4 TDs, 0 INTs in first two playoff games"]'::jsonb,
  true
),
(
  'Kenneth Walker III', 9, 'Running Back', 2,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4567048.png',
  'Seahawks RB1 - 2025 Season',
  '{"Rush Yds": "1,027", "Rush TD": "9", "Carries": "221", "Yds/Carry": "4.6", "Receptions": "31"}'::jsonb,
  '["Rushed for over 1,000 yards in 2025", "4 rushing TDs in final two playoff games", "2022 second-round pick from Michigan State", "Career-high 1,309 scrimmage yards"]'::jsonb,
  true
),
(
  'Zach Charbonnet', 26, 'Running Back', 3,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4242335.png',
  'Seahawks RB2 - 2025 Season',
  '{"Rush Yds": "582", "Rush TD": "6", "Rec Yds": "245", "Yds/Carry": "4.8", "Receptions": "28"}'::jsonb,
  '["UCLA product drafted in 2023", "Key short-yardage and receiving back", "Excellent pass blocker", "Versatile complement to Walker"]'::jsonb,
  true
),
(
  'Jaxon Smith-Njigba', 11, 'Wide Receiver', 4,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4430878.png',
  'Seahawks WR - 2025 NFL Receiving Leader',
  '{"Receptions": "119", "Rec Yds": "1,793", "Rec TD": "10", "Yds/Rec": "15.1", "Targets": "163"}'::jsonb,
  '["Led NFL in receiving yards with 1,793", "Set Seahawks single-season receiving record", "2023 first-round pick from Ohio State", "10 catches for 153 yards in NFC Championship"]'::jsonb,
  true
),
(
  'DK Metcalf', 14, 'Wide Receiver', 5,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4047650.png',
  'Seahawks WR - Deep Threat',
  '{"Receptions": "78", "Rec Yds": "1,087", "Rec TD": "8", "Yds/Rec": "13.9", "Long": "62"}'::jsonb,
  '["6-foot-4 with 4.33 speed", "Dominant red zone target with 8 TDs", "Known for chasedown tackle in 2020", "2019 second-round pick from Ole Miss"]'::jsonb,
  true
),
(
  'Tyler Lockett', 16, 'Wide Receiver', 6,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2577327.png',
  'Seahawks WR - Veteran Leader',
  '{"Receptions": "62", "Rec Yds": "758", "Rec TD": "5", "Yds/Rec": "12.2", "3rd Down Catches": "24"}'::jsonb,
  '["10th season with Seahawks", "Kansas State legend", "Clutch third-down receptions in playoffs", "3-time Pro Bowl selection"]'::jsonb,
  true
),
(
  'Noah Fant', 87, 'Tight End', 7,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4035687.png',
  'Seahawks TE - 2025 Season',
  '{"Receptions": "48", "Rec Yds": "526", "Rec TD": "4", "Yds/Rec": "11.0", "First Downs": "28"}'::jsonb,
  '["Acquired in Russell Wilson trade", "Iowa product with elite athleticism", "Key middle-of-field target", "Former first-round pick"]'::jsonb,
  true
),
(
  'Charles Cross', 67, 'Offensive Tackle', 8,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4426354.png',
  'Seahawks LT - 2025 Season',
  '{"Sacks Allowed": "3", "Pressures": "18", "PFF Grade": "82.4", "Snaps": "1,105", "Penalties": "4"}'::jsonb,
  '["2022 first-round pick", "Mississippi State standout", "Protecting Darnolds blind side", "Started all 17 games"]'::jsonb,
  true
),
(
  'Laken Tomlinson', 75, 'Guard', 9,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2576414.png',
  'Seahawks LG - 2025 Season',
  '{"Sacks Allowed": "1", "Pressures": "12", "PFF Grade": "78.2", "Snaps": "1,105", "Penalties": "3"}'::jsonb,
  '["Pro Bowl selection in 2021", "Duke product", "Veteran leadership on the line", "Signed from 49ers in 2022"]'::jsonb,
  true
),
(
  'Olu Oluwatimi', 65, 'Center', 10,
  NULL,
  'Seahawks C - 2025 Season',
  '{"Sacks Allowed": "0", "Pressures": "8", "PFF Grade": "75.8", "Snaps": "1,088", "Penalties": "2"}'::jsonb,
  '["2023 Rimington Trophy winner at Michigan", "Graduate transfer success story", "Anchoring the offensive line", "Started all 17 games at center"]'::jsonb,
  true
),
(
  'Anthony Bradford', 73, 'Guard', 11,
  NULL,
  'Seahawks RG - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "16", "PFF Grade": "72.1", "Snaps": "1,088", "Penalties": "4"}'::jsonb,
  '["LSU product", "Known for nasty streak", "Power run blocking specialist", "2023 fourth-round pick"]'::jsonb,
  true
),
(
  'Abraham Lucas', 72, 'Offensive Tackle', 12,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4361741.png',
  'Seahawks RT - 2025 Season',
  '{"Sacks Allowed": "4", "Pressures": "22", "PFF Grade": "76.5", "Snaps": "1,088", "Penalties": "5"}'::jsonb,
  '["Washington State product", "2022 third-round pick", "Returned strong from 2024 knee injury", "Started all 17 games"]'::jsonb,
  true
);

-- DEFENSE (10 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Leonard Williams', 99, 'Defensive End', 13,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2976212.png',
  'Seahawks DE - 2025 Season',
  '{"Sacks": "9.5", "Tackles": "58", "TFL": "12", "QB Hits": "24", "Pressures": "52"}'::jsonb,
  '["2-time Pro Bowl selection", "USC product", "Dominant interior pass rusher", "Former 6th overall pick"]'::jsonb,
  true
),
(
  'Jarran Reed', 90, 'Defensive Tackle', 14,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3054850.png',
  'Seahawks DT - 2025 Season',
  '{"Sacks": "5.5", "Tackles": "42", "TFL": "8", "QB Hits": "14", "Run Stuffs": "12"}'::jsonb,
  '["Alabama national champion", "Returned to Seattle in 2023", "Run-stuffing anchor", "2016 second-round pick"]'::jsonb,
  true
),
(
  'Dremont Jones', 93, 'Defensive End', 15,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3916387.png',
  'Seahawks DE - 2025 Season',
  '{"Sacks": "7.0", "Tackles": "45", "TFL": "10", "QB Hits": "18", "Pressures": "38"}'::jsonb,
  '["Ohio State product", "Signed from Denver in 2023", "Versatile interior defender", "2019 third-round pick"]'::jsonb,
  true
),
(
  'Boye Mafe', 53, 'Edge Rusher', 16,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4361418.png',
  'Seahawks EDGE - 2025 Pro Bowl',
  '{"Sacks": "11.5", "Tackles": "48", "TFL": "14", "FF": "3", "QB Hits": "28"}'::jsonb,
  '["Minnesota product", "2022 second-round pick", "Breakout pass rusher with double-digit sacks", "2025 Pro Bowl selection"]'::jsonb,
  true
),
(
  'Tyrel Dodson', 51, 'Linebacker', 17,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3921688.png',
  'Seahawks LB - Defensive Captain',
  '{"Tackles": "124", "Sacks": "2.5", "INT": "2", "Pass Def": "8", "TFL": "6"}'::jsonb,
  '["Texas A&M product", "Team defensive leader", "Leading tackler and signal caller", "Signed from Bills in 2024"]'::jsonb,
  true
),
(
  'Jerome Baker', 56, 'Linebacker', 18,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3116365.png',
  'Seahawks LB - 2025 Season',
  '{"Tackles": "98", "Sacks": "3.0", "INT": "1", "Pass Def": "6", "TFL": "5"}'::jsonb,
  '["Ohio State product", "Formerly with Miami Dolphins", "Coverage linebacker excellence", "2018 third-round pick"]'::jsonb,
  true
),
(
  'Devon Witherspoon', 21, 'Cornerback', 19,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4429013.png',
  'Seahawks CB - 2025 All-Pro',
  '{"Tackles": "68", "INT": "4", "Pass Def": "16", "Passer Rating Allowed": "52.3", "Targets": "78"}'::jsonb,
  '["2023 DROY finalist", "Illinois product", "Shutdown corner allowing lowest passer rating", "2023 first-round pick"]'::jsonb,
  true
),
(
  'Riq Woolen', 27, 'Cornerback', 20,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4379394.png',
  'Seahawks CB - 2025 Season',
  '{"Tackles": "52", "INT": "3", "Pass Def": "12", "Passer Rating Allowed": "68.4", "Targets": "62"}'::jsonb,
  '["6-foot-4 with 4.26 speed", "UTSA product", "Ball-hawking corner with elite length", "2022 fifth-round pick"]'::jsonb,
  true
),
(
  'Julian Love', 37, 'Safety', 21,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3929856.png',
  'Seahawks S - 2025 Season',
  '{"Tackles": "89", "INT": "3", "Pass Def": "8", "TFL": "4", "FF": "1"}'::jsonb,
  '["Notre Dame product", "Signed from Giants in 2023", "Versatile safety making impact plays", "2019 fourth-round pick"]'::jsonb,
  true
),
(
  'Rayshawn Jenkins', 2, 'Safety', 22,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2979501.png',
  'Seahawks S - 2025 Season',
  '{"Tackles": "76", "INT": "2", "Pass Def": "5", "FF": "2", "TFL": "3"}'::jsonb,
  '["Miami (FL) product", "Veteran leader", "Hard-hitting enforcer in secondary", "Signed from Jaguars in 2023"]'::jsonb,
  true
);

-- SPECIAL TEAMS (2 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Jason Myers', 5, 'Kicker', 23,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2515934.png',
  'Seahawks K - 2025 Season',
  '{"FG%": "92.3%", "FG Made": "24/26", "XP%": "100%", "Long": "56", "Points": "168"}'::jsonb,
  '["Pro Bowl selection in 2018", "Marist College product", "Automatic from 50+ yards", "Perfect on extra points"]'::jsonb,
  true
),
(
  'Michael Dickson', 4, 'Punter', 24,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3122899.png',
  'Seahawks P - 2025 Pro Bowl',
  '{"Avg": "48.2", "Net": "44.1", "Inside 20": "28", "Long": "64", "Touchbacks": "4"}'::jsonb,
  '["2018 Ray Guy Award winner", "Australian-born", "Elite punter flipping field position", "2025 Pro Bowl selection"]'::jsonb,
  true
);


-- ============================================
-- 2025 PATRIOTS - Super Bowl LX Opponent (24 players)
-- display_order: 101-124
-- ============================================

-- OFFENSE (12 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Drake Maye', 10, 'Quarterback', 101,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4432577.png',
  'Patriots QB - 2025 Season',
  '{"Pass Yds": "3,892", "Pass TD": "28", "INT": "10", "Rating": "96.4", "CMP%": "68.2%", "Record": "12-5"}'::jsonb,
  '["2024 first-round pick from North Carolina", "Youngest QB in franchise history to start Super Bowl", "Led Patriots to first playoff berth since 2021", "Second consecutive Pro Bowl selection"]'::jsonb,
  true
),
(
  'Rhamondre Stevenson', 38, 'Running Back', 102,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4259545.png',
  'Patriots RB1 - 2025 Season',
  '{"Rush Yds": "1,156", "Rush TD": "8", "Rec Yds": "421", "Total Yds": "1,577", "Yds/Carry": "4.4"}'::jsonb,
  '["Oklahoma product", "Elite pass-catching running back", "Workhorse back powering Patriots playoff run", "Over 1,500 yards from scrimmage"]'::jsonb,
  true
),
(
  'Antonio Gibson', 21, 'Running Back', 103,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4039359.png',
  'Patriots RB2 - 2025 Season',
  '{"Rush Yds": "445", "Rush TD": "4", "Rec Yds": "312", "Total Yds": "757", "Yds/Carry": "4.8"}'::jsonb,
  '["Memphis product", "Former Washington Commander", "Explosive change-of-pace back", "Signed in 2024 free agency"]'::jsonb,
  true
),
(
  'JaLynn Polk', 1, 'Wide Receiver', 104,
  NULL,
  'Patriots WR1 - 2025 Season',
  '{"Receptions": "72", "Rec Yds": "1,012", "Rec TD": "7", "Yds/Rec": "14.1", "Targets": "108"}'::jsonb,
  '["2024 second-round pick from Washington", "Deep threat specialist", "Sophomore breakout with 1,000+ yards", "Led team in receiving yards"]'::jsonb,
  true
),
(
  'DeMario Douglas', 3, 'Wide Receiver', 105,
  NULL,
  'Patriots WR2 - 2025 Season',
  '{"Receptions": "68", "Rec Yds": "824", "Rec TD": "5", "Yds/Rec": "12.1", "Targets": "92"}'::jsonb,
  '["Liberty product", "Led team in receptions as rookie in 2023", "Slot receiver with elite quickness", "Undrafted gem"]'::jsonb,
  true
),
(
  'Kendrick Bourne', 84, 'Wide Receiver', 106,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3042876.png',
  'Patriots WR3 - 2025 Season',
  '{"Receptions": "45", "Rec Yds": "612", "Rec TD": "4", "Yds/Rec": "13.6", "YAC": "285"}'::jsonb,
  '["Eastern Washington product", "Known for infectious energy", "Veteran leader and YAC specialist", "Signed from 49ers in 2021"]'::jsonb,
  true
),
(
  'Hunter Henry', 85, 'Tight End', 107,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3051889.png',
  'Patriots TE - 2025 Season',
  '{"Receptions": "58", "Rec Yds": "642", "Rec TD": "6", "Yds/Rec": "11.1", "Red Zone Targets": "18"}'::jsonb,
  '["Arkansas product", "2016 second-round pick", "Red zone weapon with sure hands", "Team leader in TD receptions"]'::jsonb,
  true
),
(
  'Caedan Wallace', 76, 'Offensive Tackle', 108,
  NULL,
  'Patriots LT - 2025 Season',
  '{"Sacks Allowed": "4", "Pressures": "24", "PFF Grade": "74.8", "Snaps": "1,088", "Penalties": "6"}'::jsonb,
  '["Penn State product", "2024 third-round pick", "Protecting Mayes blind side", "Started all 17 games as rookie"]'::jsonb,
  true
),
(
  'Cole Strange', 69, 'Guard', 109,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4036348.png',
  'Patriots LG - 2025 Season',
  '{"Sacks Allowed": "1", "Pressures": "14", "PFF Grade": "79.2", "Snaps": "1,105", "Penalties": "3"}'::jsonb,
  '["Chattanooga product", "2022 first-round pick", "Mauling run blocker", "Team captain"]'::jsonb,
  true
),
(
  'David Andrews', 60, 'Center', 110,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2577134.png',
  'Patriots C - Team Captain',
  '{"Sacks Allowed": "1", "Pressures": "10", "PFF Grade": "82.1", "Snaps": "1,105", "Penalties": "2"}'::jsonb,
  '["Georgia product", "Undrafted success story", "Veteran leader and line anchor", "10th season with Patriots"]'::jsonb,
  true
),
(
  'Mike Onwenu', 71, 'Guard', 111,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3915483.png',
  'Patriots RG - 2025 Season',
  '{"Sacks Allowed": "2", "Pressures": "12", "PFF Grade": "81.4", "Snaps": "1,088", "Penalties": "2"}'::jsonb,
  '["Michigan product", "Pro Bowl caliber", "Elite pass protector", "2020 sixth-round pick"]'::jsonb,
  true
),
(
  'Vederian Lowe', 73, 'Offensive Tackle', 112,
  NULL,
  'Patriots RT - 2025 Season',
  '{"Sacks Allowed": "5", "Pressures": "28", "PFF Grade": "71.2", "Snaps": "1,088", "Penalties": "7"}'::jsonb,
  '["Illinois product", "Started all 17 games", "Physical run blocker on right side", "2022 sixth-round pick"]'::jsonb,
  true
);

-- DEFENSE (10 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Keion White', 94, 'Defensive End', 113,
  NULL,
  'Patriots DE - 2025 Breakout Star',
  '{"Sacks": "10.5", "Tackles": "52", "TFL": "14", "QB Hits": "22", "Pressures": "48"}'::jsonb,
  '["Georgia Tech product", "2023 second-round pick", "Elite pass rusher with double-digit sacks", "Breakout star in third season"]'::jsonb,
  true
),
(
  'Davon Godchaux', 92, 'Defensive Tackle', 114,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3052897.png',
  'Patriots DT - 2025 Season',
  '{"Sacks": "3.5", "Tackles": "48", "TFL": "9", "Run Stuffs": "14", "QB Hits": "8"}'::jsonb,
  '["LSU product", "Signed from Miami in 2021", "Run-stuffing nose tackle", "Team captain"]'::jsonb,
  true
),
(
  'Christian Barmore', 90, 'Defensive Tackle', 115,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4360238.png',
  'Patriots DT - 2025 Season',
  '{"Sacks": "6.0", "Tackles": "38", "TFL": "11", "QB Hits": "16", "Pressures": "42"}'::jsonb,
  '["Alabama product", "2021 second-round pick", "Interior pass rush dominance", "Pro Bowl caliber"]'::jsonb,
  true
),
(
  'Matthew Judon', 9, 'Edge Rusher', 116,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2576492.png',
  'Patriots EDGE - 2025 Pro Bowl',
  '{"Sacks": "12.5", "Tackles": "52", "TFL": "15", "FF": "3", "QB Hits": "30"}'::jsonb,
  '["4-time Pro Bowl selection", "Grand Valley State product", "Veteran edge rusher leading defense", "Team sack leader"]'::jsonb,
  true
),
(
  'JaWhaun Bentley', 8, 'Linebacker', 117,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3116158.png',
  'Patriots LB - Team Captain',
  '{"Tackles": "118", "Sacks": "2.0", "INT": "1", "Pass Def": "6", "TFL": "8"}'::jsonb,
  '["Purdue product", "Team leader in tackles", "Defensive signal caller", "7th season with Patriots"]'::jsonb,
  true
),
(
  'Jahlani Tavai', 48, 'Linebacker', 118,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3895836.png',
  'Patriots LB - 2025 Season',
  '{"Tackles": "86", "Sacks": "1.5", "INT": "0", "Pass Def": "4", "TFL": "5"}'::jsonb,
  '["Hawaii product", "Originally drafted by Detroit", "Versatile linebacker excelling in coverage", "Signed in 2022"]'::jsonb,
  true
),
(
  'Christian Gonzalez', 0, 'Cornerback', 119,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4426354.png',
  'Patriots CB - 2025 All-Pro',
  '{"Tackles": "58", "INT": "5", "Pass Def": "14", "Passer Rating Allowed": "48.2", "Targets": "72"}'::jsonb,
  '["Oregon product", "2023 first-round pick", "Elite shutdown corner anchoring secondary", "First-team All-Pro in 2025"]'::jsonb,
  true
),
(
  'Jonathan Jones', 31, 'Cornerback', 120,
  'https://a.espncdn.com/i/headshots/nfl/players/full/2578265.png',
  'Patriots CB - 2025 Season',
  '{"Tackles": "62", "INT": "2", "Pass Def": "10", "Passer Rating Allowed": "72.4", "Targets": "58"}'::jsonb,
  '["Auburn product", "Elite special teams player", "Veteran corner with playoff experience", "9th season with Patriots"]'::jsonb,
  true
),
(
  'Kyle Dugger', 23, 'Safety', 121,
  'https://a.espncdn.com/i/headshots/nfl/players/full/4035222.png',
  'Patriots S - 2025 Pro Bowl',
  '{"Tackles": "92", "INT": "3", "Sacks": "2.0", "Pass Def": "6", "FF": "2"}'::jsonb,
  '["Lenoir-Rhyne product", "2020 second-round pick", "Hard-hitting safety and team leader", "2025 Pro Bowl selection"]'::jsonb,
  true
),
(
  'Jabrill Peppers', 3, 'Safety', 122,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3052896.png',
  'Patriots S - 2025 Season',
  '{"Tackles": "78", "INT": "2", "Sacks": "1.0", "FF": "2", "Pass Def": "5"}'::jsonb,
  '["Michigan product", "Former first-round pick", "Versatile safety with big-play ability", "Signed in 2024"]'::jsonb,
  true
);

-- SPECIAL TEAMS (2 players)
INSERT INTO players (name, jersey_number, position, display_order, image_url, bio, stats, trivia, is_active) VALUES
(
  'Joey Slye', 6, 'Kicker', 123,
  'https://a.espncdn.com/i/headshots/nfl/players/full/3051302.png',
  'Patriots K - 2025 Season',
  '{"FG%": "88.5%", "FG Made": "23/26", "XP%": "97.1%", "Long": "58", "Points": "152"}'::jsonb,
  '["Virginia Tech product", "Known for 50+ yard range", "Big leg and clutch performer", "Signed in 2024"]'::jsonb,
  true
),
(
  'Bryce Baringer', 17, 'Punter', 124,
  NULL,
  'Patriots P - 2025 Season',
  '{"Avg": "47.8", "Net": "43.2", "Inside 20": "24", "Long": "62", "Touchbacks": "6"}'::jsonb,
  '["Michigan State product", "2023 sixth-round pick", "Elite hang time and directional punting", "Ray Guy Award finalist in college"]'::jsonb,
  true
);

-- ============================================
-- Verify counts
-- ============================================
-- SELECT 'Seahawks 2025' as category, COUNT(*) FROM players WHERE display_order BETWEEN 1 AND 30;
-- SELECT 'Patriots 2025' as category, COUNT(*) FROM players WHERE display_order BETWEEN 100 AND 130;
