'use client';

import { useState, useEffect } from 'react';
import { sampleLeaderboard, teamAvatars } from '@/lib/mock-data';
import { useTeam } from '@/lib/team-context';
import { AVATARS, type LeaderboardEntry, type AvatarId } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { useTeam } from '@/lib/team-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { teamAvatars } from '@/lib/mock-data';
import type { LeaderboardEntry } from '@/lib/database.types';

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
  const { team } = useTeam();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/scoreboard');
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.leaderboard || []);

          // Find user's rank
          if (team) {
            const rank = data.leaderboard?.findIndex((entry: LeaderboardEntry) =>
              entry.username === team.name
            );
            if (rank >= 0) setUserRank(rank + 1);
          }
        } else {
          // Fallback to sample data
          setLeaderboard(sampleLeaderboard);
        }
      } catch {
        // Fallback to sample data
        setLeaderboard(sampleLeaderboard);
      } finally {
        setIsLoading(false);
      }
    }
  
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    '/api/scoreboard?limit=50',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  const leaderboard = data?.leaderboard || [];
  const userRank = team ? leaderboard.find(entry => entry.team_id === team.id)?.rank : null;

    fetchLeaderboard();
  }, [team]);

  const getAvatarEmoji = (avatar: AvatarId | string) => {
    return AVATARS[avatar as AvatarId]?.emoji || '🦅';
  };

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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-500';
    if (rank === 2) return 'bg-gray-300/20 text-gray-300';
    if (rank === 3) return 'bg-amber-600/20 text-amber-600';
    return 'bg-muted text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading leaderboard...</div>
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
      {userRank && team && (
        <div className="p-4 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getAvatarEmoji(team.imageUrl || 'hawk')}</span>
              <div>
                <div className="font-bold text-foreground">{team.name}</div>
                <div className="text-sm text-muted-foreground">Your rank</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">#{userRank}</div>
              <div className="text-sm text-muted-foreground">
                {leaderboard.find(e => e.username === team.name)?.total_points || 0} pts
                {leaderboard.find(entry => entry.team_id === team.id)?.total_points || 0} pts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentUser = team && entry.username === team.name;

            return (
              <div
                key={entry.username}
            const isCurrentUser = team && entry.team_id === team.id;
            
            return (
              <div
                key={entry.team_id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl transition-all',
                  isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'bg-card'
                )}
              >
                {/* Rank */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  getRankStyle(entry.rank)
                )}>
                  {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                </div>

                {/* Avatar */}
                <span className="text-2xl">{getAvatarEmoji(entry.avatar)}</span>
                <span className="text-2xl">{getAvatarEmoji(entry.team_image)}</span>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'font-bold truncate',
                    isCurrentUser ? 'text-primary' : 'text-foreground'
                  )}>
                    {entry.username}
                    {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.days_played} days played
                    {entry.current_streak > 1 && (
                      <span className="ml-2 text-primary">🔥 {entry.current_streak}</span>
                    {entry.team_name}
                    {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.days_played} day{entry.days_played !== 1 ? 's' : ''} played
                    {entry.best_streak > 1 && (
                      <span className="ml-2 text-primary">🔥 {entry.best_streak}</span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className={cn(
                    'text-xl font-bold',
                    isCurrentUser ? 'text-primary' : 'text-foreground'
                  )}>
                    {entry.total_points}
                  </div>
                  <div className="text-xs text-muted-foreground">pts</div>
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
