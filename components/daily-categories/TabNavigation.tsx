'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { TabFilter } from '@/lib/category-types';

interface TabData {
  id: TabFilter;
  emoji: string;
  label: string;
  count: number;
  completed: number;
  total: number;
}

interface TabNavigationProps {
  tabs: TabData[];
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tabIds = tabs.map(t => t.id);
      const currentIndex = tabIds.indexOf(activeTab);

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % tabIds.length;
        onTabChange(tabIds[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
        onTabChange(tabIds[prevIndex]);
      }
    },
    [tabs, activeTab, onTabChange]
  );

  return (
    <div
      className="border-b-2 border-[#001B33] sticky top-0 z-[15] bg-[#002244]"
      role="tablist"
      aria-label="Category filters"
      onKeyDown={handleKeyDown}
    >
      <div className="flex">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const progressPct = tab.total > 0 ? (tab.completed / tab.total) * 100 : 0;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 py-4 px-2 text-center relative transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive ? 'text-primary' : 'text-[#A5ACAF]'
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg" aria-hidden="true">{tab.emoji}</span>
                <span className="text-xs font-bold">{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] font-black',
                    isActive ? 'text-primary' : 'text-[#A5ACAF]'
                  )}
                  aria-label={`${tab.count} categories`}
                >
                  ({tab.count})
                </span>

                {/* Mini progress bar under each tab */}
                {tab.total > 0 && (
                  <div
                    className="w-4/5 h-1 bg-[#001B33] rounded-full overflow-hidden mt-0.5"
                    role="progressbar"
                    aria-valuenow={tab.completed}
                    aria-valuemin={0}
                    aria-valuemax={tab.total}
                    aria-label={`${tab.completed} of ${tab.total} completed`}
                  >
                    <div
                      className="h-full bg-primary rounded-full progress-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(105,190,40,0.5)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
