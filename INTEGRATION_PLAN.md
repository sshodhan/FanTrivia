# HawkTrivia Frontend-Backend Integration Plan

## Executive Summary

This document outlines the integration plan for connecting the HawkTrivia frontend components to the existing backend API endpoints. The app has a working backend with API routes and Supabase integration, but the frontend components currently use mock/local data.

---

## Current Status Assessment

### What's DONE (Backend)
| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 10 tables in Supabase |
| Trivia Questions | ✅ Seeded | 51+ questions across 8 categories |
| Player Profiles | ✅ Seeded | 6+ Super Bowl heroes |
| API: `/api/register` | ✅ Complete | User registration with demo fallback |
| API: `/api/trivia/daily` | ✅ Complete | Get daily questions |
| API: `/api/trivia/daily/answer` | ✅ Complete | Submit answers with scoring |
| API: `/api/scoreboard` | ✅ Complete | Leaderboard with rankings |
| API: `/api/players` | ✅ Complete | Player profiles |
| API: `/api/photos` | ✅ Complete | Photo gallery with likes |
| TypeScript Types | ✅ Complete | `lib/database.types.ts` |
| Demo Mode | ✅ Complete | All APIs have fallback data |

### What NEEDS Integration (Frontend)
| Component | Current State | Target State |
|-----------|--------------|--------------|
| `entry-screen.tsx` | Uses local state + mock data | Connect to `/api/register` |
| `trivia-game.tsx` | Uses `sampleQuestions` from mock-data | Fetch from `/api/trivia/daily`, submit to `/api/trivia/daily/answer` |
| `scoreboard.tsx` | Uses SWR but has type mismatches | Fix type alignment (team → user) |
| `player-cards.tsx` | Uses `samplePlayers` from mock-data | Fetch from `/api/players` |
| `photo-wall.tsx` | Uses `samplePhotos` local state | Connect to `/api/photos`, `/api/photos/upload`, `/api/photos/[id]/like` |
| `team-context.tsx` | Team-based context | Convert to User-based context |

### Critical Issue: Type Mismatch
The frontend uses **Team-based** types (`lib/types.ts`) while the backend uses **User-based** types (`lib/database.types.ts`).

| Frontend (lib/types.ts) | Backend (lib/database.types.ts) |
|------------------------|--------------------------------|
| `Team.id` | `User.username` (PK) |
| `Team.name` | `User.username` |
| `Team.imageUrl` | `User.avatar` (AvatarId) |
| `TriviaQuestion.correctAnswer` (number index) | `TriviaQuestion.correct_answer` ('a'\|'b'\|'c'\|'d') |
| `Score.teamId` | `LeaderboardEntry.username` |

---

## Features to Build

### Feature 1: User Registration
**Objective:** Allow users to register with a username and avatar, persist to database.

| Task | Priority | Complexity |
|------|----------|------------|
| 1.1 Update context from Team to User-based | High | Medium |
| 1.2 Connect entry-screen to `/api/register` | High | Low |
| 1.3 Store username in localStorage | High | Low |
| 1.4 Handle registration errors (username taken) | Medium | Low |

### Feature 2: Daily Trivia Game
**Objective:** Fetch questions from API, submit answers, show real scoring.

| Task | Priority | Complexity |
|------|----------|------------|
| 2.1 Fetch questions from `/api/trivia/daily` | High | Medium |
| 2.2 Transform question format (API → component) | High | Medium |
| 2.3 Submit answers to `/api/trivia/daily/answer` | High | Medium |
| 2.4 Display answer results from API | High | Low |
| 2.5 Track already-answered questions | Medium | Low |
| 2.6 Handle time-based scoring | Medium | Medium |

### Feature 3: Leaderboard
**Objective:** Display real-time leaderboard with auto-refresh.

| Task | Priority | Complexity |
|------|----------|------------|
| 3.1 Fix type alignment (team → user) | High | Low |
| 3.2 Map API response fields correctly | High | Low |
| 3.3 Highlight current user in rankings | Medium | Low |

### Feature 4: Player Profiles (Super Bowl Heroes)
**Objective:** Fetch player data from API, display stats and trivia.

| Task | Priority | Complexity |
|------|----------|------------|
| 4.1 Create useSWR hook for `/api/players` | High | Low |
| 4.2 Transform JSONB stats to display format | Medium | Medium |
| 4.3 Add loading states | Low | Low |

