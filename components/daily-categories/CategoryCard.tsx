'use client';

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { logClientError } from '@/lib/error-tracking/client-logger';
import type { CategoryWithState } from '@/lib/category-types';

interface CategoryCardProps {
  category: CategoryWithState;
  currentDay: number;
  onPlay: (id: string) => void;
  onViewResults: (id: string) => void;
  onRetake?: (id: string) => Promise<void>;
}

function CategoryCardComponent({ category, currentDay, onPlay, onViewResults, onRetake }: CategoryCardProps) {
  if (category.isFinale) {
    return <FinaleCard category={category} onPlay={onPlay} />;
  }

  switch (category.state) {
    case 'completed':
      return <CompletedCard category={category} onViewResults={onViewResults} onRetake={onRetake} />;
    case 'unlocked':
      return <UnlockedCard category={category} onPlay={onPlay} />;
    case 'locked-soon':
      return <LockedSoonCard category={category} currentDay={currentDay} />;
    case 'locked-far':
      return <LockedFarCard category={category} currentDay={currentDay} />;
    default:
      // Soft error: unexpected card state
      logClientError(
        `Unexpected category state: "${category.state}" for category "${category.id}"`,
        'CategoryCard Soft Error',
        { categoryId: category.id, state: category.state, currentDay }
      );
      return null;
  }
}

export const CategoryCard = memo(CategoryCardComponent, (prev, next) => {
  return (
    prev.category.id === next.category.id &&
    prev.category.state === next.category.state &&
    prev.currentDay === next.currentDay
  );
});

