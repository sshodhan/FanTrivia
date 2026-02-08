# Super Bowl Squares - Game Guide & Behavior Documentation

## What Is It?

A digital version of the classic Super Bowl Squares party game. Create a 10x10 grid, invite friends to claim squares, and win based on the last digit of each quarter's score.

---

## How To Play

### 1. Create a Game (Admin)

1. Tap **Super Bowl Squares** from the main menu
2. Tap **New Game**
3. Fill in:
   - **Game Name** (required) - e.g. "Super Bowl LIX Party"
   - **Team A / Team B** - defaults to Seahawks vs Patriots
   - **Entry Fee** (optional) - display only, no payment processing
   - **Max Squares Per Player** (optional) - leave blank for unlimited
   - **Require Login** toggle - if on, only logged-in users can claim
4. Tap **Create Game**
5. Share the 6-character code or QR code with friends

### 2. Join a Game (Player)

- Tap **Join Game** and enter the 6-character code
- OR scan the QR code shared by the admin
- OR click a shared link with `?squares=CODE`

### 3. Claim Squares (Game Status: Open)

- **Single select**: Tap any empty square (shows `+`) → claim sheet appears → tap **Claim Square**
- **Multi-select**: Tap **Select Multiple** → tap multiple empty squares → tap **Claim All**
- Logged-in users: Name is auto-filled, just pick an emoji
- Anonymous users: Enter your name and pick an emoji
- **To unclaim**: Tap your own claimed square → confirm removal → square is freed

### 4. Lock the Board (Admin)

1. Scroll to **Game Controls** below the grid
2. Tap **Lock Board & Assign Numbers**
3. Confirm the action
4. Random numbers 0-9 are assigned to each row and column
5. A slot-machine animation reveals the numbers
6. No more squares can be claimed or freed after locking

### 5. Enter Scores (Admin)

1. After each quarter ends, enter both team scores
2. Tap **Submit Q1 Score** (then Q2, Q3, Q4)
3. The system automatically:
   - Finds the winning square (last digit of each score)
   - Highlights the winner on the grid with a trophy
   - Shows a winner announcement banner
   - Fires confetti if the square is claimed

### 6. Game Complete

After Q4 scores are entered, the game is marked complete. All 4 quarter results are shown.

---

## How Winners Are Determined

1. Take the **last digit** of each team's score
2. Team A's last digit → find which **row** has that number
3. Team B's last digit → find which **column** has that number
4. The square at that (row, column) intersection wins

**Example:** Score is Seahawks 17, Patriots 23
- Last digits: 7 (Seahawks), 3 (Patriots)
- Find row labeled `7`, column labeled `3`
- Whoever claimed that square wins the quarter

**Unclaimed squares:** If the winning square was never claimed, it shows "No winner (unclaimed)" for that quarter.

---

## Admin Controls Reference

| Control | When Available | What It Does |
|---------|---------------|--------------|
| **Lock Board & Assign Numbers** | Game is open | Locks claims, shuffles and assigns 0-9 to rows/columns |
| **Auto-fill Empty Squares** | Game is open, board not full | Round-robin among existing players OR assign to "House" |
| **Player List** | Game is open, 1+ players | Shows each player's emoji, color, and square count |
| **Reshuffle Numbers** | Game is locked, no scores yet | Re-randomizes row/column numbers |
| **Submit Q[N] Score** | Game is locked or in progress | Enter cumulative scores for the quarter |
| **Undo Q[N] Score** | After any score entered | Removes last quarter's score and winner |
| **Audit Log** | Always | Shows timestamped log of all admin actions |

---

## Square States

| State | Visual | When |
|-------|--------|------|
| **Unclaimed** | `+` icon, subtle pulse | No one has claimed it yet |
| **Selected** | Dashed green border | You tapped it but haven't confirmed |
| **Claimed** | Player emoji + initials + color stripe | Another player owns it |
| **Mine** | Green ring around the cell | You own this square |
| **Winner** | Trophy icon + gold glow + quarter badge | This square won a quarter |

---

## Sharing Options

- **6-character code**: Displayed prominently, tap to copy
- **Share button**: Uses native device share (or clipboard fallback)
- **QR code**: Tap "Show QR Code" to display a scannable invite
- **Entry fee note**: If set, shown below the share code as info only

---

## Permissions

