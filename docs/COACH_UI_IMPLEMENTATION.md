# Coach UI Implementation Plan

## Overview

This document outlines the planned changes to add a "Coaches" filter tab to the Player Cards component. The coaching staff data is already in the database (seed_2025_rosters.sql), but the UI needs to be updated to display them properly.

## Database Status

Coaching staff has been added to the database:

### Seahawks Coaching Staff (display_order 25-29)
| Name | Position | display_order |
|------|----------|---------------|
| Mike Macdonald | Head Coach | 25 |
| Klint Kubiak | Offensive Coordinator | 26 |
| Aden Durde | Defensive Coordinator | 27 |
| Leslie Frazier | Assistant Head Coach | 28 |
| John Schneider | General Manager | 29 |

### Patriots Coaching Staff (display_order 125-128)
| Name | Position | display_order |
|------|----------|---------------|
| Mike Vrabel | Head Coach | 125 |
| Josh McDaniels | Offensive Coordinator | 126 |
| DeMarcus Covington | Defensive Coordinator | 127 |
| Eliot Wolf | General Manager | 128 |

## UI Changes Required

### File: `components/player-cards.tsx`

#### 1. Add Position Filter Type (replace UnitFilter)

```typescript
// Change from:
type UnitFilter = 'all' | 'offense' | 'defense' | 'special';

// To:
type PositionFilter = 'all' | 'offense' | 'defense' | 'special-teams' | 'coaches';
```

#### 2. Add Coach Position Detection Helper

```typescript
function isCoachPosition(position: string): boolean {
  const coachPositions = [
    'Head Coach',
    'Offensive Coordinator',
    'Defensive Coordinator',
    'Assistant Head Coach',
    'General Manager',
    'Coordinator',
    'Coach'
  ];
  return coachPositions.some(cp =>
    position.includes(cp) ||
    position.toLowerCase().includes('coach') ||
    position.toLowerCase().includes('coordinator') ||
    position.toLowerCase().includes('manager')
  );
}
```

#### 3. Update Position Category Function

```typescript
function getPositionCategory(position: string): PositionFilter {
  if (isCoachPosition(position)) return 'coaches';

  // ... existing offense, defense, special-teams logic
}
```

#### 4. Add Coaches Tab to Filter

Update `POSITION_FILTERS` array:
```typescript
const POSITION_FILTERS: { id: PositionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'offense', label: 'Offense' },
  { id: 'defense', label: 'Defense' },
  { id: 'special-teams', label: 'Special Teams' },
  { id: 'coaches', label: 'Coaches' },
];
```

#### 5. Show Coaches Tab Only for 2025 Teams

```tsx
{(selectedCategory === '2025-hawks' || selectedCategory === '2025-pats') && (
  // Render position filter tabs including Coaches
)}
```

#### 6. Coach-Specific Display Logic

- **Avatar placeholder**: Show football emoji instead of jersey number
  ```tsx
  {isCoachPosition(player.position) ? (
    <span className="text-5xl">&#x1F3C8;</span>
  ) : (
    <span>#{player.number}</span>
  )}
  ```

- **Hide jersey number badge** in player cards for coaches
- **Hide jersey badge** in detail modal for coaches

## Testing Checklist

- [ ] Coaches tab appears only for 2025-hawks and 2025-pats categories
- [ ] Clicking Coaches tab shows only coaching staff
- [ ] Coach cards display football emoji instead of jersey number
- [ ] Coach detail modal hides jersey number badge
- [ ] All, Offense, Defense, Special Teams filters still work correctly
- [ ] SB48 and HOF categories do not show position filters

## Related Files

- `components/player-cards.tsx` - Main component to modify
- `app/api/players/route.ts` - API already returns coaches in player data
- `supabase/seed_2025_rosters.sql` - Database seed with coach data

## Notes

- Coaches have `jersey_number: 0` in the database
- Coaches have `is_active: true` like current players
- Coach positions use full names: "Head Coach", "Offensive Coordinator", etc.
