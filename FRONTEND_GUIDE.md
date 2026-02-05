# HawkTrivia Frontend Integration Guide

This guide explains how to connect the frontend to the Supabase database and use the API endpoints.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Supabase Client](#supabase-client)
3. [TypeScript Types](#typescript-types)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Code Examples](#code-examples)
6. [SWR Data Fetching](#swr-data-fetching)
7. [Error Handling](#error-handling)
8. [Demo Mode](#demo-mode)

---

## Environment Setup

### 1. Create `.env.local` File

Create a `.env.local` file in the project root with your Supabase credentials:

```bash
# Public keys (safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-only key (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Where to Find Your Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Verify Connection

```bash
npm run dev
```

Check browser console - if you see "Supabase is not configured. Using mock data." then environment variables are missing.

---

## Supabase Client

The app uses three client types defined in `lib/supabase.ts`:

### Browser Client (Frontend Components)

```typescript
import { getSupabaseBrowserClient } from '@/lib/supabase'

// Use in React components
const supabase = getSupabaseBrowserClient()
```

### Server Client (API Routes - Standard Operations)

```typescript
import { createSupabaseServerClient } from '@/lib/supabase'

// Use in API routes for normal operations
const supabase = createSupabaseServerClient()
```

### Admin Client (API Routes - Privileged Operations)

```typescript
import { createSupabaseAdminClient } from '@/lib/supabase'

// Use for admin operations that bypass RLS
const supabase = createSupabaseAdminClient()
```

### Check Configuration Status

```typescript
import { isSupabaseConfigured, isDemoMode } from '@/lib/supabase'

if (isDemoMode()) {
  // Show demo banner or use mock data
}
```

---

## TypeScript Types

All types are defined in `lib/database.types.ts`. Import as needed:

```typescript
import type {
  User,
  UserInsert,
  TriviaQuestion,
  TriviaQuestionPublic,
  DailyAnswer,
  AnswerSubmission,
  AnswerResult,
  GameSettings,
  GameMode,
  Player,
  LeaderboardEntry,
  PhotoUpload,
  AvatarId,
  AnswerOption,
} from '@/lib/database.types'

import { AVATARS, calculatePoints, SCORING_CONFIG } from '@/lib/database.types'
```

### Key Types

| Type | Purpose |
|------|---------|
| `User` | Full user profile (includes `user_id`, `username`, `is_admin`) |
| `TriviaQuestionPublic` | Question without correct answer (for display) |
| `AnswerSubmission` | What frontend sends when user answers |
| `AnswerResult` | Response after submitting answer |
| `GameSettings` | Current game state and configuration |
| `GameMode` | `'pre_game' \| 'daily' \| 'live' \| 'ended'` |
| `LeaderboardEntry` | User entry on scoreboard |
| `AvatarId` | Valid avatar identifiers |

### User Type

```typescript
interface User {
  user_id: string        // Unique ID (e.g., 'HawkFan12_4829')
  username: string       // Display name (unique)
  avatar: AvatarId       // Selected avatar
  is_preset_image: boolean
  image_url: string | null
  total_points: number
  current_streak: number
  days_played: number
  created_at: string
  last_played_at: string | null
  is_admin: boolean      // Admin access flag
}
```

---

## API Endpoints Reference

### User Registration & Sign In

The app uses a secure user ID system. Each user gets a unique `user_id` (e.g., `HawkFan12_4829`) that they can use to recover their account.

#### `POST /api/register`

Register a new user. Returns error if username is already taken.

**Request:**
```typescript
const response = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'HawkFan12',
    avatar: 'hawk'  // AvatarId
  })
})

const { user, isNew } = await response.json()
// user: User object with user_id (e.g., 'HawkFan12_4829')
// isNew: true (always for registration)
```

**Error Response (409):**
```typescript
{ error: 'Username is already taken. Please choose another or sign in with your User ID.' }
```

#### `POST /api/signin`

Sign in with an existing user_id (for account recovery).

**Request:**
```typescript
const response = await fetch('/api/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'HawkFan12_4829'
  })
})

