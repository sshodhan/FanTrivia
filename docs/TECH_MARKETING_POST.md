# We Built a Real-Time Trivia Engine for Super Bowl Sunday. Here's the Stack.

**TL;DR:** We shipped a full-stack trivia platform with live game synchronization, device fingerprinting instead of passwords, and a Super Bowl Squares engine that calculates winners in real time -- all on Next.js 16, Supabase, and zero DevOps headaches.

---

## The Problem

Super Bowl parties are chaos. Everyone's on their phone anyway. So we asked: what if we turned that into the game itself?

We needed something that could:

- Serve 97+ trivia questions across 15 categories with a 15-second countdown timer
- Rank players on a live leaderboard that updates every 30 seconds
- Run a full Super Bowl Squares grid with QR-code sharing and automatic winner detection
- Work on every phone at the party without anyone creating an account

That last one was the hard constraint.

---

## The Stack

```
Frontend:   Next.js 16 + React 19 + TypeScript 5
UI:         Radix UI + Tailwind CSS 4
Data:       SWR (stale-while-revalidate) + Socket.io
Backend:    Next.js API Routes (stateless)
Database:   Supabase (Postgres + Row Level Security)
Auth:       FingerprintJS (no passwords, no OAuth)
Deploy:     Vercel
```

No Kubernetes. No microservices. No Lambda cold starts. Just a monorepo that ships.

---

## The Interesting Parts

### 1. Zero-Friction Auth via Device Fingerprinting

Nobody at a Super Bowl party wants to verify their email. So we used [FingerprintJS](https://fingerprint.com) to generate a stable device identifier, then pair it with a self-chosen username to create a user ID:

```
userId = `${username}_${random4Digits}`
```

No passwords. No OAuth flows. No "check your inbox." You pick a name, pick an avatar from 12 options, and you're in. The fingerprint handles returning-user detection so your scores persist across sessions.

Is this enterprise-grade auth? No. Does it get 30 people playing trivia in under 60 seconds? Yes.

### 2. Idempotent Answer Submission

With 30 people hammering "Submit" on spotty party Wi-Fi, duplicate requests are inevitable. Every answer submission endpoint is idempotent -- if you've already answered question 7 in the "Legion of Boom" category, we return your existing answer instead of recording a duplicate. No `UNIQUE` constraint violations. No lost points. No angry fans.

```typescript
// Pseudocode for the approach
const existing = await getAnswer(userId, questionId);
if (existing) return { already_answered: true, ...existing };
```

### 3. Progressive Category Unlocking

We didn't dump all 15 trivia categories on day one. Categories unlock over the week leading up to game day using a date-gated system. Day 1 you get "Seahawks Legends." By Friday you've unlocked "2025 Season Stats." Game day itself opens the final categories.

This keeps engagement up across the whole week instead of the typical "play once, forget" pattern. Retention through artificial scarcity -- it works.

### 4. The Squares Engine

Super Bowl Squares is a classic party game, but managing a 10x10 grid on paper is a nightmare. Our digital version handles:

- **Grid claiming** -- tap to claim a single square or batch-select a row
- **Board locking** -- admin assigns random 0-9 digits to rows and columns
- **Auto-scoring** -- enter the quarterly score, and the app finds the winner by matching the last digit of each team's score to the grid
- **Celebration** -- confetti animations via `canvas-confetti` because shipping details matter

The entire squares state lives in a single JSONB column. No schema migrations when we added Q1/Q2/Q3/Q4 tracking -- just another key in the object.

```sql
-- Flexible enough to evolve without ALTER TABLE
squares_data JSONB NOT NULL DEFAULT '{}'
```

### 5. Live Game Mode with Admin Controls

During the actual Super Bowl, the app switches from async daily trivia to a synchronized live game. An admin dashboard controls:

- Which question is currently displayed (all players see the same one)
- Game pause/resume (halftime bathroom break)
- Game mode transitions: `pre_game -> daily -> live -> ended`

We poll every 2-3 seconds for game state instead of pure WebSocket because Vercel's serverless model plays nicer with polling, and 3-second latency is fine for trivia. Pick the boring technology.

### 6. SWR Over WebSocket for the Leaderboard

The leaderboard refreshes every 30 seconds using SWR's `refreshInterval`. We evaluated full WebSocket push for this and decided it was overengineered for the use case. SWR gives us:

- Automatic deduplication of in-flight requests
- Stale data display while revalidating (no loading spinners)
- Built-in error retry
- Zero server-side state to manage

The leaderboard isn't a stock ticker. 30-second staleness is invisible to users.

---

## What We'd Do Differently

**More tests.** We have schema validation scripts but no integration test suite. For a party app with a one-week shelf life, this was a deliberate trade-off. For anything longer-lived, we'd want API-level tests against the Supabase local dev stack.

**PWA push notifications.** We registered a service worker but never wired up push. "New category unlocked!" notifications would have boosted daily return rates.

**WebSocket for live mode only.** Our polling approach works, but during the live Super Bowl game, true push would have shaved 1-2 seconds off the question reveal. For 99% of usage (daily trivia), polling is the right call.

---

## By the Numbers

| Metric | Value |
|---|---|
| Trivia questions | 97+ |
| Categories | 15 |
| API routes | 20+ |
| UI components | 50+ |
| Database tables | 10 |
| Time to first question | ~8 seconds (including "auth") |
| Auth friction | Zero passwords |
| Lines of SQL schema | 475 |

---

## Try It / Build Your Own

FanTrivia is built for Seahawks fans, but the architecture is team-agnostic. Swap the seed data and categories, and you've got a trivia platform for any fandom.

The core insight: **the best party app is the one nobody has to install or sign up for.** Device fingerprinting + a web app + zero auth friction = maximum participation.

Ship the thing that gets people playing, not the thing that passes a security audit.

---

*Built with Next.js 16, React 19, Supabase, TypeScript, Radix UI, Tailwind CSS, FingerprintJS, SWR, Socket.io, and too much coffee during the playoffs.*