// ============================================================
// COMPLETED CARD
// ============================================================
function CompletedCard({
  category,
  onViewResults,
  onRetake,
}: {
  category: CategoryWithState;
  onViewResults: (id: string) => void;
  onRetake?: (id: string) => Promise<void>;
}) {
  const [isResetting, setIsResetting] = useState(false);
  const score = category.progress?.correctAnswers ?? 0;
  const total = category.progress?.totalQuestions ?? category.questionCount;
  const points = category.progress?.totalPoints ?? 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const handleRetake = async () => {
    if (!onRetake || isResetting) return;
    setIsResetting(true);
    try {
      await onRetake(category.id);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="category-card bg-[#001B33] border-2 border-primary rounded-2xl p-5 mb-4 shadow-[0_4px_12px_rgba(105,190,40,0.2)]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h3 className="text-lg font-bold text-white">{category.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
      </div>

      <p className="text-sm text-[#A5ACAF] mb-1">
        {category.questionCount} questions &middot; Completed
      </p>
      <p className="text-sm font-semibold text-white">
        Your score: {score}/{total} &middot; {points} points
      </p>

      <div className="flex items-center justify-between mt-4">
        {onRetake && (
          <button
            onClick={handleRetake}
            disabled={isResetting}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-[#A5ACAF] text-sm font-medium rounded-lg transition-colors',
              'hover:text-white hover:bg-white/5',
              isResetting && 'opacity-50 cursor-wait'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            {isResetting ? 'Resetting...' : 'Play Again'}
          </button>
        )}
        <div className={cn(!onRetake && 'ml-auto')}>
          <button
            onClick={() => onViewResults(category.id)}
            className="px-5 py-2.5 border border-primary text-primary rounded-lg text-sm font-bold transition-colors hover:bg-primary/10"
          >
            VIEW RESULTS
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// UNLOCKED CARD (Available to Play)
// ============================================================
function UnlockedCard({
  category,
  onPlay,
}: {
  category: CategoryWithState;
  onPlay: (id: string) => void;
}) {
  return (
    <div className="category-card card-unlocked bg-gradient-to-br from-[#002244] to-[#003355] border-2 border-primary rounded-2xl p-5 mb-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.emoji}</span>
          <h3 className="text-lg font-bold text-white">{category.title}</h3>
        </div>
        <span className="inline-flex items-center gap-1 bg-[#FF8904] text-[#002244] text-xs font-black px-3 py-1 rounded-xl">
          NEW! 🔥
        </span>
      </div>

      <p className="text-sm text-[#A5ACAF] mb-1">
        {category.questionCount} questions &middot; Available now
      </p>
      <p className="text-sm font-semibold text-primary">
        Be the first to complete!
      </p>

      <div className="flex justify-center mt-4">
        <button
          onClick={() => onPlay(category.id)}
          className="play-button px-10 py-3.5 bg-primary text-[#002244] rounded-xl text-base font-black shadow-[0_4px_12px_rgba(105,190,40,0.4)] transition-transform active:scale-[0.96]"
        >
          PLAY NOW
        </button>
      </div>
    </div>
  );
}

// ============================================================
// LOCKED SOON (Unlocks Tomorrow)
// ============================================================
function LockedSoonCard({
  category,
  currentDay,
}: {
  category: CategoryWithState;
  currentDay: number;
}) {
  const daysUntil = category.unlockDay - currentDay;
  const progressRatio = currentDay / category.unlockDay;
  const progressPct = Math.min(Math.round(progressRatio * 100), 100);

  return (
    <div className="category-card bg-[#001B33] border border-[#A5ACAF]/20 rounded-2xl p-5 mb-4 opacity-60">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl opacity-70">🔒</span>
          <h3 className="text-lg font-bold text-[#A5ACAF]">{category.title}</h3>
        </div>
        <span className="inline-flex items-center border border-[#A5ACAF] text-[#A5ACAF] text-xs font-bold px-3 py-1 rounded-lg">
          Day {category.unlockDay}
        </span>
      </div>

      <p className="text-sm text-[#A5ACAF] mb-1">
        {category.questionCount} questions &middot; Unlocks Tomorrow
      </p>

      <div className="flex items-center gap-1 text-[#FF8904] text-sm font-semibold mt-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{daysUntil > 0 ? `Unlocks in ${daysUntil} day${daysUntil > 1 ? 's' : ''}` : 'Unlocking soon'}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-[#A5ACAF] mb-1">
          <span>Progress</span>
          <span>{currentDay}/{category.unlockDay}</span>
        </div>
        <div className="h-1.5 bg-[#A5ACAF]/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOCKED FAR (Multiple Days Away)
// ============================================================
function LockedFarCard({
  category,
  currentDay,
}: {
  category: CategoryWithState;
  currentDay: number;
}) {
  const daysUntil = category.unlockDay - currentDay;

  return (
    <div className="category-card bg-[#001B33] border border-[#A5ACAF]/10 rounded-2xl p-5 mb-4 opacity-40 pointer-events-none">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base opacity-50">🔒</span>
          <h3 className="text-lg font-bold text-[#A5ACAF]">{category.title}</h3>
        </div>
        <span className="inline-flex items-center border border-[#A5ACAF]/50 text-[#A5ACAF]/70 text-xs font-bold px-3 py-1 rounded-lg">
          Day {category.unlockDay}
        </span>
      </div>

      <p className="text-sm text-[#A5ACAF]">
        {category.questionCount} questions
      </p>

      <div className="flex items-center gap-1 text-[#A5ACAF] text-sm font-semibold mt-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Unlocks in {daysUntil} days</span>
      </div>
      <p className="text-xs text-[#A5ACAF]/60 mt-1">
        Complete {daysUntil} more days to unlock
      </p>
    </div>
  );
}

// ============================================================
// FINALE CARD (Special Super Bowl Challenge)
// ============================================================
function FinaleCard({
  category,
  onPlay,
}: {
  category: CategoryWithState;
  onPlay: (id: string) => void;
}) {
  const isUnlocked = category.state === 'unlocked';
  const isCompleted = category.state === 'completed';

  return (
    <div
      className={cn(
        'category-card bg-gradient-to-br from-[#002244] via-[#003355] to-[rgba(105,190,40,0.2)] border-2 border-[#FF8904] rounded-2xl p-6 mb-4 text-center',
        'shadow-[0_12px_24px_rgba(255,137,4,0.3)]',
        !isUnlocked && !isCompleted && 'opacity-60'
      )}
    >
      <div className="text-2xl font-black text-white mb-3">
        🏈 FINAL CHALLENGE 🏈
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
      <p className="text-sm text-[#A5ACAF] mb-4">
        {category.questionCount} questions &middot; Ultimate Test
      </p>

      {isCompleted ? (
        <div className="text-primary font-bold">Completed! You did it!</div>
      ) : isUnlocked ? (
        <button
          onClick={() => onPlay(category.id)}
          className="play-button px-10 py-3.5 bg-primary text-[#002244] rounded-xl text-base font-black shadow-[0_4px_12px_rgba(105,190,40,0.4)] transition-transform active:scale-[0.96]"
        >
          PLAY NOW
        </button>
      ) : (
        <>
          <p className="text-base font-bold text-[#FF8904] mb-2">
            🔥 Unlocks Super Bowl Sunday 🔥
          </p>
          <p className="text-xs text-white/80">
            Complete all 13 categories first
          </p>
        </>
      )}
    </div>
  );
}
