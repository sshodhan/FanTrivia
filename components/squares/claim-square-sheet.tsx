'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PLAYER_EMOJIS, getPlayerEmoji } from '@/lib/squares-utils';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';

interface ClaimSquareSheetProps {
  gameId: string;
  squares: Array<{ row: number; col: number }>;
  defaultPlayerName: string;
  defaultPlayerUserId?: string | null;
  maxSquaresPerPlayer: number | null;
  currentPlayerSquareCount: number;
  onClaim: (playerName: string, emoji: string) => Promise<void>;
  onClose: () => void;
}

export function ClaimSquareSheet({
  gameId,
  squares,
  defaultPlayerName,
  defaultPlayerUserId,
  maxSquaresPerPlayer,
  currentPlayerSquareCount,
  onClaim,
  onClose,
}: ClaimSquareSheetProps) {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [selectedEmoji, setSelectedEmoji] = useState(
    defaultPlayerName ? getPlayerEmoji(defaultPlayerName) : PLAYER_EMOJIS[0]
  );
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState('');

  const wouldExceedMax = maxSquaresPerPlayer !== null &&
    (currentPlayerSquareCount + squares.length) > maxSquaresPerPlayer;

  const handleClaim = async () => {
    const name = playerName.trim();
    if (!name) {
      setError('Please enter your name');
      return;
    }

    if (wouldExceedMax) {
      setError(`Maximum ${maxSquaresPerPlayer} squares per player. You already have ${currentPlayerSquareCount}.`);
      logClientError(
        `Max squares exceeded: ${currentPlayerSquareCount} + ${squares.length} > ${maxSquaresPerPlayer}`,
        'Squares Soft Error',
        { gameId, playerName: name, current: currentPlayerSquareCount, attempting: squares.length, max: maxSquaresPerPlayer }
      );
      return;
    }

    setIsClaiming(true);
    setError('');

    try {
      await onClaim(name, selectedEmoji);
      logClientDebug('ClaimSheet', 'Squares claimed via sheet', {
        gameId,
        playerName: name,
        emoji: selectedEmoji,
        squareCount: squares.length,
        coordinates: squares.map(s => `(${s.row},${s.col})`).join(', '),
      }, { force: true });
    } catch (err) {
      logClientError(
        err instanceof Error ? err : new Error('Claim failed'),
        'Squares Soft Error',
        { gameId, playerName: name, squareCount: squares.length }
      );
      setError('Failed to claim. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 squares-backdrop-enter"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 squares-sheet-enter">
        <div className="bg-card rounded-t-2xl border-t border-border p-6 pb-8 max-w-md mx-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-5" />

          {/* Title */}
          <h3 className="font-[var(--font-heading)] text-lg font-bold text-foreground mb-1">
            Claim {squares.length === 1 ? 'Square' : `${squares.length} Squares`}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {squares.length === 1
              ? `Row ${squares[0].row}, Column ${squares[0].col}`
              : `${squares.length} squares selected`}
          </p>

          {/* Player name */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Your Name
            </label>
            <Input
              value={playerName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="bg-input"
              maxLength={30}
              autoFocus
            />
          </div>

          {/* Emoji picker */}
          <div className="mb-5">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Choose Your Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PLAYER_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    selectedEmoji === emoji
                      ? 'bg-primary/30 ring-2 ring-primary scale-110'
                      : 'bg-muted/40 hover:bg-muted/60'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Max squares warning */}
          {wouldExceedMax && (
            <div className="text-destructive text-sm mb-3">
              Maximum {maxSquaresPerPlayer} squares per player. You already have {currentPlayerSquareCount}.
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm mb-3">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClaim}
              disabled={isClaiming || !playerName.trim() || wouldExceedMax}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isClaiming ? 'Claiming...' : `Claim ${squares.length === 1 ? 'Square' : `${squares.length} Squares`}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
