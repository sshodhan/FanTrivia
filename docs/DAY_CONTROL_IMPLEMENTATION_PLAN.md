# Day Control Feature - Implementation Plan

## Overview

Add a "Day Control" tab to the Admin Console that allows admins to trigger day progression for trivia questions. This controls which set of trivia questions are shown to users each day.

---

## Current Trivia System Architecture

### How Daily Trivia Works

1. **`game_settings` table** (singleton, id=1) stores:
   - `current_day`: Day identifier string (`day_minus_4`, `day_minus_3`, `day_minus_2`, `day_minus_1`, `game_day`)
   - `current_mode`: Game mode (`pre_game`, `daily`, `live`, `ended`)
   - `questions_per_day`: Number of questions per session (default: 5)
   - `timer_duration`: Seconds per question (default: 15)

2. **Question Selection** (`/app/api/trivia/daily/route.ts`):
   - Fetches questions where `is_active = true`
   - Limits to `questions_per_day` from settings
   - Currently does NOT filter by `day_identifier` - all active questions returned

3. **Day Identifiers**:
   ```
   day_minus_4  → 4 days before game
   day_minus_3  → 3 days before game
   day_minus_2  → 2 days before game
   day_minus_1  → 1 day before game
   game_day     → Game day trivia
   ```

### Key Files

| File | Purpose |
|------|---------|
| `/app/api/trivia/daily/route.ts` | GET daily questions |
| `/app/api/trivia/daily/answer/route.ts` | POST answer submission |
| `/app/api/admin/game/route.ts` | GET/PATCH game settings |
| `/components/admin-console.tsx` | Admin UI (has Roster tab) |
| `/lib/database.types.ts` | TypeScript types |

### Existing Admin API

The backend already supports day changes via PATCH:

```bash
curl -X PATCH http://localhost:3000/api/admin/game \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_SECRET" \
  -d '{"current_day": "day_minus_3"}'
```

---

## Implementation Plan

### Step 1: Add Types and Constants

Add to `admin-console.tsx`:

```typescript
type DayIdentifier = 'day_minus_4' | 'day_minus_3' | 'day_minus_2' | 'day_minus_1' | 'game_day';

interface GameSettings {
  id: number;
  current_mode: string;
  current_day: DayIdentifier;
  questions_per_day: number;
  timer_duration: number;
  scores_locked: boolean;
  live_question_index: number;
  is_paused: boolean;
  updated_at: string;
}

const DAY_OPTIONS: { value: DayIdentifier; label: string; description: string }[] = [
  { value: 'day_minus_4', label: 'Day -4', description: '4 days before game' },
  { value: 'day_minus_3', label: 'Day -3', description: '3 days before game' },
  { value: 'day_minus_2', label: 'Day -2', description: '2 days before game' },
  { value: 'day_minus_1', label: 'Day -1', description: '1 day before game' },
  { value: 'game_day', label: 'Game Day', description: 'Game day trivia' },
];
```

### Step 2: Add Tab to AdminTab Type

Update the type:
```typescript
type AdminTab = 'questions' | 'scores' | 'photos' | 'day-control' | 'settings' | 'roster' | 'logs';
```

Add to tabs array:
```typescript
{ id: 'day-control', label: 'Day Control' },
```

### Step 3: Add State Variables

```typescript
// Day control state
const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
const [dayControlLoading, setDayControlLoading] = useState(false);
const [dayUpdateError, setDayUpdateError] = useState<string | null>(null);
const [dayUpdateSuccess, setDayUpdateSuccess] = useState<string | null>(null);
```

### Step 4: Add API Functions

