'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SquaresGame, SquaresEntry, SquaresWinner } from '@/lib/database.types';
import { getLatestQuarter, getWinningSquare, countClaimed, isBoardFull } from '@/lib/squares-utils';

interface AdminControlsProps {
  game: SquaresGame;
  entries: SquaresEntry[];
  winners: SquaresWinner[];
  onGameUpdated: () => void;
  username: string;
}

export function AdminControls({ game, entries, winners, onGameUpdated, username }: AdminControlsProps) {
  const [isLocking, setIsLocking] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [error, setError] = useState('');

  const claimed = countClaimed(entries);
  const boardFull = isBoardFull(entries);
  const latestQuarter = getLatestQuarter(game);
  const nextQuarter = latestQuarter + 1;

  const handleLockBoard = async () => {
    if (!confirm(`Lock the board and assign random numbers? This cannot be undone. ${claimed}/100 squares are claimed.`)) {
      return;
    }

    setIsLocking(true);
    setError('');

    try {
      const response = await fetch('/api/squares/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to lock board');
        return;
      }

      onGameUpdated();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scoreA === '' || scoreB === '') {
      setError('Both scores are required');
      return;
    }

    const parsedA = parseInt(scoreA, 10);
    const parsedB = parseInt(scoreB, 10);

    if (isNaN(parsedA) || isNaN(parsedB) || parsedA < 0 || parsedB < 0) {
      setError('Scores must be non-negative numbers');
      return;
    }

    setIsSubmittingScore(true);
    setError('');

    try {
      const response = await fetch('/api/squares/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: game.id,
          username,
          quarter: nextQuarter,
          score_a: parsedA,
          score_b: parsedB,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit scores');
        return;
      }

      setScoreA('');
      setScoreB('');
      onGameUpdated();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 space-y-4">
      <h3 className="font-[var(--font-heading)] text-lg font-bold text-foreground flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        Game Controls
      </h3>

      {/* Lock Board Button */}
      {game.status === 'open' && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {claimed}/100 squares claimed.
            {boardFull ? ' Board is full!' : ' You can lock early if needed.'}
          </p>
          <Button
            onClick={handleLockBoard}
            disabled={isLocking || claimed === 0}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLocking ? 'Locking...' : 'Lock Board & Assign Numbers'}
          </Button>
        </div>
      )}

      {/* Score Entry */}
      {game.status !== 'open' && nextQuarter <= 4 && (
        <form onSubmit={handleSubmitScore} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter scores at end of Q{nextQuarter}:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{game.team_a_name} Score</Label>
              <Input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreA(e.target.value)}
                className="bg-input"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{game.team_b_name} Score</Label>
              <Input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreB(e.target.value)}
                className="bg-input"
                placeholder="0"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSubmittingScore}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmittingScore ? 'Submitting...' : `Submit Q${nextQuarter} Score`}
          </Button>
        </form>
      )}

      {/* Quarter Results Summary */}
      {latestQuarter > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Results:</p>
          {[1, 2, 3, 4].map(q => {
            const result = getWinningSquare(game, q, entries);
            if (!result) return null;
            const scores = q === 1 ? { a: game.q1_score_a, b: game.q1_score_b }
              : q === 2 ? { a: game.q2_score_a, b: game.q2_score_b }
              : q === 3 ? { a: game.q3_score_a, b: game.q3_score_b }
              : { a: game.q4_score_a, b: game.q4_score_b };

            return (
              <div key={q} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                <span className="text-muted-foreground">Q{q}: {scores.a}-{scores.b}</span>
                <span className="font-bold text-yellow-400">{result.entry.player_name}</span>
              </div>
            );
          })}
        </div>
      )}

      {game.status === 'completed' && (
        <div className="text-center py-2">
          <p className="text-primary font-bold">Game Complete!</p>
        </div>
      )}

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
    </div>
  );
}
