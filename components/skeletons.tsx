'use client'

import { cn } from '@/lib/utils'

// Base skeleton animation styles
const shimmerClass = 'animate-pulse bg-muted/50'

interface SkeletonProps {
  className?: string
}

// Generic skeleton box
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(shimmerClass, 'rounded-md', className)} />
  )
}

// Question card skeleton
export function QuestionSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Timer bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Question card */}
      <div className="bg-card rounded-xl p-6 space-y-4">
        <Skeleton className="h-4 w-24" /> {/* Category */}
        <Skeleton className="h-6 w-full" /> {/* Question line 1 */}
        <Skeleton className="h-6 w-3/4" /> {/* Question line 2 */}
      </div>

      {/* Answer options */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full p-4 rounded-xl border-2 border-border bg-card flex items-center gap-3"
          >
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Scoreboard item skeleton
export function ScoreboardSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Leaderboard items */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-card rounded-xl"
          >
            <Skeleton className="w-8 h-8 rounded-full" /> {/* Rank */}
            <Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" /> {/* Team name */}
              <Skeleton className="h-3 w-20" /> {/* Stats */}
            </div>
            <Skeleton className="h-6 w-16" /> {/* Points */}
          </div>
        ))}
      </div>
    </div>
  )
}

// Player card skeleton
export function PlayerCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-square" /> {/* Image */}
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" /> {/* Name */}
        <Skeleton className="h-3 w-1/2" /> {/* Position */}
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" /> {/* Stat badge */}
          <Skeleton className="h-6 w-16 rounded-full" /> {/* Stat badge */}
        </div>
      </div>
    </div>
  )
}

// Player cards grid skeleton
export function PlayerCardsGridSkeleton() {
  return (
    <div className="p-4">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Photo card skeleton
export function PhotoCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-square" /> {/* Image */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" /> {/* Avatar */}
          <Skeleton className="h-3 w-24" /> {/* Team name */}
        </div>
        <Skeleton className="h-3 w-full" /> {/* Caption */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" /> {/* Like button */}
          <Skeleton className="h-3 w-16" /> {/* Timestamp */}
        </div>
      </div>
    </div>
  )
}

// Photo wall skeleton
export function PhotoWallSkeleton() {
  return (
    <div className="p-4">
      <div className="columns-2 md:columns-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="mb-4 break-inside-avoid">
            <PhotoCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}

// Home screen skeleton
export function HomeScreenSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Logo area */}
      <div className="text-center space-y-4">
        <Skeleton className="w-16 h-16 rounded-full mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
      </div>

      {/* Team card */}
      <div className="bg-card rounded-xl p-4 flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Daily trivia card */}
      <div className="bg-card rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="bg-card rounded-xl p-4 space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}
