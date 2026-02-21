# We Built a Full-Stack Trivia Platform in 7 Days. Here's How.

**TL;DR:** One week. One developer. 97 trivia questions, a live leaderboard, Super Bowl Squares with QR sharing, photo uploads, an expense splitter, and zero-password auth. Next.js 16 + Supabase did the heavy lifting. Here's the day-by-day breakdown.

---

## Why One Week?

The Super Bowl doesn't wait. We had the idea on a Monday and needed a working app by Sunday -- not a prototype, not an MVP with asterisks, but something 30+ people could use simultaneously at a party without anything catching fire.

The constraints were brutal and clarifying:

- **No sign-up flow.** Nobody at a party is verifying their email.
- **Every phone must work.** No app store. No downloads. Just a URL.
- **Multiple game modes.** Trivia, Squares, photo sharing, expense splitting.
- **Live synchronization.** During the actual game, everyone sees the same question at the same time.
- **One developer.** No hand-offs. No PR reviews. No meetings about meetings.

Here's how each day went.

---

## Day 1: Foundation (Monday)

**Shipped:** Project scaffolding, database schema, auth system

The single best decision of the whole week: **Supabase + Next.js API routes.** This combo eliminated entire categories of work:

```
Frontend:   Next.js 16 + React 19 + TypeScript 5
UI:         Radix UI + Tailwind CSS 4
Backend:    Next.js API Routes (stateless)
Database:   Supabase (Postgres + Row Level Security)
Auth:       FingerprintJS
Deploy:     Vercel
```

No Kubernetes. No microservices. No separate backend repo. No Docker Compose file that "works on my machine."

For auth, we skipped every conventional approach and used **FingerprintJS** for device-level identification:

```
userId = `${username}_${random4Digits}`
```

Pick a username, pick an avatar, you're in. The device fingerprint handles returning-user detection. Total time from "open URL" to "playing trivia": ~8 seconds.

Is this enterprise-grade? No. Did it save two full days of auth plumbing? Yes.

**Time saved by saying no:** OAuth integration (~4 hrs), email verification flow (~3 hrs), password reset (~2 hrs), session management (~2 hrs). That's 11 hours -- nearly 1.5 days of the entire timeline.

---

## Day 2: The Trivia Engine (Tuesday)

**Shipped:** Question database, category system, scoring, timer

97 questions across 15 categories, seeded via SQL:

- Super Bowl XLVIII, Legion of Boom, Russell Wilson Era
- Seahawks Legends, 2025 Season Stats, Hall of Fame
- Franchise Firsts, and 8 more

Each question has a 15-second countdown. Scoring uses base points plus streak bonuses -- get 5 in a row and you're racking up multipliers.

The key architectural choice: **idempotent answer submission.** With 30 phones on party Wi-Fi, double-taps are inevitable:

```typescript
const existing = await getAnswer(userId, questionId);
if (existing) return { already_answered: true, ...existing };
// Only record new answers
```

No duplicate scores. No database constraint errors. No support tickets from angry fans. This took 20 minutes to implement and saved hours of debugging later.

---

## Day 3: Leaderboard + Progressive Unlock (Wednesday)

**Shipped:** Real-time scoreboard, category unlock system, SWR data layer

The leaderboard refreshes every 30 seconds using **SWR's `refreshInterval`**. We considered WebSocket push and rejected it in about 10 minutes:

- SWR gives us stale-while-revalidate (no loading spinners)
- Automatic request deduplication
- Built-in error retry
- Zero server-side connection state

The leaderboard isn't a stock ticker. 30-second staleness is invisible to users. **Choosing boring technology saved an entire day.**

We also built a **progressive category unlock system** -- categories gate by date across the pre-game week. Day 1 opens "Seahawks Legends." Day 5 unlocks "2025 Season Stats." Game day opens the finale. This turned a one-session app into a week-long engagement loop with zero extra backend work -- just a date comparison in the API.

---

## Day 4: Super Bowl Squares (Thursday)

**Shipped:** 10x10 grid, square claiming, board locking, auto-scoring, QR sharing

This was the most complex single feature, and JSONB made it possible in one day:

```sql
squares_data JSONB NOT NULL DEFAULT '{}'
```

One flexible column instead of a rigid schema. When we needed to add Q1/Q2/Q3/Q4 tracking mid-afternoon, it was just another key in the object. No migration. No downtime. No schema debate.