| Action | Admin (Creator) | Player (Owner) | Other Players |
|--------|----------------|----------------|---------------|
| Create game | Yes | - | - |
| Claim empty square | Yes | Yes | Yes |
| Remove own square (open) | Yes | Yes | Yes |
| Remove any square (open) | Yes | No | No |
| Lock board | Yes | No | No |
| Enter scores | Yes | No | No |
| Undo scores | Yes | No | No |
| Reshuffle numbers | Yes | No | No |
| Bulk fill squares | Yes | No | No |
| View audit log | Yes | No | No |
| View game & grid | Yes | Yes | Yes |
| Share game code | Yes | Yes | Yes |

---

## Game Lifecycle

```
  ┌──────────┐     Lock Board      ┌──────────┐
  │   OPEN   │ ──────────────────→  │  LOCKED  │
  │          │                      │          │
  │ Claiming │                      │ Numbers  │
  │ allowed  │                      │ assigned │
  └──────────┘                      └────┬─────┘
                                         │
                                    Q1 Score
                                         │
                                    ┌────▼─────────┐
                                    │ IN_PROGRESS   │
                                    │               │
                                    │ Q2, Q3 scores │
                                    └────┬──────────┘
                                         │
                                    Q4 Score
                                         │
                                    ┌────▼─────┐
                                    │ COMPLETED │
                                    │           │
                                    │ All done  │
                                    └───────────┘
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Score 0-0** | Last digits are 0 and 0, winning square is at row=0, col=0 |
| **Overtime** | Q4 score includes OT — enter the final score |
| **Same winner twice** | Same player can win multiple quarters |
| **Unclaimed winning square** | Shows "No winner (unclaimed)" — no winner record created |
| **Max squares reached** | Claim sheet shows error, server rejects the request |
| **Race condition (duplicate claim)** | Server returns 409 conflict, first claim wins |
| **Admin undoes Q1** | Game status reverts to "locked" |
| **Admin undoes Q2/Q3** | Game status stays "in_progress" |
| **Reshuffle after scores** | Not allowed — button hidden, server rejects |

---

## Real-Time Updates

- **Primary**: SWR polls every 5 seconds during active gameplay
- **Enhanced**: `useSquaresRealtime` hook polls every 2 seconds when the page is visible
- **Detection**: Compares game `updated_at` timestamp and entry count
- When a change is detected, the grid, winners, and controls refresh automatically

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `squares_games` | Game configuration and scores | name, status, row/col_numbers, q1-q4 scores |
| `squares_entries` | Player square claims | game_id, row_index, col_index, player_name |
| `squares_winners` | Quarter winner records | game_id, quarter, player_name, scores |
| `squares_audit_log` | Admin action history | game_id, action, details, performed_by |

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/squares` | List/fetch games |
| POST | `/api/squares` | Create game |
| POST | `/api/squares/entries` | Claim squares |
| DELETE | `/api/squares/entries` | Remove a square |
| GET | `/api/squares/join?code=X` | Join by share code |
| POST | `/api/squares/lock` | Lock board |
| POST | `/api/squares/scores` | Enter quarter scores |
| POST | `/api/squares/undo-score` | Undo quarter score |
| POST | `/api/squares/reshuffle` | Reshuffle numbers |
| POST | `/api/squares/reassign` | Reassign square to player |
| POST | `/api/squares/bulk-fill` | Auto-fill empty squares |
| GET/POST | `/api/squares/audit` | View/create audit logs |

---

## File Structure

```
components/squares/
  squares-game-screen.tsx    Main orchestrator (lobby, create, join, game views)
  squares-grid.tsx           10x10 grid with number headers
  square-cell.tsx            Individual cell with 5 visual states
  claim-square-sheet.tsx     Bottom sheet for claiming squares
  multi-select-toolbar.tsx   Multi-select mode toggle and actions
  admin-controls.tsx         Admin panel (lock, scores, undo, etc.)
  share-section.tsx          Share code, QR code, share button
  create-game-form.tsx       New game form with settings
  number-reveal.tsx          Slot-machine number reveal animation

hooks/
  useSquaresRealtime.ts      Fast polling for real-time updates

lib/
  squares-utils.ts           Utility functions, colors, emojis, shuffle
  database.types.ts          TypeScript interfaces for all tables

app/api/squares/
  route.ts                   Create and list games
  entries/route.ts           Claim and remove squares
  lock/route.ts              Lock board and assign numbers
  scores/route.ts            Enter scores and determine winners
  join/route.ts              Join game by share code
  audit/route.ts             Audit log CRUD
  undo-score/route.ts        Undo quarter scores
  reshuffle/route.ts         Reshuffle numbers
  reassign/route.ts          Reassign square to different player
  bulk-fill/route.ts         Auto-fill empty squares

supabase/migrations/
  20260208_squares_v2_enhancements.sql   Schema with all 4 tables + RLS
```