const { user } = await response.json()
// user: Full User object
```

**Error Response (404):**
```typescript
{ error: 'User not found. Please check your User ID.' }
```

#### `GET /api/user?user_id=X` or `GET /api/user?username=X`

Get user data by user_id or username.

**Response:**
```typescript
{ user: User | null }
```

**Valid Avatars:**
```typescript
'hawk' | 'blitz' | '12' | 'superfan' | '12th_man' |
'girls_rule' | 'hero' | 'champion' | 'trophy' |
'queen' | 'sparkle' | 'fire'
```

---

### Daily Trivia

#### `GET /api/trivia/daily`

Get today's trivia questions.

**Request:**
```typescript
const response = await fetch('/api/trivia/daily', {
  headers: {
    'x-username': 'HawkFan12'  // Optional: to get already-answered status
  }
})

const data: DailyTriviaResponse = await response.json()
```

**Response:**
```typescript
interface DailyTriviaResponse {
  day_identifier: string           // e.g., 'day_minus_4', 'game_day'
  questions: TriviaQuestionPublic[] // Questions WITHOUT correct_answer
  already_answered_ids: string[]    // Question IDs user already answered
  settings: {
    questions_per_day: number      // e.g., 5
    timer_duration: number         // e.g., 15 (seconds)
  }
}
```

#### `POST /api/trivia/daily/answer`

Submit an answer.

**Request:**
```typescript
const response = await fetch('/api/trivia/daily/answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'HawkFan12',
    question_id: 'uuid-here',
    selected_answer: 'b',      // 'a' | 'b' | 'c' | 'd'
    time_taken_ms: 4500        // How long user took to answer
  })
})

const result: AnswerResult = await response.json()
```

**Response:**
```typescript
interface AnswerResult {
  is_correct: boolean
  correct_answer: AnswerOption  // The actual answer
  points_earned: number         // Base points
  streak_bonus: number          // Bonus from streak
  current_streak: number        // New streak count
  total_points: number          // User's updated total
}
```

---

### Live Game (Admin Controlled)

#### `GET /api/trivia/live`

Get current live game state. Poll this every 2-3 seconds during live mode.

**Response:**
```typescript
{
  game_mode: GameMode,
  is_paused: boolean,
  current_question: TriviaQuestionPublic | null,
  current_question_index: number,
  total_questions: number,
  timer_duration: number
}
```

---

### Leaderboard

#### `GET /api/scoreboard`

Get top players.

**Request:**
```typescript
const response = await fetch('/api/scoreboard?limit=50')
const { leaderboard } = await response.json()
```

**Response:**
```typescript
{
  leaderboard: LeaderboardEntry[]
}

interface LeaderboardEntry {
  rank: number
  username: string
  avatar: AvatarId
  total_points: number
  current_streak: number
  days_played: number
}
```

---

### Players (Super Bowl Heroes)

#### `GET /api/players`

Get player profiles for display.

**Response:**
```typescript
{
  players: Player[]
}

interface Player {
  id: string
  name: string
  jersey_number: number
  position: string
  image_url: string | null
  stats: Record<string, string | number> | null
  trivia: string[] | null
  bio: string | null
  super_bowl_highlight: string | null
  display_order: number
  is_active: boolean
}
```

---

### Photos

#### `GET /api/photos`

Get approved photos.

```typescript
const response = await fetch('/api/photos?limit=20&username=HawkFan12')
const { photos } = await response.json()
// photos include has_liked boolean if username provided
```

#### `POST /api/photos/upload`

Upload a new photo.

```typescript
const formData = new FormData()
formData.append('image', file)
formData.append('username', 'HawkFan12')
formData.append('caption', 'Go Hawks!')

const response = await fetch('/api/photos/upload', {
  method: 'POST',
  body: formData
})
```

#### `POST /api/photos/[photoId]/like`

Like a photo.

```typescript
await fetch(`/api/photos/${photoId}/like`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'HawkFan12' })
})
```

#### `DELETE /api/photos/[photoId]/like`

Unlike a photo.

```typescript
await fetch(`/api/photos/${photoId}/like`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'HawkFan12' })
})
```

---

## Code Examples

### Using the User Context

The app provides a `useUser` hook for authentication:

```typescript
'use client'

import { useUser } from '@/lib/user-context'

export function MyComponent() {
  const { 
    user,           // Current user or null
    isLoading,      // Loading state
    registerUser,   // (username, avatar) => Promise
    signIn,         // (userId) => Promise
    refreshUser,    // () => Promise - fetch latest from server
    clearUser       // () => void - logout
  } = useUser()

  // Check if admin
  if (user?.is_admin) {
    // Show admin features
  }

  // Get user_id for recovery
  const userId = user?.user_id // e.g., 'HawkFan12_4829'
}
```

### Complete User Registration Flow

```typescript
'use client'

