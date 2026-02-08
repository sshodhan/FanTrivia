'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { SquaresGame, SquaresEntry, SquaresWinner } from '@/lib/database.types';
import { getPlayerInitials, getWinningSquare } from '@/lib/squares-utils';

interface SquaresGridProps {
  game: SquaresGame;
  entries: SquaresEntry[];
  winners: SquaresWinner[];
  currentUser?: string;
  selectedSquares: Set<string>;
  onSquareClick: (row: number, col: number) => void;
  onSquareLongPress?: (entry: SquaresEntry) => void;
}

export function SquaresGrid({
  game,
  entries,
  winners,
  currentUser,
  selectedSquares,
  onSquareClick,
  onSquareLongPress,
}: SquaresGridProps) {
  const gridSize = game.grid_size || 10;
  const isLocked = game.status !== 'open';
  const showNumbers = isLocked && game.row_numbers && game.col_numbers;

  // Build entry lookup map
  const entryMap = new Map<string, SquaresEntry>();
  for (const entry of entries) {
    entryMap.set(`${entry.row_index}-${entry.col_index}`, entry);
  }

  // Build winner lookup for highlighting
  const winnerPositions = new Map<string, number>();
  for (let q = 1; q <= 4; q++) {
    const result = getWinningSquare(game, q, entries);
    if (result) {
      winnerPositions.set(`${result.entry.row_index}-${result.entry.col_index}`, q);
    }
  }

  const handleClick = useCallback((row: number, col: number) => {
    if (game.status !== 'open') return;
    const key = `${row}-${col}`;
    if (entryMap.has(key)) return; // Already claimed
    onSquareClick(row, col);
  }, [game.status, entryMap, onSquareClick]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[360px] max-w-[600px] mx-auto">
        {/* Team B name (columns) at top */}
        <div className="flex items-center justify-center mb-2">
          <div className="w-10 md:w-12" /> {/* spacer for row labels */}
          <div className="flex-1 text-center">
            <span className="font-[var(--font-heading)] text-lg md:text-xl font-bold text-foreground tracking-wide uppercase">
              {game.team_b_name}
            </span>
          </div>
        </div>

        {/* Column numbers header */}
        <div className="flex">
          <div className="w-10 md:w-12 flex-shrink-0" /> {/* corner spacer */}
          {Array.from({ length: gridSize }, (_, colIdx) => (
            <div
              key={`col-header-${colIdx}`}
              className={cn(
                'flex-1 aspect-square flex items-center justify-center text-xs md:text-sm font-bold',
                showNumbers ? 'text-primary' : 'text-muted-foreground/40'
              )}
            >
              {showNumbers ? game.col_numbers![colIdx] : '?'}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div className="flex">
          {/* Team A name (rows) - rotated on left side */}
          <div className="flex flex-col items-center justify-center w-4 mr-1 flex-shrink-0">
            <span
              className="font-[var(--font-heading)] text-sm md:text-base font-bold text-foreground tracking-wide uppercase whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {game.team_a_name}
            </span>
          </div>

          {/* Row numbers + grid body */}
          <div className="flex-1">
            {Array.from({ length: gridSize }, (_, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex">
                {/* Row number */}
                <div
                  className={cn(
                    'w-6 md:w-8 flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-bold',
                    showNumbers ? 'text-primary' : 'text-muted-foreground/40'
                  )}
                >
                  {showNumbers ? game.row_numbers![rowIdx] : '?'}
                </div>

                {/* Grid cells */}
                {Array.from({ length: gridSize }, (_, colIdx) => {
                  const key = `${rowIdx}-${colIdx}`;
                  const entry = entryMap.get(key);
                  const isSelected = selectedSquares.has(key);
                  const isWinner = winnerPositions.has(key);
                  const winnerQuarter = winnerPositions.get(key);
                  const isCurrentUser = entry?.player_name === currentUser || entry?.player_user_id === currentUser;
                  const isEmpty = !entry && !isSelected;

                  return (
                    <button
                      key={key}
                      onClick={() => handleClick(rowIdx, colIdx)}
                      onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault();
                        if (entry && onSquareLongPress) {
                          onSquareLongPress(entry);
                        }
                      }}
                      disabled={game.status !== 'open' || !!entry}
                      className={cn(
                        'flex-1 aspect-square border border-border/50 flex items-center justify-center text-[10px] md:text-xs transition-all relative',
                        // Empty and clickable
                        isEmpty && game.status === 'open' && 'hover:bg-primary/20 cursor-pointer',
                        // Selected (pending claim)
                        isSelected && 'bg-primary/40 border-primary',
                        // Claimed by current user
                        entry && isCurrentUser && !isWinner && 'bg-primary/20',
                        // Claimed by someone else
                        entry && !isCurrentUser && !isWinner && 'bg-card',
                        // Winner square
                        isWinner && 'bg-yellow-500/30 border-yellow-500 ring-1 ring-yellow-500',
                        // Locked empty
                        isEmpty && game.status !== 'open' && 'bg-muted/20',
                      )}
                      aria-label={
                        entry
                          ? `Square ${rowIdx},${colIdx}: ${entry.player_name}`
                          : `Square ${rowIdx},${colIdx}: empty`
                      }
                    >
                      {entry && (
                        <span className={cn(
                          'font-bold truncate px-0.5',
                          isCurrentUser ? 'text-primary' : 'text-foreground/70'
                        )}>
                          {getPlayerInitials(entry.player_name)}
                        </span>
                      )}
                      {isSelected && !entry && (
                        <span className="text-primary font-bold">+</span>
                      )}
                      {isWinner && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 rounded-full text-[8px] font-bold text-black flex items-center justify-center">
                          Q{winnerQuarter}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
