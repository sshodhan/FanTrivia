'use client';

import useSWR from 'swr';
import { useUser } from '@/lib/user-context';
import { AVATARS, type LeaderboardEntry, type AvatarId } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ScoreboardProps {
  onBack: () => void;
  userScore?: { score: number; correctAnswers: number };
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total_count: number;
  has_more: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Scoreboard({ onBack, userScore }: ScoreboardProps) {
  const { user } = useUser();

  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    '/api/scoreboard?limit=50',
    fetcher,
    { refreshInterval: 30000 }
  );

  const leaderboard = data?.leaderboard || [];
  const userRank = user ? leaderboard.find(entry => entry.username === user.username)?.rank : null;

  const getAvatarEmoji = (avatar: AvatarId | string) => {
    return AVATARS[avatar as AvatarId]?.emoji || '🦅';
  };

  // Top 3 get green circular badge, others just show rank number
  const isTopThree = (rank: number) => rank <= 3;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 flex items-center gap-4 border-b border-border">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">
            Leaderboard
          </h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 flex items-center gap-4 border-b border-border">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">
            Leaderboard
          </h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-destructive">Failed to load leaderboard</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 border-b border-border">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">
          Leaderboard
        </h1>
      </header>

      {/* User's Rank Banner */}
      {userRank && user && (
        <div className="p-4 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getAvatarEmoji(user.avatar)}</span>
              <div>
                <div className="font-bold text-foreground">{user.username}</div>
                <div className="text-sm text-muted-foreground">Your rank</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">#{userRank}</div>
              <div className="text-sm text-muted-foreground">
                {leaderboard.find(entry => entry.username === user.username)?.total_points || 0} pts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentUser = user && entry.username === user.username;

            return (
              <div
                key={entry.username}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl transition-all',
                  'bg-[#001B33] border border-[#002244] shadow-sm',
                  'hover:bg-[#002244] hover:border-[#69BE28] hover:scale-[1.01]',
                  'active:scale-[0.99]',
                  isCurrentUser && 'border-[#69BE28]'
                )}
              >
                {/* Rank Badge */}
                {isTopThree(entry.rank) ? (
                  <div className="w-12 h-12 rounded-full bg-[#69BE28] flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-black text-[#002244]">{entry.rank}</span>
                  </div>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-[#A5ACAF]">{entry.rank}</span>
                  </div>
                )}

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#002244] flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{getAvatarEmoji(entry.avatar)}</span>
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'font-bold text-lg truncate leading-tight',
                    isCurrentUser ? 'text-[#69BE28]' : 'text-white'
                  )}>
                    {entry.username}
                    {isCurrentUser && <span className="ml-1 text-xs opacity-70">(You)</span>}
                  </div>
                  <div className="text-sm text-[#A5ACAF]">
                    {entry.days_played} day{entry.days_played !== 1 ? 's' : ''} played
                  </div>
                </div>

                {/* Streak (only show if > 0) */}
                {entry.current_streak > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-lg">🔥</span>
                    <span className="font-bold text-[#FF6B35]">{entry.current_streak}</span>
                  </div>
                )}

                {/* Points */}
                <div className="text-right flex-shrink-0 min-w-[60px]">
                  <div className="text-3xl font-black text-[#69BE28] leading-none">
                    {entry.total_points}
                  </div>
                  <div className="text-sm font-medium text-[#A5ACAF]">pts</div>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No scores yet. Be the first to play!</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onBack}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