```typescript
// Fetch game settings
const fetchGameSettings = useCallback(async () => {
  setDayControlLoading(true);
  setDayUpdateError(null);
  try {
    const adminSecret = localStorage.getItem('adminSecret') || '';
    const res = await fetch('/api/admin/game', {
      headers: { 'x-admin-secret': adminSecret },
    });
    const data = await res.json();
    if (data.game_settings) {
      setGameSettings(data.game_settings);
    } else if (data.error) {
      setDayUpdateError(data.error);
    }
  } catch (e) {
    setDayUpdateError('Failed to fetch game settings');
  } finally {
    setDayControlLoading(false);
  }
}, []);

// Update current day
const updateCurrentDay = async (newDay: DayIdentifier) => {
  setDayControlLoading(true);
  setDayUpdateError(null);
  setDayUpdateSuccess(null);
  try {
    const adminSecret = localStorage.getItem('adminSecret') || '';
    const res = await fetch('/api/admin/game', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret,
      },
      body: JSON.stringify({ current_day: newDay }),
    });
    const data = await res.json();
    if (data.game_settings) {
      setGameSettings(data.game_settings);
      setDayUpdateSuccess(`Day updated to ${newDay}`);
      setTimeout(() => setDayUpdateSuccess(null), 3000);
    } else if (data.error) {
      setDayUpdateError(data.error);
    }
  } catch (e) {
    setDayUpdateError('Failed to update day');
  } finally {
    setDayControlLoading(false);
  }
};

// Auto-fetch when tab active
useEffect(() => {
  if (activeTab === 'day-control') {
    fetchGameSettings();
  }
}, [activeTab, fetchGameSettings]);
```

### Step 5: Add UI Components

The Day Control tab should include:

1. **Current Day Status Card**
   - Calendar icon
   - Current day label (e.g., "Day -4")
   - Description (e.g., "4 days before game")
   - Refresh button

2. **Day Selection List**
   - 5 buttons for each day
   - Visual states: Current (highlighted), Next (green), Past (muted with checkmark)
   - Click to change day

3. **Quick Actions**
   - "Advance Day" button (green) - moves to next day
   - "Reset to Day -4" button - resets to beginning

4. **Current Settings Info**
   - Game Mode
   - Questions Per Day
   - Timer Duration
   - Last Updated timestamp

5. **Error/Success Messages**
   - Red error banner
   - Green success banner (auto-dismiss after 3s)

---

## UI Mockup

```
┌─────────────────────────────────────────┐
│  Current Day                      [↻]   │
│  ┌─────────────────────────────────┐    │
│  │ 📅  Day -4                      │    │
│  │     4 days before game          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Select Day                             │
│                                         │
│  [1] Day -4  ─ 4 days before   [Current]│
│  [2] Day -3  ─ 3 days before   [Next]   │
│  [3] Day -2  ─ 2 days before            │
│  [4] Day -1  ─ 1 day before             │
│  [5] Game Day ─ Game day trivia         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Quick Actions                          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ → Advance   │  │ ↺ Reset to Day-4 │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Current Settings                       │
│  Game Mode:        daily                │
│  Questions/Day:    5                    │
│  Timer:            15s                  │
│  Last Updated:     2/6/2026, 10:30 AM   │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Tab appears in admin console navigation
- [ ] Current day displays correctly on load
- [ ] Clicking a day updates the setting
- [ ] "Advance Day" moves to next day
- [ ] "Reset to Day -4" resets correctly
- [ ] Cannot advance past "Game Day"
- [ ] Cannot reset when already on Day -4
- [ ] Error messages display on API failure
- [ ] Success message shows and auto-dismisses
- [ ] Refresh button reloads settings
- [ ] Build compiles without errors

---

## Future Enhancements (Optional)

1. **Day-based Question Filtering**: Modify `/api/trivia/daily` to filter questions by `day_identifier` column
2. **Scheduled Day Advancement**: Add cron job to auto-advance days at midnight
3. **Question Assignment UI**: Allow assigning specific questions to specific days
4. **Day History Log**: Show when days were changed and by whom

---

## Files to Modify

1. `/components/admin-console.tsx` - Add Day Control tab UI and logic

## Dependencies

- Existing `/api/admin/game` endpoint (already supports PATCH)
- Admin authentication via `x-admin-secret` header
- `localStorage.getItem('adminSecret')` for auth token

---

## Notes

- The admin console currently has a **Roster** tab - keep it intact
- Use consistent styling with existing tabs (bg-card, rounded-xl, etc.)
- Follow existing patterns for loading states and error handling
