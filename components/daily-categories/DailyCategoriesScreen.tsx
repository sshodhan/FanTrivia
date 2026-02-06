'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/user-context';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { useCategoryState } from '@/hooks/useCategoryState';
import { ALL_CATEGORIES } from '@/lib/category-data';
import { TabNavigation } from './TabNavigation';
import { CategoryCard } from './CategoryCard';
import { CategoryListSkeleton } from './CategoryCardSkeleton';
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
  onStartCategory,
  onViewResults,
  onBack,
}: DailyCategoriesScreenProps) {
  const { user } = useUser();
  const countdown = useCountdownTimer();
  const { activeTab, setActiveTab, filteredCategories, tabsWithProgress } =
    useCategoryFilter(completedCategories);

  const categoriesWithState = useCategoryState(
    filteredCategories,
    currentDay,
    completedCategories
  );

  // Overall progress
  const totalCategories = ALL_CATEGORIES.length;
  const completedCount = completedCategories.filter(cp => cp.isCompleted).length;

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
                onPlay={onStartCategory}
                onViewResults={onViewResults}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