The flow:
1. **Create a game** -- generates a 6-character share code + QR code
2. **Claim squares** -- tap individual cells or batch-select entire rows
3. **Lock the board** -- admin assigns random 0-9 digits to rows/columns
4. **Enter scores** -- quarterly score input
5. **Winner detection** -- last digit of each team's score maps to the grid
6. **Confetti** -- `canvas-confetti` because details matter and it took 15 minutes

---

## Day 5: Social Features (Friday)

**Shipped:** Photo gallery with uploads + likes, expense splitter, party tools

Photo gallery uses Supabase Storage with an admin approval workflow. Like counts update via database triggers -- no application-level counter management.

The expense splitter tracks who bought what for the party and calculates settlements. Not glamorous, but the friend who bought $200 of wings absolutely wants a Venmo breakdown.

---

## Day 6: Live Game Mode + Admin (Saturday)

**Shipped:** Synchronized live trivia, admin dashboard, game state machine

This is where the app shifts from "async daily trivia" to "everyone in the room sees the same question." The game state machine:

```
pre_game → daily → live → ended
```

An admin dashboard controls question progression, pause/resume (halftime), and mode transitions. We poll every 2-3 seconds for game state instead of WebSocket because **Vercel's serverless model makes polling the path of least resistance,** and 3-second latency is fine for trivia.

The admin panel also logs every action for an audit trail -- essential when someone disputes a score after three beers.

---

## Day 7: Polish + Ship (Sunday)

**Shipped:** Error tracking, PWA service worker, confetti, avatars, edge cases

Morning was bug fixes and the error tracking system (client + server loggers with breadcrumbs). Afternoon was the stuff that makes it feel finished: 12 avatar options, streak animations, responsive layout testing on 6 different phone sizes.

Deployed to Vercel. Shared the URL. Done.

---

## The Cheat Codes (What Made 7 Days Possible)

### 1. Supabase = Database + Auth + Storage + Realtime in one dependency

We didn't evaluate 4 services. We picked one that handled Postgres, Row Level Security, file storage, and real-time subscriptions. The `supabase-js` client talks to all of them.

### 2. Radix UI + Shadcn = 50+ components without building a design system

Accessible, composable, unstyled primitives + a Tailwind-based component library. We never once wrote a modal from scratch or debugged focus trapping.

### 3. Next.js API routes = No separate backend

Every endpoint lives in `/app/api/`. Same repo. Same deploy. Same TypeScript types shared between frontend and backend. Zero CORS configuration.

### 4. JSONB for evolving features

The Squares game, player stats, and game settings all use JSONB columns. When requirements changed mid-week (they always do), we added keys instead of migrations.

### 5. Saying "no" aggressively

No password auth. No native app. No custom design system. No microservices. No WebSocket where polling works. Every "no" bought hours.

---

## By the Numbers

| Metric | Value |
|---|---|
| Development time | 7 days |
| Developers | 1 |
| Trivia questions | 97+ |
| Categories | 15 |
| API routes | 20+ |
| UI components | 50+ |
| Database tables | 10 |
| Lines of SQL schema | 475 |
| Time to first question | ~8 seconds |
| Passwords required | 0 |
| App store approvals | 0 |

---

## What We'd Do With a Day 8

**Tests.** Schema validation exists, but there's no integration test suite. For a one-week app, this was the right trade-off. For anything longer-lived, we'd test every API route against Supabase's local dev stack.

**Push notifications.** The service worker is registered but push isn't wired up. "New category unlocked!" would have bumped daily returns.

**WebSocket for live mode only.** Polling works. But during the actual Super Bowl, true push would shave 1-2 seconds off question reveals. Worth it for that one use case.

---

## The Takeaway

The modern web stack is absurdly powerful for fast builds. Next.js 16 + Supabase + Vercel eliminated entire categories of infrastructure work. Radix UI + Tailwind eliminated design system work. FingerprintJS eliminated auth work.

What's left is just the product: trivia logic, game mechanics, and the details that make people smile (like confetti when you win a square).

**You don't need a month. You need a week, the right stack, and the discipline to say "no" to everything that doesn't ship.**

---

*Built with Next.js 16, React 19, Supabase, TypeScript, Radix UI, Tailwind CSS, FingerprintJS, SWR, Socket.io, canvas-confetti, and one very long Saturday.*
