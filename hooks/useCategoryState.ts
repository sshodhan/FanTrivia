'use client';

import { useMemo } from 'react';
import type { Category, CategoryState, CategoryProgress, CategoryWithState } from '@/lib/category-types';
import { logClientError } from '@/lib/error-tracking/client-logger';

export function getCategoryState(
  category: Category,
  currentDay: number,
  completedCategories: CategoryProgress[]
): CategoryState {
  // Soft error: invalid currentDay
  if (currentDay < 0 || !Number.isFinite(currentDay)) {
    logClientError(
      `Invalid currentDay value: ${currentDay} when computing state for "${category.id}"`,
      'CategoryState Soft Error',
      { categoryId: category.id, currentDay, unlockDay: category.unlockDay }
    );
    return 'locked-far';
  }

  const progress = completedCategories.find(cp => cp.categoryId === category.id);
  if (progress?.isCompleted) return 'completed';
  if (category.unlockDay <= currentDay) return 'unlocked';
  if (category.unlockDay === currentDay + 1) return 'locked-soon';
  return 'locked-far';
}

export function useCategoryState(
  categories: Category[],
  currentDay: number,
  completedCategories: CategoryProgress[]
): CategoryWithState[] {
  return useMemo(() => {
    // Soft error: no categories passed
    if (categories.length === 0) {
      logClientError(
        'useCategoryState called with empty categories array',
        'CategoryState Soft Error',
        { currentDay, completedCount: completedCategories.length }
      );
    }

    return categories.map(cat => ({
      ...cat,
      state: getCategoryState(cat, currentDay, completedCategories),
      progress: completedCategories.find(cp => cp.categoryId === cat.id),
    }));
  }, [categories, currentDay, completedCategories]);
}
