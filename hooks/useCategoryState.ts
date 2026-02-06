'use client';

import { useMemo } from 'react';
import type { Category, CategoryState, CategoryProgress, CategoryWithState } from '@/lib/category-types';

export function getCategoryState(
  category: Category,
  currentDay: number,
  completedCategories: CategoryProgress[]
): CategoryState {
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
    return categories.map(cat => ({
      ...cat,
      state: getCategoryState(cat, currentDay, completedCategories),
      progress: completedCategories.find(cp => cp.categoryId === cat.id),
    }));
  }, [categories, currentDay, completedCategories]);
}
