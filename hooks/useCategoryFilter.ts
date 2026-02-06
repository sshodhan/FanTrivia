'use client';

import { useState, useMemo } from 'react';
import type { TabFilter, Category, CategoryProgress } from '@/lib/category-types';
import { ALL_CATEGORIES, CATEGORY_TABS } from '@/lib/category-data';

export function useCategoryFilter(completedCategories: CategoryProgress[]) {
  const [activeTab, setActiveTab] = useState<TabFilter>('daily');

  const filteredCategories = useMemo(() => {
    return ALL_CATEGORIES.filter(cat => cat.pillFilters.includes(activeTab));
  }, [activeTab]);

  const tabsWithProgress = useMemo(() => {
    return CATEGORY_TABS.map(tab => {
      const tabCategories = ALL_CATEGORIES.filter(cat =>
        cat.pillFilters.includes(tab.id)
      );
      const completedCount = tabCategories.filter(cat =>
        completedCategories.some(cp => cp.categoryId === cat.id && cp.isCompleted)
      ).length;

      return {
        ...tab,
        count: tabCategories.length,
        completed: completedCount,
        total: tabCategories.length,
      };
    });
  }, [completedCategories]);

  return {
    activeTab,
    setActiveTab,
    filteredCategories,
    tabsWithProgress,
  };
}
