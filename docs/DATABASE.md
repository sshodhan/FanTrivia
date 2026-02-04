# HawkTrivia Database Design

## Overview

HawkTrivia is a Seattle Seahawks-themed trivia application with the following features:
- User registration with team names and avatars
- Daily trivia challenges with timed questions
- Leaderboard with scores, streaks, and rankings
- Photo wall for user-submitted content
- Super Bowl Heroes player cards
- Admin console for content management

## Design Principles

1. **Username as Primary Identifier**: The `username` (team name) serves as the unique identifier across all tables, simplifying queries and maintaining data integrity.

2. **Denormalized Scores**: Total points and streaks are stored directly on the users table for fast leaderboard queries.

3. **Soft Moderation**: Photos require approval before public display.

---

## Schema

### 1. users

The core table storing all registered players.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `username` | TEXT | PRIMARY KEY | Unique team name (e.g., "TheDarkSide", "The 12th Men") |
| `avatar` | TEXT | NOT NULL | Avatar type: `hawk`, `12th_man`, `football`, `champion`, `star`, `thunder` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Registration timestamp |
| `last_played_at` | TIMESTAMPTZ | | Last trivia session timestamp |
| `current_streak` | INTEGER | DEFAULT 0 | Consecutive days played |
| `total_points` | INTEGER | DEFAULT 0 | Cumulative score |
| `days_played` | INTEGER | DEFAULT 0 | Total days with activity |

**Example:**
```sql
INSERT INTO users (username, avatar)
VALUES ('TheDarkSide', 'hawk');
```

---

### 2. trivia_questions

Stores all trivia questions managed by admins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique question ID |
| `question_text` | TEXT | NOT NULL | The trivia question |
| `option_a` | TEXT | NOT NULL | Answer option A |
| `option_b` | TEXT | NOT NULL | Answer option B |
| `option_c` | TEXT | NOT NULL | Answer option C |
| `option_d` | TEXT | NOT NULL | Answer option D |
| `correct_answer` | TEXT | NOT NULL, CHECK (correct_answer IN ('a','b','c','d')) | Correct option |
| `difficulty` | TEXT | DEFAULT 'medium', CHECK (difficulty IN ('easy','medium','hard')) | Question difficulty |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When added |
| `is_active` | BOOLEAN | DEFAULT true | Whether question is available for daily trivia |

**Example:**
```sql
INSERT INTO trivia_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
VALUES (
  'What year did the Seattle Seahawks win their first Super Bowl?',
  '2012', '2013', '2014', '2015',
  'b', 'easy'
);
```

---

### 3. daily_answers

Tracks individual user responses to trivia questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique answer ID |
| `username` | TEXT | NOT NULL, REFERENCES users(username) ON DELETE CASCADE | Who answered |
| `question_id` | UUID | NOT NULL, REFERENCES trivia_questions(id) ON DELETE CASCADE | Which question |
| `selected_answer` | TEXT | NOT NULL | User's choice (a/b/c/d) |
| `is_correct` | BOOLEAN | NOT NULL | Whether answer was correct |
| `points_earned` | INTEGER | DEFAULT 0 | Points awarded for this answer |
| `answered_at` | TIMESTAMPTZ | DEFAULT NOW() | When answered |
| `time_taken_ms` | INTEGER | | Response time in milliseconds |

**Unique Constraint:** A user can only answer each question once per day.
```sql
UNIQUE (username, question_id, DATE(answered_at))
```

---

### 4. photos

User-submitted photos for the Photo Wall.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique photo ID |
| `username` | TEXT | NOT NULL, REFERENCES users(username) ON DELETE CASCADE | Who uploaded |
| `image_url` | TEXT | NOT NULL | Photo storage URL (Vercel Blob) |
| `caption` | TEXT | | Photo caption |
| `like_count` | INTEGER | DEFAULT 0 | Denormalized like count |
| `is_approved` | BOOLEAN | DEFAULT false | Admin moderation status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

---

### 5. photo_likes

Tracks which users liked which photos.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique like ID |
| `photo_id` | UUID | NOT NULL, REFERENCES photos(id) ON DELETE CASCADE | Which photo |
| `username` | TEXT | NOT NULL, REFERENCES users(username) ON DELETE CASCADE | Who liked |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When liked |

**Unique Constraint:** One like per user per photo.
```sql
UNIQUE (photo_id, username)
```

---

### 6. players

Super Bowl Heroes player cards.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique player ID |
| `name` | TEXT | NOT NULL | Player name (e.g., "Russell Wilson") |
| `jersey_number` | INTEGER | NOT NULL | Jersey number |
| `position` | TEXT | NOT NULL | Position (Quarterback, Running Back, etc.) |
| `image_url` | TEXT | | Player image URL |
| `display_order` | INTEGER | DEFAULT 0 | Sort order for display |

**Seed Data:**
```sql
INSERT INTO players (name, jersey_number, position, display_order) VALUES
('Russell Wilson', 3, 'Quarterback', 1),
('Marshawn Lynch', 24, 'Running Back', 2),
('Richard Sherman', 25, 'Cornerback', 3),
('Malcolm Smith', 53, 'Linebacker', 4),
('Earl Thomas', 29, 'Safety', 5),
('Kam Chancellor', 31, 'Safety', 6);
```

---

### 7. game_settings

