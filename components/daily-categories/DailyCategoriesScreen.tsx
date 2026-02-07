'use client';

import { useEffect, useCallback } from 'react';
import { useUser } from '@/lib/user-context';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';
import { addBreadcrumb } from '@/lib/error-tracking/event-breadcrumbs';
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { useCategoryState } from '@/hooks/useCategoryState';
import { ALL_CATEGORIES } from '@/lib/category-data';
import { TabNavigation } from './TabNavigation';
import { CategoryCard } from './CategoryCard';
import type { DailyCategoriesScreenProps, CategoryProgress } from '@/lib/category-types';

// Mock progress for demo (simulates day 1 with Super Bowl XLVIII completed)
const MOCK_PROGRESS: CategoryProgress[] = [
  {
    categoryId: 'super-bowl-xlviii',
    isCompleted: true,
    score: 11,
    correctAnswers: 11,
    totalQuestions: 11,
    totalPoints: 550,
  },
];

export function DailyCategoriesScreen({
  currentDay = 1,
  completedCategories = MOCK_PROGRESS,
  streak = 1,
  unlockedCategories = [],
  onStartCategory,
  onViewResults,
  onRetakeCategory,
  onBack,
}: DailyCategoriesScreenProps) {
  const { user } = useUser();
  const { activeTab, setActiveTab, filteredCategories, tabsWithProgress } =
    useCategoryFilter(completedCategories);

  const categoriesWithState = useCategoryState(
    filteredCategories,
    currentDay,
    completedCategories,
    unlockedCategories
  );

  // Overall progress
  const totalCategories = ALL_CATEGORIES.length;
  const completedCount = completedCategories.filter(cp => cp.isCompleted).length;

  // Debug: log screen mount and initial state
  useEffect(() => {
    logClientDebug('DailyCategories', 'Screen mounted', {
      currentDay,
      streak,
      completedCount,
      totalCategories,
      userId: user?.user_id,
    }, { force: true });

    addBreadcrumb('navigation', 'Opened Daily Categories screen', {
      currentDay,
      completedCount,
    });
  }, [currentDay, streak, completedCount, totalCategories, user?.user_id]);

  // Debug: log when filtered categories change (tab switch)
  useEffect(() => {
    logClientDebug('DailyCategories', 'Categories filtered', {
      activeTab,
      filteredCount: categoriesWithState.length,
      states: {
        completed: categoriesWithState.filter(c => c.state === 'completed').length,
        unlocked: categoriesWithState.filter(c => c.state === 'unlocked').length,
        lockedSoon: categoriesWithState.filter(c => c.state === 'locked-soon').length,
        lockedFar: categoriesWithState.filter(c => c.state === 'locked-far').length,
      },
    });
  }, [activeTab, categoriesWithState]);

  // Wrapped handlers with logging
  const handleStartCategory = useCallback((categoryId: string) => {
    const category = categoriesWithState.find(c => c.id === categoryId);

    addBreadcrumb('user-action', 'Started category', {
      categoryId,
      categoryTitle: category?.title,
      state: category?.state,
    });

    logClientDebug('DailyCategories', 'Category started', {
      categoryId,
      categoryTitle: category?.title,
      state: category?.state,
      currentDay,
      userId: user?.user_id,
    }, { level: 'info' });

    // Soft error: trying to play a locked category
    if (category && category.state !== 'unlocked' && category.state !== 'completed') {
      logClientError(
        `Attempted to start locked category: ${categoryId} (state: ${category.state}, unlockDay: ${category.unlockDay}, currentDay: ${currentDay})`,
        'DailyCategories Soft Error',
        {
          categoryId,
          state: category.state,
          unlockDay: category.unlockDay,
          currentDay,
          userId: user?.user_id,
        }
      );
      return;
    }

    onStartCategory(categoryId);
  }, [categoriesWithState, currentDay, user?.user_id, onStartCategory]);

  const handleViewResults = useCallback((categoryId: string) => {
    const category = categoriesWithState.find(c => c.id === categoryId);

    addBreadcrumb('user-action', 'Viewed category results', {
      categoryId,
      categoryTitle: category?.title,
    });

    logClientDebug('DailyCategories', 'View results', {
      categoryId,
      categoryTitle: category?.title,
      score: category?.progress?.correctAnswers,
      total: category?.progress?.totalQuestions,
      points: category?.progress?.totalPoints,
    });

    onViewResults(categoryId);
  }, [categoriesWithState, onViewResults]);

  // Soft error: empty state when categories should exist
  useEffect(() => {
    if (filteredCategories.length === 0 && ALL_CATEGORIES.length > 0) {
      logClientError(
        `No categories found for tab "${activeTab}" despite ${ALL_CATEGORIES.length} total categories`,
        'DailyCategories Soft Error',
        {
          activeTab,
          totalCategories: ALL_CATEGORIES.length,
          tabsWithProgress: tabsWithProgress.map(t => ({ id: t.id, count: t.count })),
        }
      );
    }
  }, [filteredCategories.length, activeTab, tabsWithProgress]);

  return (
    <div className="min-h-screen bg-[#002244] pb-24">
      {/* Page Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-[30px] leading-9 font-black text-white tracking-[0.4px]">
          Daily Trivia Challenge
        </h1>
        <p className="text-sm font-medium text-[#A5ACAF] mt-1 tracking-[-0.15px]">
          {completedCount} of {totalCategories} categories completed
        </p>
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabsWithProgress}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Category List */}
      <div
        id={`${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        className="px-4 py-4"
      >
        {categoriesWithState.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#A5ACAF] text-sm">No categories in this filter yet.</p>
          </div>
        ) : (
          categoriesWithState.map((category, index) => (
            <div
              key={category.id}
              className="category-card-enter"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CategoryCard
                category={category}
                currentDay={currentDay}
                onPlay={handleStartCategory}
                onViewResults={handleViewResults}
                onRetake={onRetakeCategory}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