### Feature 5: Photo Gallery
**Objective:** Display, upload, and like photos via API.

| Task | Priority | Complexity |
|------|----------|------------|
| 5.1 Fetch photos from `/api/photos` | High | Low |
| 5.2 Implement photo upload to `/api/photos/upload` | Medium | Medium |
| 5.3 Implement like/unlike with `/api/photos/[id]/like` | Medium | Low |
| 5.4 Track user's liked photos | Medium | Low |

---

## Integration Tasks (Step-by-Step)

### Phase 1: Fix Type Alignment & Context (Foundation)

#### Task 1.1: Create User Context to Replace Team Context
**File:** `lib/user-context.tsx` (new)

```typescript
// Key changes:
// - Replace Team interface with User from database.types
// - Change localStorage keys to use username
// - Add methods to check if user is registered
```

**Acceptance Criteria:**
- [ ] New `UserProvider` component created
- [ ] `useUser` hook returns current user
- [ ] User persisted to localStorage
- [ ] Context loads user on mount

#### Task 1.2: Update Entry Screen Registration
**File:** `components/entry-screen.tsx`

**Changes:**
- Replace `useTeam` with `useUser`
- Call `POST /api/register` on form submit
- Handle 409 (username taken) error
- Store user in context on success

**Acceptance Criteria:**
- [ ] Form submits to API
- [ ] Error shown when username taken
- [ ] User stored in context on success
- [ ] Navigation to trivia works

---

### Phase 2: Trivia Game Integration

#### Task 2.1: Fetch Questions from API
**File:** `components/trivia-game.tsx`

**Current Code (mock data):**
```typescript
const [questions] = useState<TriviaQuestion[]>(() =>
  [...sampleQuestions].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_DAY)
);
```

**New Code (API):**
```typescript
const { data, error, isLoading } = useSWR(
  username ? '/api/trivia/daily' : null,
  (url) => fetch(url, { headers: { 'x-username': username } }).then(r => r.json())
);
```

**Acceptance Criteria:**
- [ ] Questions fetched from API
- [ ] Loading state shown while fetching
- [ ] Error state handled
- [ ] Demo mode works without API

#### Task 2.2: Transform Question Format
**Issue:** API returns `option_a, option_b, option_c, option_d` but component expects `options: string[]`

**Solution:** Create adapter function:
```typescript
function adaptQuestion(q: TriviaQuestionPublic): TriviaQuestion {
  return {
    id: q.id,
    question: q.question_text,
    imageUrl: q.image_url,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    correctAnswer: -1, // Not used on client
    difficulty: q.difficulty,
    category: q.category || 'General',
  };
}
```

#### Task 2.3: Submit Answers to API
**Current:** Local state updates only
**New:** POST to `/api/trivia/daily/answer`

```typescript
const submitAnswer = async (answerIndex: number) => {
  const answerLetter = ['a', 'b', 'c', 'd'][answerIndex];
  const response = await fetch('/api/trivia/daily/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      question_id: currentQuestion.id,
      selected_answer: answerLetter,
      time_taken_ms: (SECONDS_PER_QUESTION - timeRemaining) * 1000
    })
  });
  const result = await response.json();
  // result.is_correct, result.correct_answer, result.points_earned, etc.
};
```

**Acceptance Criteria:**
- [ ] Answers submitted to API
- [ ] Correct/incorrect shown from API response
- [ ] Points displayed from API
- [ ] Streak tracked correctly

---

### Phase 3: Leaderboard Integration

#### Task 3.1: Fix Type Mapping
**File:** `components/scoreboard.tsx`

**Current Issue:** Component expects `team_id`, `team_name`, `team_image` but API returns `username`, `avatar`

**Fix:**
```typescript
// Old
const userRank = team ? leaderboard.find(entry => entry.team_id === team.id)?.rank : null;

// New
const userRank = user ? leaderboard.find(entry => entry.username === user.username)?.rank : null;
```

**Acceptance Criteria:**
- [ ] Leaderboard displays correctly
- [ ] Current user highlighted
- [ ] Avatar emoji shown correctly
- [ ] Auto-refresh works (30s)

---

### Phase 4: Player Cards Integration

