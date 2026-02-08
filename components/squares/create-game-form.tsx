'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';

interface CreateGameFormProps {
  username: string;
  onCreated: (gameId: string) => void;
  onCancel: () => void;
}

export function CreateGameForm({ username, onCreated, onCancel }: CreateGameFormProps) {
  const [name, setName] = useState('');
  const [teamA, setTeamA] = useState('Seahawks');
  const [teamB, setTeamB] = useState('Patriots');
  const [entryFee, setEntryFee] = useState('');
  const [maxSquares, setMaxSquares] = useState('');
  const [requireLogin, setRequireLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Game name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/squares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          team_a_name: teamA.trim() || 'Seahawks',
          team_b_name: teamB.trim() || 'Patriots',
          created_by: username,
          entry_fee: entryFee ? parseFloat(entryFee) : null,
          max_squares_per_player: maxSquares ? parseInt(maxSquares, 10) : null,
          require_login: requireLogin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logClientError(
          `Game creation failed: ${data.error || 'Unknown error'}`,
          'Squares Soft Error',
          { gameName: name.trim(), username, status: response.status }
        )
        setError(data.error || 'Failed to create game');
        return;
      }

      logClientDebug('CreateGameForm', 'Game created', {
        gameId: data.game.id,
        gameName: name.trim(),
        teamA: teamA.trim() || 'Seahawks',
        teamB: teamB.trim() || 'Patriots',
        username,
      }, { force: true })

      onCreated(data.game.id);
    } catch (err) {
      logClientError(
        err instanceof Error ? err : new Error('Network error creating game'),
        'Squares Network Error',
        { gameName: name.trim(), username }
      )
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="font-[var(--font-heading)] text-2xl font-bold text-foreground mb-6">
        Create New Game
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="game-name" className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Game Name
          </Label>
          <Input
            id="game-name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Super Bowl LIX Party"
            className="bg-input"
            maxLength={50}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="team-a" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Team A (Rows)
            </Label>
            <Input
              id="team-a"
              value={teamA}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamA(e.target.value)}
              placeholder="Seahawks"
              className="bg-input"
              maxLength={30}
            />
          </div>
          <div>
            <Label htmlFor="team-b" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Team B (Columns)
            </Label>
            <Input
              id="team-b"
              value={teamB}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamB(e.target.value)}
              placeholder="Patriots"
              className="bg-input"
              maxLength={30}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="entry-fee" className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Entry Fee Per Square (optional, display only)
          </Label>
          <Input
            id="entry-fee"
            value={entryFee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryFee(e.target.value)}
            placeholder="$5"
            className="bg-input"
            type="number"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <Label htmlFor="max-squares" className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Max Squares Per Player (optional)
          </Label>
          <Input
            id="max-squares"
            value={maxSquares}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxSquares(e.target.value)}
            placeholder="No limit"
            className="bg-input"
            type="number"
            min="1"
            max="100"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave blank for unlimited</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={requireLogin}
            onClick={() => setRequireLogin(!requireLogin)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              requireLogin ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                requireLogin ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <Label className="text-sm font-medium text-muted-foreground">
            Require login to claim squares
          </Label>
        </div>

        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? 'Creating...' : 'Create Game'}
          </Button>
        </div>
      </form>
    </div>
  );
}
