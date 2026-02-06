# Database Documentation

## Overview

HawkTrivia uses **Supabase** (PostgreSQL) as its database backend. The schema supports user registration, trivia gameplay, scoring, photo sharing, player profiles, and admin functionality.

> **Primary reference**: See [/DATABASE.md](/DATABASE.md) for comprehensive documentation including data flows, API endpoints, and frontend integration.

## Quick Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the schema SQL in Supabase SQL Editor:
   ```bash
   # Copy contents of supabase/schema_complete.sql and execute in Supabase Dashboard > SQL Editor
   ```
4. Create a storage bucket named `photos` (public)

---

## Tables (10 total)

### users
Stores registered users with secure user ID authentication.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | TEXT (PK) | Unique identifier (e.g., `MyName_1234`) |
| `username` | TEXT (UNIQUE) | Display name (2-30 chars) |
| `avatar` | TEXT | Selected avatar preset |
| `is_preset_image` | BOOLEAN | Whether using preset avatar |
| `image_url` | TEXT | Custom avatar URL |
| `total_points` | INTEGER | Accumulated trivia points |
| `current_streak` | INTEGER | Consecutive correct answers |
| `days_played` | INTEGER | Number of days participated |
| `created_at` | TIMESTAMPTZ | Registration time |
| `last_played_at` | TIMESTAMPTZ | Last activity time |
| `is_admin` | BOOLEAN | Admin access flag (default false) |

**User ID Format:** `{username_no_spaces}_{4_random_digits}` (e.g., `LegionOfBoom_4829`)

**Valid Avatars:** `hawk`, `blitz`, `12`, `superfan`, `12th_man`, `girls_rule`, `hero`, `champion`, `trophy`, `queen`, `sparkle`, `fire`

**Indexes:** `total_points DESC`, `created_at DESC`, `username`

---

### trivia_questions
All trivia questions in the system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Question ID |
| `question_text` | TEXT | The question |
| `image_url` | TEXT | Optional question image |
| `image_source` | TEXT | `web`, `generated`, or `uploaded` |
| `option_a` | TEXT | Answer choice A |
| `option_b` | TEXT | Answer choice B |
| `option_c` | TEXT | Answer choice C |
| `option_d` | TEXT | Answer choice D |
| `correct_answer` | TEXT | Correct option (`a`, `b`, `c`, `d`) |
| `hint_text` | TEXT | Optional hint |
| `time_limit_seconds` | INTEGER | Per-question timer (default 15) |
| `points` | INTEGER | Base points (default 100) |
| `difficulty` | TEXT | `easy`, `medium`, or `hard` |
| `category` | TEXT | Question category |
| `is_active` | BOOLEAN | Whether question is available |
| `created_at` | TIMESTAMPTZ | Creation time |

**Indexes:** `category`, `difficulty`, `is_active`

---

### daily_trivia_sets
Pre-configured question sets for each day.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Set ID |
| `day_identifier` | TEXT (UNIQUE) | Day key (e.g., `day_minus_4`) |
| `display_date` | DATE | Calendar date shown to users |
| `question_ids` | UUID[] | Array of question IDs |
| `is_active` | BOOLEAN | Whether this set is playable |
| `created_at` | TIMESTAMPTZ | Creation time |

---

### game_day_rounds
Questions for live synchronized game rounds.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Round ID |
| `round_number` | INTEGER | Round sequence number |
| `question_ids` | UUID[] | Array of question IDs |
| `is_live` | BOOLEAN | Whether round is currently active |
| `started_at` | TIMESTAMPTZ | When round started |
| `ended_at` | TIMESTAMPTZ | When round ended |

---

### daily_answers
Individual answer records for each user/question.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Answer ID |
| `user_id` | TEXT (FK) | References users.user_id |
| `question_id` | UUID (FK) | References trivia_questions.id |
| `day_identifier` | TEXT | Which day this was answered |
| `selected_answer` | TEXT | User's choice (`a`, `b`, `c`, `d`) |
| `is_correct` | BOOLEAN | Whether answer was correct |
| `points_earned` | INTEGER | Base points earned |
| `streak_bonus` | INTEGER | Additional streak multiplier points |
| `time_taken_ms` | INTEGER | Response time in milliseconds |
| `answered_at` | TIMESTAMPTZ | When answered |

**Unique constraint:** `(user_id, question_id, day_identifier)` - one answer per user per question per day

---

### photo_uploads
User-uploaded fan photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Photo ID |
| `user_id` | TEXT (FK) | References users.user_id |
| `image_url` | TEXT | Supabase Storage URL |
| `caption` | TEXT | Optional caption |
| `like_count` | INTEGER | Like count (auto-updated by trigger) |
| `is_approved` | BOOLEAN | Admin approval status |
| `is_hidden` | BOOLEAN | Admin hide status |
| `created_at` | TIMESTAMPTZ | Upload time |

---

### photo_likes
Tracks which users liked which photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Like ID |
| `photo_id` | UUID (FK) | References photo_uploads.id |
| `user_id` | TEXT (FK) | References users.user_id |
| `created_at` | TIMESTAMPTZ | When liked |

**Unique constraint:** `(photo_id, user_id)` - one like per user per photo

**Trigger:** Automatically updates `photo_uploads.like_count` on insert/delete

---