#### Task 4.1: Fetch from API
**File:** `components/player-cards.tsx`

**Current:**
```typescript
import { samplePlayers } from '@/lib/mock-data';
```

**New:**
```typescript
const { data, isLoading } = useSWR('/api/players', fetcher);
const players = data?.players || [];
```

#### Task 4.2: Handle JSONB Stats
API returns `stats` as `Record<string, string | number>`, convert to display format:

```typescript
// API format:
{ "Pass Yds": "206", "TD": "2" }

// Display format:
[{ label: "Pass Yds", value: "206" }, { label: "TD", value: "2" }]
```

**Acceptance Criteria:**
- [ ] Players fetched from API
- [ ] Stats display correctly
- [ ] Trivia facts display as list
- [ ] Loading state shown

---

### Phase 5: Photo Wall Integration

#### Task 5.1: Fetch Photos
```typescript
const { data, mutate } = useSWR(
  `/api/photos?limit=20&username=${username}`,
  fetcher
);
```

#### Task 5.2: Upload Photos
```typescript
const handleUpload = async (file: File, caption: string) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('username', username);
  formData.append('caption', caption);

  await fetch('/api/photos/upload', { method: 'POST', body: formData });
  mutate(); // Refresh list
};
```

#### Task 5.3: Like/Unlike Photos
```typescript
const handleLike = async (photoId: string, hasLiked: boolean) => {
  await fetch(`/api/photos/${photoId}/like`, {
    method: hasLiked ? 'DELETE' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  mutate();
};
```

**Acceptance Criteria:**
- [ ] Photos fetched from API
- [ ] Upload works with preview
- [ ] Like/unlike toggles correctly
- [ ] Like count updates

---

## Testing Checklist

### Demo Mode Testing (No Supabase)
- [ ] App loads without errors
- [ ] Registration returns mock user
- [ ] Trivia displays 5 demo questions
- [ ] Answer submission shows result
- [ ] Leaderboard shows empty state gracefully
- [ ] Player cards show demo data

### Production Mode Testing (With Supabase)
- [ ] User created in `users` table
- [ ] Questions fetched from `trivia_questions`
- [ ] Answers saved to `daily_answers`
- [ ] Points update via trigger
- [ ] Leaderboard shows real rankings
- [ ] Already-answered questions tracked
- [ ] Photos upload to storage
- [ ] Likes persist

### Error Handling
- [ ] Network errors show friendly message
- [ ] 409 (username taken) shows specific error
- [ ] 404 (question not found) handled
- [ ] Loading states prevent double-submit

---

## Recommended Order of Execution

| Order | Phase | Est. Effort | Dependencies |
|-------|-------|-------------|--------------|
| 1 | Create User Context | 1 hour | None |
| 2 | Entry Screen Integration | 30 min | User Context |
| 3 | Trivia Game - Fetch Questions | 1 hour | User Context |
| 4 | Trivia Game - Submit Answers | 1 hour | Fetch Questions |
| 5 | Leaderboard Fix | 30 min | User Context |
| 6 | Player Cards Integration | 45 min | None |
| 7 | Photo Wall Integration | 1.5 hours | User Context |

**Total Estimated Effort:** ~7 hours

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/user-context.tsx` | NEW - User-based context |
| `lib/team-context.tsx` | Deprecate or delete |
| `components/entry-screen.tsx` | Connect to `/api/register` |
| `components/trivia-game.tsx` | Fetch from API, submit answers |
| `components/scoreboard.tsx` | Fix type mapping |
| `components/player-cards.tsx` | Fetch from `/api/players` |
| `components/photo-wall.tsx` | Full API integration |
| `app/page.tsx` or layout | Switch from TeamProvider to UserProvider |

---

## Quick Reference: API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/register` | POST | Register/login user |
| `/api/register?username=X` | GET | Check username exists |
| `/api/trivia/daily` | GET | Get today's questions |
| `/api/trivia/daily/answer` | POST | Submit answer |
| `/api/scoreboard?limit=50` | GET | Get leaderboard |
| `/api/players` | GET | Get player profiles |
| `/api/photos` | GET | Get approved photos |
| `/api/photos/upload` | POST | Upload photo (FormData) |
| `/api/photos/[id]/like` | POST/DELETE | Like/unlike photo |

---

*Last updated: February 2026*
