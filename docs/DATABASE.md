# Database Documentation

## Overview

Hawktrivia uses **Supabase** (PostgreSQL) as its database backend. The schema supports team registration, trivia gameplay, scoring, photo sharing, and admin functionality.

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
   # Copy contents of supabase/schema.sql and execute in Supabase Dashboard > SQL Editor
   ```
4. Create a storage bucket named `photos` (public)

---

## Tables

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
| `created_at` | TIMESTAMP | Registration time |
| `last_played_at` | TIMESTAMP | Last activity time |
| `is_admin` | BOOLEAN | Admin access flag (default false) |

**User ID Format:** `{username_no_spaces}_{4_random_digits}` (e.g., `LegionOfBoom_4829`)

**Indexes:** `total_points DESC`, `created_at DESC`, `username`

---

### trivia_questions
All trivia questions in the system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `question_text` | TEXT | The question |
| `image_url` | TEXT | Background image URL |
| `image_source` | ENUM | 'web', 'generated', 'uploaded' |
| `options` | JSONB | Array of 4 answer strings |
| `correct_answer_index` | INTEGER | 0-3 index of correct answer |
| `hint_text` | TEXT | Hint shown after 7 seconds |
| `time_limit_seconds` | INTEGER | Default 15 |
| `points` | INTEGER | Base points (default 100) |
| `difficulty` | ENUM | 'easy', 'medium', 'hard' |
| `category` | VARCHAR(50) | Question category |
| `created_at` | TIMESTAMP | Creation time |

**Example options format:**
```json
["Russell Wilson", "Matt Hasselbeck", "Tarvaris Jackson", "Charlie Whitehurst"]
```

---

### daily_trivia_sets
Groups of 5 questions for each pre-game day.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `day_identifier` | VARCHAR(20) | 'day_minus_4', 'day_minus_3', etc. |
| `display_date` | DATE | Calendar date shown to users |
| `question_ids` | UUID[] | Array of 5 question IDs |
| `is_active` | BOOLEAN | Whether this set is playable |
| `created_at` | TIMESTAMP | Creation time |

---

### game_day_rounds
Questions for live Super Bowl day trivia.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `round_number` | INTEGER | Round sequence number |
| `question_ids` | UUID[] | Array of question IDs |
| `is_live` | BOOLEAN | Whether round is currently active |
| `started_at` | TIMESTAMP | When round started |
| `ended_at` | TIMESTAMP | When round ended |

---

### scores
Individual answer records for each team/question.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | FK to teams |
| `question_id` | UUID | FK to trivia_questions |
| `day_identifier` | VARCHAR(20) | Which day this was answered |
| `is_correct` | BOOLEAN | Whether answer was correct |
| `points_earned` | INTEGER | Points including time bonus |
| `streak_bonus` | INTEGER | Additional streak multiplier points |
| `time_taken_ms` | INTEGER | Response time in milliseconds |
| `answered_at` | TIMESTAMP | When answered |

**Unique constraint:** `(team_id, question_id)` - prevents duplicate answers

---

### team_daily_progress
Tracks completion status per team per day.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | FK to teams |
| `day_identifier` | VARCHAR(20) | Which day |
| `completed` | BOOLEAN | Whether all 5 questions done |
| `total_points` | INTEGER | Sum of points for that day |
| `completed_at` | TIMESTAMP | When completed |

**Unique constraint:** `(team_id, day_identifier)`

---

### photo_uploads
User-uploaded party photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | FK to teams (uploader) |
| `image_url` | TEXT | Supabase Storage URL |
| `caption` | TEXT | Optional caption (max 100 chars) |
| `likes` | INTEGER | Like count (denormalized) |
| `is_approved` | BOOLEAN | Admin approval status |
| `is_hidden` | BOOLEAN | Admin hide status |
| `uploaded_at` | TIMESTAMP | Upload time |

---

### photo_likes
Tracks which teams liked which photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `photo_id` | UUID | FK to photo_uploads |
| `team_id` | UUID | FK to teams (liker) |
| `created_at` | TIMESTAMP | When liked |

**Unique constraint:** `(photo_id, team_id)` - one like per team per photo

**Trigger:** Automatically updates `photo_uploads.likes` count on insert/delete

---

### seahawks_players
Seahawks roster for player cards feature.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Player name |
| `position` | VARCHAR(50) | Position (QB, RB, WR, etc.) |
| `number` | INTEGER | Jersey number |
| `image_url` | TEXT | Player photo URL |
| `stats` | JSONB | Key statistics |
| `bio` | TEXT | Player biography |
| `super_bowl_highlight` | TEXT | Notable Super Bowl moment |
| `is_active` | BOOLEAN | Whether currently on roster |

**Example stats format:**
```json
{
  "passing_yards": 4500,
  "touchdowns": 35,
  "interceptions": 10,
  "passer_rating": 105.2
}
```

---

### admin_action_logs
Audit trail of admin actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `action_type` | VARCHAR(50) | Action name |
| `target_type` | VARCHAR(50) | What was affected |
| `target_id` | UUID | ID of affected record |
| `details` | JSONB | Additional context |
| `performed_at` | TIMESTAMP | When action occurred |

**Action types:** `game_start`, `game_pause`, `game_end`, `next_question`, `question_create`, `question_update`, `question_delete`, `game_state_update`

---

### game_state
Singleton table for global game state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Always 1 (singleton) |
| `current_mode` | ENUM | 'pre_game', 'daily', 'live', 'ended' |
| `current_day` | VARCHAR(20) | Current day identifier |
| `live_question_index` | INTEGER | Current question in live game |
| `is_paused` | BOOLEAN | Whether game is paused |
| `leaderboard_locked` | BOOLEAN | Freeze final standings |
| `updated_at` | TIMESTAMP | Last state change |

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| teams | Anyone | Anyone | Owner | - |
| trivia_questions | Anyone | - | - | - |
| daily_trivia_sets | Active only | - | - | - |
| scores | Anyone | Owner | - | - |
| photo_uploads | Approved only | Owner | - | - |
| seahawks_players | Active only | - | - | - |
| game_state | Anyone | - | - | - |

**Note:** Admin operations use the service role key which bypasses RLS.

---

## Database Functions

### get_team_total_points(team_id UUID)
Returns total points for a team across all scores.

```sql
SELECT get_team_total_points('uuid-here');
-- Returns: 2450
```

### get_leaderboard(limit INTEGER)
Returns ranked leaderboard with team stats.

```sql
SELECT * FROM get_leaderboard(50);
-- Returns: rank, team_id, team_name, team_image, total_points, days_played
```

---

## Scoring System

```
Base Points:     100 per correct answer
Time Bonus:      +50 if answered within 5 seconds
Streak Multipliers:
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

