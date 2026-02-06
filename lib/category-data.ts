import type { Category, CategoryTab, TabFilter } from './category-types';

// Tab configuration
export const CATEGORY_TABS: CategoryTab[] = [
  { id: 'daily', emoji: '📅', label: 'Daily' },
  { id: 'modern-era', emoji: '⚡', label: '2025 Season' },
  { id: 'lob-era', emoji: '💥', label: 'LOB Era' },
  { id: 'heritage', emoji: '📜', label: 'Heritage' },
];

// All categories with unlock progression
export const ALL_CATEGORIES: Category[] = [
  // ========== DAILY TAB (Day 1-5) ==========
  {
    id: 'super-bowl-xlviii',
    title: 'Super Bowl XLVIII',
    emoji: '🏆',
    questionCount: 11,
    unlockDay: 1,
    groupId: 'daily',
    pillFilters: ['daily'],
  },
  {
    id: 'legion-of-boom-defense',
    title: 'Legion of Boom Defense',
    emoji: '🛡️',
    questionCount: 6,
    unlockDay: 2,
    groupId: 'daily',
    pillFilters: ['daily', 'lob-era'],
  },
  {
    id: 'russell-wilson-era',
    title: 'Russell Wilson Era',
    emoji: '🎯',
    questionCount: 6,
    unlockDay: 3,
    groupId: 'daily',
    pillFilters: ['daily'],
  },
  {
    id: 'seahawks-legends',
    title: 'Seahawks Legends',
    emoji: '⭐',
    questionCount: 6,
    unlockDay: 4,
    groupId: 'daily',
    pillFilters: ['daily', 'heritage'],
  },
  {
    id: 'players-and-numbers',
    title: 'Players & Numbers',
    emoji: '🔢',
    questionCount: 6,
    unlockDay: 5,
    groupId: 'daily',
    pillFilters: ['daily'],
  },

  // ========== LOB ERA TAB ==========
  {
    id: 'lob-secondary',
    title: 'LOB Secondary',
    emoji: '🔒',
    questionCount: 6,
    unlockDay: 2,
    groupId: 'lob-era',
    pillFilters: ['lob-era'],
  },

  // ========== HERITAGE TAB (Day 4-9) ==========
  {
    id: 'seahawks-history',
    title: 'Seahawks History',
    emoji: '📚',
    questionCount: 6,
    unlockDay: 7,
    groupId: 'heritage',
    pillFilters: ['heritage'],
  },
  {
    id: 'memorable-moments',
    title: 'Memorable Moments',
    emoji: '🎬',
    questionCount: 6,
    unlockDay: 5,
    groupId: 'heritage',
    pillFilters: ['heritage'],
  },
  {
    id: 'stadium-and-12s',
    title: 'Stadium & 12s',
    emoji: '🏟️',
    questionCount: 5,
    unlockDay: 6,
    groupId: 'heritage',
    pillFilters: ['heritage'],
  },
  {
    id: 'seahawks-legends-heritage',
    title: 'Seahawks Legends',
    emoji: '👑',
    questionCount: 6,
    unlockDay: 4,
    groupId: 'heritage',
    pillFilters: ['heritage'],
  },
  {
    id: 'hall-of-fame',
    title: 'Hall of Fame',
    emoji: '🏛️',
    questionCount: 6,
    unlockDay: 8,
    groupId: 'heritage',
    pillFilters: ['heritage'],
  },
  {
    id: 'franchise-firsts',
    title: 'Franchise Firsts',
    emoji: '🥇',
    questionCount: 6,
    unlockDay: 9,
    groupId: 'heritage',
    pillFilters: ['heritage'],
  },

  // ========== 2025 SEASON TAB (Day 3-13) ==========
  {
    id: '2025-season-stats',
    title: '2025 Season Stats',
    emoji: '📊',
    questionCount: 8,
    unlockDay: 3,
    groupId: 'modern-era',
    pillFilters: ['modern-era'],
  },
  {
    id: '2025-seahawks-stars',
    title: '2025 Seahawks Stars',
    emoji: '🌟',
    questionCount: 6,
    unlockDay: 11,
    groupId: 'modern-era',
    pillFilters: ['modern-era'],
  },
  {
    id: '2025-comparison-qbs',
    title: '2025 Comparison QBs',
    emoji: '🏈',
    questionCount: 6,
    unlockDay: 4,
    groupId: 'modern-era',
    pillFilters: ['modern-era'],
  },
  {
    id: '2025-defense',
    title: '2025 Defense',
    emoji: '🛡️',
    questionCount: 6,
    unlockDay: 13,
    groupId: 'modern-era',
    pillFilters: ['modern-era'],
  },

  // ========== FINALE (Day 14) ==========
  {
    id: 'super-bowl-connections',
    title: 'Super Bowl Connections',
    emoji: '🏈',
    questionCount: 6,
    unlockDay: 14,
    groupId: 'daily',
    pillFilters: ['daily'],
    isFinale: true,
  },
];

// Map day_identifier strings from game_settings to numeric unlock days
// day_minus_4 = Day 1, day_minus_3 = Day 2, ..., game_day = Day 5
const DAY_IDENTIFIER_MAP: Record<string, number> = {
  day_minus_4: 1,
  day_minus_3: 2,
  day_minus_2: 3,
  day_minus_1: 4,
  game_day: 5,
};

export function dayIdentifierToNumber(dayIdentifier: string): number {
  return DAY_IDENTIFIER_MAP[dayIdentifier] ?? 1;
}

// Get categories for a specific tab
export function getCategoriesByTab(tabId: TabFilter): Category[] {
  return ALL_CATEGORIES.filter(cat => cat.pillFilters.includes(tabId));
}

// Get tab counts
export function getTabCounts(): Record<TabFilter, number> {
  const counts: Record<TabFilter, number> = {
    daily: 0,
    'modern-era': 0,
    'lob-era': 0,
    heritage: 0,
  };

  for (const cat of ALL_CATEGORIES) {
    for (const filter of cat.pillFilters) {
      counts[filter]++;
    }
  }

  return counts;
}
