'use client';

import { useState, useEffect } from 'react';
import { sampleScores } from '@/lib/mock-data';
import { useTeam } from '@/lib/team-context';
import type { Score } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { teamAvatars } from '@/lib/mock-data';

interface ScoreboardProps {
  onBack: () => void;
  userScore?: { score: number; correctAnswers: number };
}

export function Scoreboard({ onBack, userScore }: ScoreboardProps) {
  const { team } = useTeam();
  const [scores, setScores] = useState<Score[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    // Simulate loading scores and adding user's score
    let allScores = [...sampleScores];
    
    if (team && userScore) {
      const userScoreEntry: Score = {
        id: team.id,
        teamId: team.id,
        teamName: team.name,
        teamImage: team.imageUrl,
        points: userScore.score,
        correctAnswers: userScore.correctAnswers,
        totalAnswers: 5,
        streak: 1,
        lastPlayedDate: new Date().toISOString().split('T')[0],
      };
      
      // Check if user already exists
      const existingIndex = allScores.findIndex(s => s.teamId === team.id);
      if (existingIndex >= 0) {
        allScores[existingIndex].points += userScore.score;
        allScores[existingIndex].correctAnswers += userScore.correctAnswers;
        allScores[existingIndex].totalAnswers += 5;
      } else {
        allScores.push(userScoreEntry);
      }
    }
    
    // Sort by points descending
    allScores.sort((a, b) => b.points - a.points);
    setScores(allScores);
    
    // Find user's rank
    if (team) {
      const rank = allScores.findIndex(s => s.teamId === team.id);
      if (rank >= 0) setUserRank(rank + 1);
    }
  }, [team, userScore]);

  const getAvatarEmoji = (imageUrl: string | null) => {
    if (!imageUrl) return '🦅';
    const avatar = teamAvatars.find(a => a.id === imageUrl);
    return avatar?.emoji || '🦅';
  };

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
              <span className="text-2xl">{getAvatarEmoji(team.imageUrl)}</span>
              <div>
                <div className="font-bold text-foreground">{team.name}</div>
                <div className="text-sm text-muted-foreground">Your rank</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">#{userRank}</div>
              <div className="text-sm text-muted-foreground">
                {scores.find(s => s.teamId === team.id)?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {scores.map((score, index) => {
            const rank = index + 1;
            const isCurrentUser = team && score.teamId === team.id;
            
            return (
              <div
                key={score.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl transition-all',
                  isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'bg-card'
                )}
              >
                {/* Rank */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  getRankStyle(rank)
                )}>
                  {rank <= 3 ? getRankIcon(rank) : rank}
                </div>

                {/* Avatar */}
                <span className="text-2xl">{getAvatarEmoji(score.teamImage)}</span>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'font-bold truncate',
                    isCurrentUser ? 'text-primary' : 'text-foreground'
                  )}>
                    {score.teamName}
                    {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {score.correctAnswers}/{score.totalAnswers} correct
                    {score.streak > 1 && (
                      <span className="ml-2 text-primary">🔥 {score.streak}</span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className={cn(
                    'text-xl font-bold',
                    isCurrentUser ? 'text-primary' : 'text-foreground'
                  )}>
                    {score.points}
                  </div>
                  <div className="text-xs text-muted-foreground">pts</div>
                </div>
              </div>
            );
          })}
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