Admin configuration (single row table).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY DEFAULT 1, CHECK (id = 1) | Ensures single row |
| `game_day_mode` | BOOLEAN | DEFAULT false | Enable special 20-25 question mode |
| `questions_per_day` | INTEGER | DEFAULT 5 | Number of daily questions |
| `timer_duration` | INTEGER | DEFAULT 15 | Seconds allowed per question |
| `scores_locked` | BOOLEAN | DEFAULT false | Prevent score modifications |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last settings change |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────┐         ┌──────────────────┐                      │
│  │    users     │         │ trivia_questions │                      │
│  ├──────────────┤         ├──────────────────┤                      │
│  │ username PK  │◄───┐    │ id PK            │◄───┐                 │
│  │ avatar       │    │    │ question_text    │    │                 │
│  │ total_points │    │    │ option_a-d       │    │                 │
│  │ current_streak│   │    │ correct_answer   │    │                 │
│  │ days_played  │    │    │ difficulty       │    │                 │
│  └──────────────┘    │    └──────────────────┘    │                 │
│         │            │                            │                 │
│         │            │    ┌──────────────────┐    │                 │
│         │            └────┤  daily_answers   ├────┘                 │
│         │                 ├──────────────────┤                      │
│         │                 │ id PK            │                      │
│         │                 │ username FK      │                      │
│         │                 │ question_id FK   │                      │
│         │                 │ selected_answer  │                      │
│         │                 │ is_correct       │                      │
│         │                 └──────────────────┘                      │
│         │                                                           │
│         │            ┌──────────────────┐                           │
│         ├───────────►│     photos       │                           │
│         │            ├──────────────────┤                           │
│         │            │ id PK            │◄──────┐                   │
│         │            │ username FK      │       │                   │
│         │            │ image_url        │       │                   │
│         │            │ caption          │       │                   │
│         │            │ like_count       │       │                   │
│         │            └──────────────────┘       │                   │
│         │                                       │                   │
│         │            ┌──────────────────┐       │                   │
│         └───────────►│   photo_likes    ├───────┘                   │
│                      ├──────────────────┤                           │
│                      │ id PK            │                           │
│                      │ photo_id FK      │                           │
│                      │ username FK      │                           │
│                      └──────────────────┘                           │
│                                                                     │
│  ┌──────────────┐         ┌──────────────────┐                      │
│  │   players    │         │  game_settings   │                      │
│  ├──────────────┤         ├──────────────────┤                      │
│  │ id PK        │         │ id PK (=1)       │                      │
│  │ name         │         │ game_day_mode    │                      │
│  │ jersey_number│         │ questions_per_day│                      │
│  │ position     │         │ timer_duration   │                      │
│  └──────────────┘         │ scores_locked    │                      │
│                           └──────────────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Common Queries

### Get Leaderboard (Top 10)
```sql
SELECT username, avatar, total_points, current_streak, days_played
FROM users
ORDER BY total_points DESC
LIMIT 10;
```

### Get Today's Unanswered Questions for User
```sql
SELECT q.*
FROM trivia_questions q
WHERE q.is_active = true
  AND q.id NOT IN (
    SELECT question_id
    FROM daily_answers
    WHERE username = 'TheDarkSide'
      AND DATE(answered_at) = CURRENT_DATE
  )
ORDER BY RANDOM()
LIMIT 5;
```

### Get Photo Wall (Approved Photos)
```sql
SELECT p.*, u.avatar
FROM photos p
JOIN users u ON u.username = p.username
WHERE p.is_approved = true
ORDER BY p.created_at DESC;
```

### Update User Score After Correct Answer
```sql
UPDATE users
SET total_points = total_points + 10,
    last_played_at = NOW()
WHERE username = 'TheDarkSide';
```

### Check if User Liked a Photo
```sql
SELECT EXISTS(
  SELECT 1 FROM photo_likes
  WHERE photo_id = 'photo-uuid'
    AND username = 'TheDarkSide'
);
```

---

## Indexing Strategy

```sql
-- Fast leaderboard queries
CREATE INDEX idx_users_total_points ON users(total_points DESC);

-- Fast answer lookups by user
CREATE INDEX idx_daily_answers_username ON daily_answers(username);

-- Fast answer lookups by date
CREATE INDEX idx_daily_answers_date ON daily_answers(DATE(answered_at));

-- Fast photo wall queries
CREATE INDEX idx_photos_approved ON photos(is_approved, created_at DESC);

-- Fast like lookups
CREATE INDEX idx_photo_likes_photo ON photo_likes(photo_id);
```

---

## Row Level Security (RLS) Policies

For Supabase, enable RLS on all tables:

```sql
-- Users can read all users (for leaderboard)
CREATE POLICY "Users are viewable by everyone"
ON users FOR SELECT USING (true);

-- Users can only update their own record
CREATE POLICY "Users can update own record"
ON users FOR UPDATE USING (username = current_user_username());

-- Photos visible when approved (or own photos)
CREATE POLICY "Approved photos are viewable"
ON photos FOR SELECT
USING (is_approved = true OR username = current_user_username());

-- Users can only insert their own photos
CREATE POLICY "Users can insert own photos"
ON photos FOR INSERT
WITH CHECK (username = current_user_username());
```

---

## Migration Order

1. `users` (no dependencies)
2. `trivia_questions` (no dependencies)
3. `players` (no dependencies)
4. `game_settings` (no dependencies)
5. `daily_answers` (depends on users, trivia_questions)
6. `photos` (depends on users)
7. `photo_likes` (depends on photos, users)

---

## Notes

- **Avatar Storage**: Avatars are stored as enum strings, with actual images/emojis rendered client-side
- **Points System**: Points are calculated based on correctness and response time
- **Streak Logic**: Streaks reset if a user misses a calendar day
- **Photo Moderation**: All photos default to `is_approved = false` until admin approves
