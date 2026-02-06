# HawkTrivia Database Documentation

This document provides comprehensive documentation for the HawkTrivia database schema, setup instructions, and how the database interacts with the frontend application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Schema Overview](#schema-overview)
3. [Tables Reference](#tables-reference)
4. [Data Flow & Use Cases](#data-flow--use-cases)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Seeding Data](#seeding-data)

---

## Quick Start

### Setting Up the Database

1. **Run the Complete Schema** (if not already done):
   - Go to **SQL Editor** in your Supabase dashboard
   - Copy and run `supabase/schema_complete.sql`
   - This creates all 10 tables with 51 trivia questions and 6 Super Bowl heroes

2. **Validate Schema Setup**:
   - Run `supabase/test_schema.sql` to verify all tables, functions, and triggers

3. **Add 2025 Season Data**:
   - Run `supabase/seed_2025_data.sql` for 17 players and 40 more trivia questions

4. **Add Full 2025 Rosters** (optional):
   - First run `supabase/migrations/20260205_add_image_validated.sql`
   - Then run `supabase/seed_2025_rosters.sql` for full Seahawks (58) + Patriots (55) rosters

5. **Set Up Daily Trivia Sets** (optional):
   - Run `supabase/seed_daily_trivia_sets.sql` to map 5 days to question categories

4. **Verify Environment Variables** in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

---

## Schema Overview

The database consists of **10 tables** organized into these categories:

### Core User & Auth
| Table | Purpose |
|-------|---------|
| `users` | User profiles with username-based auth |

### Trivia Content
| Table | Purpose |
|-------|---------|
| `trivia_questions` | Question bank with options and answers |
| `daily_trivia_sets` | Pre-configured question sets by day |
| `game_day_rounds` | Live synchronized game rounds |
| `daily_answers` | User responses to questions |

### Game Control
| Table | Purpose |
|-------|---------|
| `game_settings` | Singleton config for game mode/state |
| `admin_action_logs` | Audit trail for admin actions |

### Content & Social
| Table | Purpose |
|-------|---------|
| `players` | Player profiles: 2025 rosters, Super Bowl heroes, HOF legends |
| `photo_uploads` | User-uploaded fan photos |
| `photo_likes` | Photo like tracking |

### Entity Relationship Diagram

```
users (username PK, user_id UNIQUE)
  │
  ├── daily_answers ──► trivia_questions
  │
  ├── photo_uploads
  │       │
  │       └── photo_likes
  │
  └── is_admin flag for admin access

game_settings (singleton, id=1)
  │
  └── Controls: current_mode, live_question_index, is_paused

trivia_questions
  │
  ├── daily_trivia_sets (question_ids[])
  │
  └── game_day_rounds (question_ids[])

players (standalone)
admin_action_logs (standalone audit)
```

---

## Tables Reference

### 1. `users`

Stores user profiles with secure user ID authentication.

| Column | Type | Description |
|--------|------|-------------|
| `username` | TEXT (PK) | Display name (2-30 chars) |
| `user_id` | TEXT (UNIQUE) | Unique identifier (e.g., `MyName_1234`) |
| `avatar` | TEXT | Selected avatar preset |
| `is_preset_image` | BOOLEAN | Using preset vs custom image |
| `image_url` | TEXT | Custom avatar URL |
| `total_points` | INTEGER | Accumulated trivia points |
| `current_streak` | INTEGER | Consecutive correct answers |
| `days_played` | INTEGER | Number of days participated |
| `created_at` | TIMESTAMPTZ | Registration timestamp |
| `last_played_at` | TIMESTAMPTZ | Last activity timestamp |
| `is_admin` | BOOLEAN | Admin access flag (default false) |

**User ID Format**: `{username_no_spaces}_{4_random_digits}` (e.g., `LegionOfBoom_4829`)

**Valid Avatars**: `hawk`, `blitz`, `12`, `superfan`, `12th_man`, `girls_rule`, `hero`, `champion`, `trophy`, `queen`, `sparkle`, `fire`

**Auto-Update Trigger**: `total_points` and `last_played_at` are automatically updated when answers are submitted via the `update_user_stats()` trigger.

---

### 2. `trivia_questions`

Central question bank for all trivia content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique question ID |
| `question_text` | TEXT | The question itself |
| `image_url` | TEXT | Optional question image |
| `image_source` | TEXT | `web`, `generated`, or `uploaded` |
| `option_a` - `option_d` | TEXT | Four answer choices |
| `correct_answer` | TEXT | Correct option (`a`, `b`, `c`, `d`) |
| `hint_text` | TEXT | Optional hint |
| `time_limit_seconds` | INTEGER | Per-question timer (default 15) |
| `points` | INTEGER | Points for correct answer (default 100) |
| `difficulty` | TEXT | `easy`, `medium`, or `hard` |
| `category` | TEXT | Question category |
| `is_active` | BOOLEAN | Whether question is available |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Categories in seed data**:
- From `schema_complete.sql` (51 questions): Super Bowl XLVIII, Legion of Boom, Russell Wilson Era, Seahawks Legends, Stadium & 12s, Memorable Moments, Players & Numbers, Seahawks History
- From `seed_2025_data.sql` (40 questions): 2025 Season Stats, 2025 Seahawks Stars, 2025 Comparison QBs, 2025 Comparison Defense, Seahawks Hall of Fame, Super Bowl Connections

---

### 3. `daily_trivia_sets`

Pre-configured question sets for daily asynchronous play.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Set ID |
| `day_identifier` | TEXT (UNIQUE) | Day key (e.g., `day_minus_4`) |
| `display_date` | DATE | Calendar date to display |
| `question_ids` | UUID[] | Array of question IDs |
| `is_active` | BOOLEAN | Whether this set is currently active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Day Identifier Convention**: `day_minus_4`, `day_minus_3`, `day_minus_2`, `day_minus_1`, `game_day`

---

### 4. `game_day_rounds`

Live synchronized game rounds for real-time play during events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Round ID |
| `round_number` | INTEGER | Sequence number |
| `question_ids` | UUID[] | Array of question IDs for this round |
| `is_live` | BOOLEAN | Whether round is currently active |
| `started_at` | TIMESTAMPTZ | When round began |
| `ended_at` | TIMESTAMPTZ | When round finished |

---

### 5. `daily_answers`

Tracks individual user responses to trivia questions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Answer ID |
| `username` | TEXT (FK) | References users.username |
| `question_id` | UUID (FK) | Question answered |
| `day_identifier` | TEXT (NOT NULL) | Day context (e.g., 'day_minus_4') |
| `selected_answer` | TEXT | User's choice (`a`, `b`, `c`, `d`) |
| `is_correct` | BOOLEAN | Whether answer was correct |
| `points_earned` | INTEGER | Base points earned |
| `streak_bonus` | INTEGER | Bonus for streak |
| `time_taken_ms` | INTEGER | Response time in milliseconds |
| `answered_at` | TIMESTAMPTZ | Answer timestamp |

**Unique Constraint**: `UNIQUE(username, question_id, day_identifier)` - One answer per user per question per day.

---

### 6. `game_settings`

Singleton table (always id=1) controlling game state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Always 1 |
| `current_mode` | TEXT | `pre_game`, `daily`, `live`, `ended` |
| `questions_per_day` | INTEGER | Number of daily questions |
| `timer_duration` | INTEGER | Seconds per question |
| `scores_locked` | BOOLEAN | Prevent new answers |
| `current_day` | TEXT | Current day identifier |
| `live_question_index` | INTEGER | Current question in live mode |
| `is_paused` | BOOLEAN | Pause live game |
| `updated_at` | TIMESTAMPTZ | Last modification |

**Game Modes**:
- `pre_game`: Before event starts, app shows countdown
- `daily`: Asynchronous play mode, users answer at their own pace
- `live`: Synchronized play, admin controls question progression
- `ended`: Game over, scores locked, show final leaderboard

---

### 7. `admin_action_logs`

Audit trail for administrative actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Log entry ID |
| `action_type` | TEXT | Type of action |
| `target_type` | TEXT | What was affected |
| `target_id` | TEXT | Specific target ID |
| `details` | JSONB | Additional context |
| `performed_at` | TIMESTAMPTZ | When action occurred |

**Action Types**: `game_start`, `game_pause`, `game_resume`, `game_end`, `next_question`, `mode_change`

---

### 8. `players`

Player profiles including 2025 rosters (Seahawks, Patriots), Super Bowl heroes, and Hall of Fame legends.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Player ID |
| `name` | TEXT | Player name |
| `jersey_number` | INTEGER | Jersey number |
| `position` | TEXT | Playing position |
| `image_url` | TEXT | Player headshot |
| `image_validated` | BOOLEAN | Admin-verified image (default false) |
| `stats` | JSONB | Key-value stat pairs |
| `trivia` | JSONB | Array of trivia facts |
| `bio` | TEXT | Short biography |
| `super_bowl_highlight` | TEXT | Notable SB moment |
| `display_order` | INTEGER | Sort order |
| `is_active` | BOOLEAN | Show in UI |

**Stats JSONB Example**:
```json
{"Passing Yards": "206", "Touchdowns": "2", "QBR": "123.1"}
```

**Trivia JSONB Example**:
```json
["Became 2nd Black QB to win Super Bowl", "Led game-opening TD drive"]
```

---

### 9. `photo_uploads`

User-submitted fan photos for the photo gallery.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Photo ID |
| `username` | TEXT (FK) | References users.username |
| `image_url` | TEXT | Storage URL |
| `caption` | TEXT | User caption |
| `like_count` | INTEGER | Number of likes |
| `is_approved` | BOOLEAN | Admin approved |
| `is_hidden` | BOOLEAN | Hidden by admin |
| `created_at` | TIMESTAMPTZ | Upload timestamp |

**Auto-Update Trigger**: `like_count` is automatically updated when likes are added/removed via the `update_photo_like_count()` trigger.

---

### 10. `photo_likes`

Tracks which users liked which photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Like ID |
| `photo_id` | UUID (FK) | Photo that was liked |
| `username` | TEXT (FK) | References users.username |
| `created_at` | TIMESTAMPTZ | Like timestamp |

**Unique Constraint**: One like per user per photo.

---

## Data Flow & Use Cases

### User Registration Flow

```
1. User enters username → Frontend calls POST /api/register
2. API checks if username already exists → returns error if taken
3. API generates unique user_id: {username_no_spaces}_{4_random_digits}
4. API inserts into `users` table (user_id, username, avatar, is_preset_image)
5. API returns user data with user_id and initial stats (0 points, 0 streak)
6. Frontend stores user object (including user_id) in localStorage
```

### User Sign In Flow (Recovery)

```
1. User enters their user_id → Frontend calls POST /api/signin
2. API looks up user by user_id
3. If found, returns user data
4. Frontend stores user object in localStorage
```

### Daily Trivia Flow

```
1. Frontend calls GET /api/trivia/daily (with x-username header)
2. API reads `game_settings.current_day` to get day_identifier
3. API fetches questions from `trivia_questions` (is_active = true)
4. API strips `correct_answer` before returning to frontend
5. User answers → Frontend calls POST /api/trivia/daily/answer
6. API inserts into `daily_answers` with is_correct, points_earned
7. Trigger auto-updates `users.total_points`
```

### Live Game Flow (Admin Controlled)

```
1. Admin clicks "Start Live" → POST /api/admin/game/start
2. API sets game_settings.current_mode = 'live'
3. API sets game_day_rounds.is_live = true
4. Frontend polls GET /api/trivia/live every 2-3 seconds
5. Admin clicks "Next Question" → POST /api/admin/game/next-question
6. API increments game_settings.live_question_index
7. All connected clients see new question
8. Admin clicks "End Game" → POST /api/admin/game/end
9. API sets current_mode = 'ended', scores_locked = true
```

### Leaderboard Flow

```
1. Frontend calls GET /api/scoreboard
2. API calls get_leaderboard() function
3. Function returns users ordered by total_points DESC
4. Frontend displays with ranks, avatars, and scores
```

---

## API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register` | POST | Register new user (generates user_id) |
| `/api/signin` | POST | Sign in with user_id |
| `/api/user?user_id=X` | GET | Get user by user_id |
| `/api/user?username=X` | GET | Get user by username |
| `/api/trivia/daily` | GET | Get today's questions |
| `/api/trivia/daily/answer` | POST | Submit answer |
| `/api/trivia/live` | GET | Get live game state |
| `/api/scoreboard` | GET | Get leaderboard |
| `/api/players` | GET | Get player profiles |
| `/api/photos` | GET/POST | Photo gallery |
| `/api/photos/[photoId]/like` | POST/DELETE | Like/unlike photo |

### Admin Endpoints (require auth header)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/game` | GET/POST | Get/update game settings |
| `/api/admin/game/start` | POST | Start live game mode |
| `/api/admin/game/pause` | POST | Pause/resume game |
| `/api/admin/game/next-question` | POST | Advance to next question |
| `/api/admin/game/end` | POST | End game, lock scores |

---

## Frontend Integration

### Key Components and Their Data Sources

| Component | API Endpoint | Data Used |
|-----------|-------------|-----------|
| `ScoreBoard` | `/api/scoreboard` | Users ranked by total_points |
| `TriviaGame` | `/api/trivia/daily` | Questions without answers |
| `LiveGame` | `/api/trivia/live` | Current question, game state |
| `PlayerCards` | `/api/players` | Player stats, trivia, highlights |
| `PhotoGallery` | `/api/photos` | Approved photos with like counts |
| `AdminConsole` | `/api/admin/game` | Game settings, mode control |

### SWR Data Fetching Pattern

The frontend uses SWR for data fetching with automatic revalidation:

```typescript
// Example: Scoreboard with auto-refresh
const { data } = useSWR('/api/scoreboard', fetcher, {
  refreshInterval: 30000, // Refresh every 30 seconds
  revalidateOnFocus: true
})
```

### Real-Time Updates (Polling)

For live game mode, the frontend polls every 2-3 seconds:

```typescript
// Live game polling
const { data } = useSWR(
  gameMode === 'live' ? '/api/trivia/live' : null,
  fetcher,
  { refreshInterval: 2000 }
)
```

---

## Seeding Data

### Initial Setup: `schema_complete.sql`

Creates all 10 tables and includes:
- 6 Super Bowl XLVIII heroes (Wilson, Lynch, Sherman, Smith, Thomas, Chancellor)
- 51 trivia questions across 8 categories
- All functions, triggers, and RLS policies
- Default game_settings row (singleton)

### Extended Data: `seed_2025_data.sql`

Run after schema_complete.sql to add:
- 2025 Seahawks offense (5): Darnold, JSN, Walker, Myers, Dickson
- 2025 Seahawks defense (4): Witherspoon, Mafe, Williams, Love
- 2025 Seahawks coach (1): Macdonald
- Comparison QBs (2): Maye, Stafford
- Super Bowl XLVIII heroes (6): Wilson, Lynch, Sherman, Smith, Thomas, Chancellor
- Super Bowl XLIX context (1): Brady
- Hall of Fame legends (4): Largent, Kennedy, Jones, Easley
- 40 additional trivia questions across 7 new categories

### Full Rosters: `seed_2025_rosters.sql`

Run after seed_2025_data.sql (and `migrations/20260205_add_image_validated.sql`) to add:
- **Seahawks**: 53 players + 5 coaches (display_order 1-58)
- **Patriots**: 51 players + 4 coaches (display_order 101-170)
- Source: official team roster pages (Feb 5, 2026)

### Daily Trivia Sets: `seed_daily_trivia_sets.sql`

Maps day identifiers to question categories:
- `day_minus_4`: Super Bowl XLVIII (10 questions)
- `day_minus_3`: Legion of Boom (6 questions)
- `day_minus_2`: 2025 Season Stats (8 questions)
- `day_minus_1`: 2025 Comparison QBs (6 questions)
- `game_day`: 2025 Comparison Defense (8 questions)

### Re-seeding Trivia Questions

To add more questions without affecting other data:

```sql
-- Insert new questions
INSERT INTO trivia_questions
  (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category)
VALUES
  ('Your question here?', 'Option A', 'Option B', 'Option C', 'Option D', 'a', 'medium', 'Your Category');
```

### Resetting User Data

To clear all user data while preserving content:

```sql
-- Clear answers and reset user points (preserves questions and players)
DELETE FROM daily_answers;
UPDATE users SET total_points = 0, current_streak = 0, days_played = 0;
```

---

## Row Level Security (RLS)

All tables have RLS enabled with these policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | Public | Public | Public | - |
| trivia_questions | Active only | - | - | - |
| daily_trivia_sets | Active only | - | - | - |
| game_day_rounds | Public | - | - | - |
| daily_answers | Public | Public | - | - |
| photo_uploads | Approved only | Public | - | - |
| photo_likes | Public | Public | - | Public |
| players | Active only | - | - | - |
| game_settings | Public | - | - | - |

**Note**: Admin operations bypass RLS using the service role key.

---

## Database Functions

### `get_leaderboard(p_limit INTEGER)`

Returns top N users by total_points:

```sql
SELECT * FROM get_leaderboard(50);
```

Returns: rank, user_id, username, avatar, total_points, current_streak, days_played

### `update_user_stats()`

Trigger function that runs after INSERT on `daily_answers`:
- Looks up user by `username` (FK from daily_answers)
- Adds `points_earned + streak_bonus` to user's `total_points`
- Increments `days_played` if it's a new day
- Updates `last_played_at` timestamp

### `update_photo_like_count()`

Trigger function that runs after INSERT/DELETE on `photo_likes`:
- Increments/decrements `like_count` on the associated photo

### `update_photo_likes()` (legacy)

Older version of photo like count function, still present in database.

### `get_team_total_points(team_id UUID)` (legacy)

Legacy function from team-based schema. Still present in database but not used by current API routes.

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/schema_complete.sql` | Complete schema (10 tables) + 51 questions + 6 Super Bowl heroes (run first) |
| `supabase/seed_2025_data.sql` | 2025 players (17) + 40 trivia questions across 7 new categories |
| `supabase/seed_2025_rosters.sql` | Full 2025 rosters: Seahawks (53 players + 5 coaches) + Patriots (51 players + 4 coaches) |
| `supabase/seed_daily_trivia_sets.sql` | Maps day identifiers to question sets (5 days) |
| `supabase/test_schema.sql` | Validation queries to verify schema setup |
| `supabase/migrations/20260204_add_user_id_and_admin.sql` | Adds user_id UNIQUE column and is_admin flag |
| `supabase/migrations/20260205_update_patriots_roster.sql` | Updates Patriots stats + adds 24 additional roster players |
| `supabase/migrations/20260205_add_image_validated.sql` | Adds image_validated column to players table |
| `lib/database.types.ts` | TypeScript type definitions |
| `lib/supabase.ts` | Supabase client initialization |
| `FRONTEND_GUIDE.md` | Frontend integration guide with code examples |

---

## Known Schema File vs Live Database Discrepancy

The live database uses `username` as the FK column in `daily_answers`, `photo_uploads`, and `photo_likes`. The TypeScript types and API routes correctly use `username`. However, `supabase/schema_complete.sql` defines these columns as `user_id` instead.

| What | FK Column | Status |
|------|-----------|--------|
| **Live database** | `username` | Correct (source of truth) |
| **TypeScript types** (`lib/database.types.ts`) | `username` | Correct |
| **API routes** | `username` | Correct |
| **`schema_complete.sql`** | `user_id` | Out of sync - needs update |

**Background**: The live database was set up before `schema_complete.sql` was written. The `user_id` column was added to the `users` table via migration (`20260204_add_user_id_and_admin.sql`) as a UNIQUE column, but the FK migration steps for `daily_answers`, `photo_uploads`, and `photo_likes` were never applied (they are commented out in that migration). The `username` column remains the PK of `users` and the FK reference for all related tables.

**If doing a fresh setup**: Run `schema_complete.sql` but be aware it uses `user_id` FKs which won't match the API routes. Either update the schema file or update the API routes after setup.

---

*Last updated: February 2026*
