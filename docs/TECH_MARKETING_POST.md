# We Built a Full-Stack Trivia Platform in 7 Days. Here's How.

**TL;DR:** One week. One developer. One AI-powered toolkit. 97 trivia questions, a live leaderboard, Super Bowl Squares with QR sharing, photo uploads, an expense splitter, and zero-password auth. Next.js 16 + Supabase + Shadcn + v0 + Claude Code did the heavy lifting. Here's the day-by-day breakdown of building fast by standing on the shoulders of giant component libraries and AI pair programmers.

---

## Why One Week?

The Super Bowl doesn't wait. We had the idea on a Monday and needed a working app by Sunday -- not a prototype, not an MVP with asterisks, but something 30+ people could use simultaneously at a party without anything catching fire.

The constraints were brutal and clarifying:

- **No sign-up flow.** Nobody at a party is verifying their email.
- **Every phone must work.** No app store. No downloads. Just a URL.
- **Multiple game modes.** Trivia, Squares, photo sharing, expense splitting.
- **Live synchronization.** During the actual game, everyone sees the same question at the same time.
- **One developer.** No hand-offs. No PR reviews. No meetings about meetings.
- **Move fast.** Reuse everything that's already been solved. Write only the novel parts.

The secret weapon wasn't working harder -- it was never writing code that already existed.

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

But the real accelerant wasn't the framework -- it was the toolchain on top of it:

- **Shadcn/ui** -- 57 pre-built, accessible UI components (buttons, dialogs, forms, cards, dropdowns) dropped in via CLI. Zero time spent on design system primitives.
- **v0.dev** -- Vercel's AI UI generator for rapid screen prototyping. Describe what you want, get a working React component back. Nine separate PRs came from v0-generated code.
- **Claude Code** -- AI pair programmer that handled feature branches end-to-end: trivia logic, Super Bowl Squares, expense splitting, admin controls. Not autocomplete -- full feature implementation across multiple files.

This is the modern solo-developer stack: you write the business logic and the glue. AI writes the boilerplate. A component library handles the UI primitives. You ship in a week what used to take a month.

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

### 1. AI as a Force Multiplier, Not a Crutch

Let's be specific about what the AI tools actually did:

**v0.dev** generated initial UI layouts for 9 different screens. It's excellent at "give me a card grid with these fields" or "build a settings page with these controls." The output isn't production-ready -- you'll refactor naming, tighten types, adjust layouts -- but it gets you from blank file to 70% done in minutes instead of hours. That's 9 screens where I skipped the "stare at an empty editor" phase.

**Claude Code** handled entire feature branches: writing API routes, database queries, React components, and TypeScript types across multiple files in a single pass. The expense splitter, admin controls, trivia category system, and Squares game logic all started as Claude Code branches that got reviewed and merged. It's like having a junior developer who's incredibly fast, never gets tired, and doesn't mind being told to redo things.

The workflow: **I architected. AI drafted. I reviewed and shipped.** The creative and product decisions were mine. The typing was mostly not.

### 2. 57 Shadcn Components = A Design System in One CLI Command

```bash
npx shadcn-ui@latest add button dialog card input form ...
```

57 accessible, composable, Tailwind-styled components. No building a button from scratch. No debugging focus trapping in modals. No accessibility audits on dropdown menus. The Shadcn "new-york" style gave the whole app visual cohesion without a single Figma file.

**Hours saved: ~20+.** That's nearly 3 full days of the timeline just on UI primitives. Instead, those hours went into game logic and the features that actually make FanTrivia unique.

### 3. Supabase = Database + Auth + Storage + Realtime in One Dependency

We didn't evaluate 4 services. We picked one that handled Postgres, Row Level Security, file storage, and real-time subscriptions. The `supabase-js` client talks to all of them.

### 4. Next.js API Routes = No Separate Backend

Every endpoint lives in `/app/api/`. Same repo. Same deploy. Same TypeScript types shared between frontend and backend. Zero CORS configuration.

### 5. JSONB for Evolving Features

The Squares game, player stats, and game settings all use JSONB columns. When requirements changed mid-week (they always do), we added keys instead of migrations.

### 6. Saying "No" Aggressively

No password auth. No native app. No custom design system. No microservices. No WebSocket where polling works. Every "no" bought hours.

---

## By the Numbers

| Metric | Value |
|---|---|
| Development time | 7 days |
| Developers | 1 (+ AI) |
| Trivia questions | 97+ |
| Categories | 15 |
| API routes | 20+ |
| Reused UI components (Shadcn) | 57 |
| v0.dev-generated screens | 9 |
| Claude Code feature branches | 15+ |
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

The 2026 solo-developer stack is unreasonably effective. Here's the layer cake:

1. **Infrastructure layer:** Supabase + Vercel = database, auth, storage, hosting. Zero ops.
2. **UI layer:** Shadcn/ui = 57 accessible components. Zero design system work.
3. **Prototyping layer:** v0.dev = screen layouts from natural language. Zero blank-file paralysis.
4. **Implementation layer:** Claude Code = full feature branches from architecture descriptions. Zero boilerplate typing.
5. **Product layer:** You. The decisions about what to build, what to skip, and what makes it fun.

The AI tools didn't replace the developer. They replaced the tedious parts of development -- the parts where you already know what you want but haven't typed it yet. What's left is the creative work: product decisions, architecture trade-offs, and the details that make people smile (like confetti when you win a square).

**You don't need a team. You need taste, the right stack, and the discipline to say "no" to everything that doesn't ship.**

---

*Built with Next.js 16, React 19, Supabase, TypeScript, 57 Shadcn components, Tailwind CSS, FingerprintJS, SWR, Socket.io, canvas-confetti, v0.dev, Claude Code, and one very long Saturday.*