## Storage Buckets

### photos (public)
Stores user-uploaded party photos.

**Path format:** `{team_id}/{uuid}.{ext}`

**Allowed types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Max size:** 5MB

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐
│   teams     │────<│     scores       │
└─────────────┘     └──────────────────┘
       │                    │
       │            ┌───────┴───────┐
       │            │               │
       ▼            ▼               ▼
┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
│photo_uploads│  │team_daily_   │  │trivia_questions   │
└─────────────┘  │progress      │  └───────────────────┘
       │         └──────────────┘           │
       │                                    │
       ▼                                    ▼
┌─────────────┐                  ┌───────────────────┐
│photo_likes  │                  │daily_trivia_sets  │
└─────────────┘                  │game_day_rounds    │
                                 └───────────────────┘
```

---

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| teams | idx_teams_device_fingerprint | device_fingerprint |
| teams | idx_teams_session_token | session_token |
| trivia_questions | idx_questions_category | category |
| trivia_questions | idx_questions_difficulty | difficulty |
| daily_trivia_sets | idx_daily_sets_day | day_identifier |
| daily_trivia_sets | idx_daily_sets_active | is_active |
| scores | idx_scores_team | team_id |
| scores | idx_scores_day | day_identifier |
| scores | idx_scores_answered_at | answered_at |
| team_daily_progress | idx_progress_team_day | (team_id, day_identifier) |
| photo_uploads | idx_photos_team | team_id |
| photo_uploads | idx_photos_uploaded_at | uploaded_at DESC |
| photo_uploads | idx_photos_approved | (is_approved, is_hidden) |
| seahawks_players | idx_players_active | is_active |
| seahawks_players | idx_players_position | position |
| admin_action_logs | idx_logs_performed_at | performed_at DESC |

---

## Migrations

The full schema is in `supabase/schema.sql`. For incremental changes:

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
