'use client';

import { useState, useMemo, useCallback } from 'react';
import type { TabFilter, Category, CategoryProgress } from '@/lib/category-types';
import { ALL_CATEGORIES, CATEGORY_TABS } from '@/lib/category-data';
import { logClientDebug } from '@/lib/error-tracking/client-logger';
import { addBreadcrumb } from '@/lib/error-tracking/event-breadcrumbs';

export function useCategoryFilter(completedCategories: CategoryProgress[]) {
  const [activeTab, setActiveTabRaw] = useState<TabFilter>('daily');

  const setActiveTab = useCallback((tab: TabFilter) => {
    addBreadcrumb('user-action', `Switched category tab to "${tab}"`, { tab });
    logClientDebug('CategoryFilter', 'Tab switched', { from: activeTab, to: tab });
    setActiveTabRaw(tab);
  }, [activeTab]);

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