### players
Player profiles: 2025 rosters, Super Bowl heroes, and Hall of Fame legends.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Player ID |
| `name` | TEXT | Player name |
| `jersey_number` | INTEGER | Jersey number |
| `position` | TEXT | Playing position |
| `image_url` | TEXT | Player headshot URL |
| `image_validated` | BOOLEAN | Admin-verified image (default false) |
| `stats` | JSONB | Key-value statistics |
| `trivia` | JSONB | Array of trivia facts |
| `bio` | TEXT | Player biography |
| `super_bowl_highlight` | TEXT | Notable Super Bowl moment |
| `display_order` | INTEGER | Sort order |
| `is_active` | BOOLEAN | Show in UI |

**Display order convention:**
- 1-58: 2025 Seahawks roster
- 101-170: 2025 Patriots roster

**Stats JSONB example:**
```json
{"Pass Yds": "4,048", "Pass TD": "25", "INT": "14", "Rating": "99.1"}
```

---

### game_settings
Singleton table (always id=1) controlling game state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Always 1 (CHECK constraint) |
| `current_mode` | TEXT | `pre_game`, `daily`, `live`, `ended` |
| `questions_per_day` | INTEGER | Number of daily questions |
| `timer_duration` | INTEGER | Seconds per question |
| `scores_locked` | BOOLEAN | Prevent new answers |
| `current_day` | TEXT | Current day identifier |
| `live_question_index` | INTEGER | Current question in live mode |
| `is_paused` | BOOLEAN | Pause live game |
| `updated_at` | TIMESTAMPTZ | Last modification |

---

### admin_action_logs
Audit trail of admin actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Log entry ID |
| `action_type` | TEXT | Type of action |
| `target_type` | TEXT | What was affected |
| `target_id` | TEXT | Specific target ID |
| `details` | JSONB | Additional context |
| `performed_at` | TIMESTAMPTZ | When action occurred |

**Action types:** `game_start`, `game_pause`, `game_resume`, `game_end`, `next_question`, `mode_change`

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

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

**Note:** Admin operations use the service role key which bypasses RLS.

---

## Database Functions

### get_leaderboard(p_limit INTEGER)
Returns ranked leaderboard with user stats.

```sql
SELECT * FROM get_leaderboard(50);
-- Returns: rank, user_id, username, avatar, total_points, current_streak, days_played
```

### update_user_stats()
Trigger function (AFTER INSERT on `daily_answers`):
- Adds `points_earned + streak_bonus` to user's `total_points`
- Increments `days_played` if new day
- Updates `last_played_at` timestamp

### update_photo_like_count()
Trigger function (AFTER INSERT/DELETE on `photo_likes`):
- Increments/decrements `like_count` on the associated photo

---

## Scoring System

```
Base Points:     100 per correct answer
Time Bonus:      +50 if answered within 5 seconds
Streak Multipliers:
  - 0-1 correct: 1.0x
  - 2 correct:   1.2x
  - 3 correct:   1.5x
  - 4 correct:   2.0x
  - 5+ correct:  2.5x (max)
```

**Example calculation:**
- Correct answer in 3 seconds with 4-streak
- Base: 100 + Time bonus: 50 = 150
- With 2.0x multiplier = 300 points
- Stored as: points_earned=150, streak_bonus=150

---

## Entity Relationship Diagram

```
users (user_id PK, username UNIQUE)
  |
  |-- daily_answers --> trivia_questions
  |
  |-- photo_uploads
  |       |
  |       +-- photo_likes
  |
  +-- is_admin flag for admin access

game_settings (singleton, id=1)
  |
  +-- Controls: current_mode, live_question_index, is_paused

trivia_questions
  |
  |-- daily_trivia_sets (question_ids[])
  |
  +-- game_day_rounds (question_ids[])

players (standalone - 2025 rosters, SB heroes, HOF legends)
admin_action_logs (standalone audit trail)
```

---

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| users | idx_users_total_points | total_points DESC |
| users | idx_users_created_at | created_at DESC |
| users | idx_users_username | username |
| trivia_questions | idx_questions_category | category |
| trivia_questions | idx_questions_difficulty | difficulty |
| trivia_questions | idx_questions_active | is_active |
| daily_trivia_sets | idx_daily_sets_day | day_identifier |
| daily_trivia_sets | idx_daily_sets_active | is_active |
| daily_answers | idx_answers_user_id | user_id |
| daily_answers | idx_answers_day | day_identifier |
| daily_answers | idx_answers_date | answered_at |
| photo_uploads | idx_photos_user_id | user_id |
| photo_uploads | idx_photos_approved | (is_approved, is_hidden, created_at DESC) |
| photo_likes | idx_photo_likes_photo | photo_id |
| players | idx_players_active | (is_active, display_order) |
| players | idx_players_image_validated | image_validated (partial: WHERE true) |
| admin_action_logs | idx_logs_performed_at | performed_at DESC |

---

## Storage Buckets

### photos (public)
Stores user-uploaded party photos.

**Allowed types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Max size:** 5MB

---

## Migrations

The full schema is in `supabase/schema_complete.sql`. Applied migrations:

| Migration | Description |
|-----------|-------------|
| `20260204_add_user_id_and_admin.sql` | Adds user_id PK and is_admin flag |
| `20260205_update_patriots_roster.sql` | Updates Patriots stats + adds 24 roster players |
| `20260205_add_image_validated.sql` | Adds image_validated column to players |

For new changes:
1. Create migration file: `supabase/migrations/YYYYMMDD_description.sql`
2. Test locally with Supabase CLI
3. Apply to production via SQL Editor

---

## Backup & Recovery

Supabase provides:
- Point-in-time recovery (Pro plan)
- Daily backups (all plans)
- Manual backup via `pg_dump`

```bash
# Manual backup (requires direct database connection)
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

---

*Last updated: February 2026*