import { useState } from 'react'
import { useUser } from '@/lib/user-context'
import { AVATARS, type AvatarId } from '@/lib/database.types'

export function RegisterForm() {
  const { registerUser, signIn } = useUser()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [avatar, setAvatar] = useState<AvatarId>('hawk')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'signin') {
      const result = await signIn(userId)
      if (!result.success) setError(result.error || 'Sign in failed')
      return
    }

    const result = await registerUser(username, avatar)
    if (!result.success) {
      setError(result.error || 'Registration failed')
    }
  }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setUser(data.user)
      // Store username in localStorage or context
      localStorage.setItem('hawktrivia_username', data.user.username)

    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        minLength={2}
        maxLength={30}
        required
      />

      <div className="avatar-grid">
        {Object.entries(AVATARS).map(([id, { name, emoji }]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAvatar(id as AvatarId)}
            className={avatar === id ? 'selected' : ''}
          >
            {emoji} {name}
          </button>
        ))}
      </div>

      <button type="submit">Join Game</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
```

### Trivia Game Component

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  TriviaQuestionPublic,
  AnswerOption,
  AnswerResult
} from '@/lib/database.types'

export function TriviaGame({ username }: { username: string }) {
  const [questions, setQuestions] = useState<TriviaQuestionPublic[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [startTime, setStartTime] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState(15)

  // Fetch questions
  useEffect(() => {
    async function loadQuestions() {
      const response = await fetch('/api/trivia/daily', {
        headers: { 'x-username': username }
      })
      const data = await response.json()
      setQuestions(data.questions)
    }
    loadQuestions()
  }, [username])

  // Timer
  useEffect(() => {
    if (questions.length === 0 || result) return

    setStartTime(Date.now())
    setTimeLeft(15)

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIndex, questions.length])

  const handleTimeUp = () => {
    // Auto-submit wrong answer when time runs out
    submitAnswer('a') // or handle differently
  }

  const submitAnswer = async (answer: AnswerOption) => {
    if (!questions[currentIndex]) return

    const timeTaken = Date.now() - startTime
    setSelectedAnswer(answer)

    const response = await fetch('/api/trivia/daily/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        question_id: questions[currentIndex].id,
        selected_answer: answer,
        time_taken_ms: timeTaken
      })
    })

    const answerResult: AnswerResult = await response.json()
    setResult(answerResult)
  }

  const nextQuestion = () => {
    setResult(null)
    setSelectedAnswer(null)
    setCurrentIndex(prev => prev + 1)
  }

  if (questions.length === 0) {
    return <div>Loading questions...</div>
  }

  if (currentIndex >= questions.length) {
    return <div>Quiz complete!</div>
  }

  const question = questions[currentIndex]

  return (
    <div className="trivia-game">
      <div className="timer">Time: {timeLeft}s</div>
      <div className="progress">
        Question {currentIndex + 1} of {questions.length}
      </div>

      <h2>{question.question_text}</h2>

      <div className="options">
        {(['a', 'b', 'c', 'd'] as AnswerOption[]).map(option => (
          <button
            key={option}
            onClick={() => !result && submitAnswer(option)}
            disabled={!!result}
            className={`
              ${selectedAnswer === option ? 'selected' : ''}
              ${result && option === result.correct_answer ? 'correct' : ''}
              ${result && selectedAnswer === option && !result.is_correct ? 'wrong' : ''}
            `}
          >
            {option.toUpperCase()}: {question[`option_${option}`]}
          </button>
        ))}
      </div>

      {result && (
        <div className="result">
          <p>{result.is_correct ? '✓ Correct!' : '✗ Wrong!'}</p>
          <p>Points: +{result.points_earned + result.streak_bonus}</p>
          <p>Streak: {result.current_streak}</p>
          <button onClick={nextQuestion}>Next Question</button>
        </div>
      )}
    </div>
  )
}
```

---

## SWR Data Fetching

The app uses [SWR](https://swr.vercel.app/) for data fetching with automatic revalidation.

### Setup

```typescript
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())
```

### Leaderboard with Auto-Refresh

```typescript
function Scoreboard() {
  const { data, error, isLoading } = useSWR(
    '/api/scoreboard?limit=50',
    fetcher,
    {
      refreshInterval: 30000,     // Refresh every 30 seconds
      revalidateOnFocus: true,    // Refresh when tab gains focus
      dedupingInterval: 5000,     // Dedupe requests within 5 seconds
    }
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading leaderboard</div>

  return (
    <ul>
      {data.leaderboard.map((entry: LeaderboardEntry) => (
        <li key={entry.username}>
          #{entry.rank} {entry.username} - {entry.total_points} pts
        </li>
      ))}
    </ul>
  )
}
```

### Live Game Polling

```typescript
function LiveGame({ gameMode }: { gameMode: GameMode }) {
  const { data } = useSWR(
    gameMode === 'live' ? '/api/trivia/live' : null, // Only poll in live mode
    fetcher,
    { refreshInterval: 2000 } // Poll every 2 seconds
  )

  if (!data) return <div>Waiting for game to start...</div>

  return (
    <div>
      <p>Question {data.current_question_index + 1} of {data.total_questions}</p>
      {data.current_question && (
        <QuestionCard question={data.current_question} />
      )}
    </div>
  )
}
```

---

## Error Handling

### API Error Response Format

All API endpoints return errors in this format:

```typescript
{
  error: string  // Human-readable error message
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (new user registered) |
| 400 | Bad request (invalid input) |
| 404 | Not found |
| 409 | Conflict (username taken) |
| 500 | Server error |

### Error Handling Pattern

```typescript
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`)
  }

  return data
}

// Usage
try {
  const result = await apiCall<AnswerResult>('/api/trivia/daily/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission)
  })
} catch (error) {
  console.error('Failed to submit answer:', error.message)
  // Show error to user
}
```

---

## Admin Access

Admin functionality is available to users with `is_admin: true` in the database.

### How to Grant Admin Access

```sql
-- In Supabase SQL Editor
UPDATE users SET is_admin = true WHERE username = 'YourUsername';
```

### Accessing Admin Features

1. **Via Settings Screen**: Admin users see an "Admin" tab in Settings
2. **Via Direct URL**: Navigate to `/admin` (redirects non-admins to home)

### Admin Capabilities

| Feature | Description |
|---------|-------------|
| Questions | Add, edit, delete trivia questions |
| Scores | View and manage user scores |
| Photos | Approve/reject uploaded photos |
| Settings | Configure game settings |
| Logs | View admin action logs |

### Checking Admin Status

```typescript
import { useUser } from '@/lib/user-context'

function AdminFeature() {
  const { user } = useUser()
  
  if (!user?.is_admin) {
    return null // Hide from non-admins
  }
  
  return <AdminPanel />
}
```

---

## Demo Mode

When Supabase is not configured, the app runs in demo mode with mock data.

### Check Demo Mode

```typescript
import { isDemoMode } from '@/lib/supabase'

function App() {
  return (
    <div>
      {isDemoMode() && (
        <div className="demo-banner">
          Running in demo mode. Connect Supabase for full functionality.
        </div>
      )}
      {/* Rest of app */}
    </div>
  )
}
```

### Demo Behavior

| Feature | Demo Mode | Production |
|---------|-----------|------------|
| Registration | Returns mock user | Creates in database |
| Questions | 5 hardcoded questions | From trivia_questions table |
| Answers | Not persisted | Saved to daily_answers |
| Leaderboard | Empty or mock | Real user rankings |
| Points | Not tracked | Accumulated in database |

---

## Quick Reference

### Required Headers

| Endpoint | Header | Purpose |
|----------|--------|---------|
| `/api/trivia/daily` | `x-username` | Track answered questions |
| Admin endpoints | `x-admin-token` | Authentication |

### Storage Keys

```typescript
// localStorage keys used by the app
localStorage.getItem('hawktrivia_user')       // Full User object (JSON)
localStorage.getItem('hawktrivia_todayPlayed') // Has played today
localStorage.getItem('hawktrivia_playedDate')  // Date of last play
```

### User ID Format

User IDs are generated as `{username_no_spaces}_{4_random_digits}`:
- `HawkFan12` becomes `HawkFan12_4829`
- `Legion of Boom` becomes `LegionofBoom_7156`

Users should save their User ID for account recovery (shown in Settings > Profile).

### Environment Variable Checklist

```bash
# Required for database connection
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY

# Required for admin operations
✓ SUPABASE_SERVICE_ROLE_KEY

# Optional
○ ADMIN_PASSWORD  # For admin login
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client initialization |
| `lib/database.types.ts` | All TypeScript type definitions |
| `app/api/**/route.ts` | API endpoint implementations |
| `DATABASE.md` | Full database schema documentation |

---

*Last updated: February 2026*
