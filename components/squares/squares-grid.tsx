'use client';

import { useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { SquaresGame, SquaresEntry, SquaresWinner } from '@/lib/database.types';
import { getWinningSquare, getWinningPosition } from '@/lib/squares-utils';
import { SquareCell } from './square-cell';
import { useNumberReveal } from './number-reveal';

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
  const hasNumbers = !!game.row_numbers && !!game.col_numbers;
  const [justLocked, setJustLocked] = useState(false);

  // Number reveal animation
  const { startReveal, getColDisplay, getRowDisplay, isRevealing, allRevealed, showGridFlash } = useNumberReveal({
    rowNumbers: game.row_numbers || [],
    colNumbers: game.col_numbers || [],
  });

  // Trigger reveal when game transitions to locked with numbers
  useEffect(() => {
    if (isLocked && hasNumbers && !allRevealed && !isRevealing) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        setJustLocked(true);
        startReveal();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLocked, hasNumbers, allRevealed, isRevealing, startReveal]);

  // Build entry lookup map
  const entryMap = new Map<string, SquaresEntry>();
  for (const entry of entries) {
    entryMap.set(`${entry.row_index}-${entry.col_index}`, entry);
  }

  // Build winner lookup for highlighting
  const winnerPositions = new Map<string, number>();
  for (let q = 1; q <= 4; q++) {
    const pos = getWinningPosition(game, q);
    if (pos) {
      winnerPositions.set(`${pos.row}-${pos.col}`, q);
    }
  }

  const handleClick = useCallback((row: number, col: number) => {
    if (game.status !== 'open') return;
    const key = `${row}-${col}`;
    if (entryMap.has(key)) return;
    onSquareClick(row, col);
  }, [game.status, entryMap, onSquareClick]);

  const showNumbers = hasNumbers && (allRevealed || !justLocked);

  return (
    <div className="w-full overflow-x-auto">
      <div
        className={cn(
          'min-w-[360px] max-w-[600px] mx-auto transition-all',
          showGridFlash && 'squares-grid-flash'
        )}
      >
        {/* Team B name (columns) at top */}
        <div className="flex items-center justify-center mb-2">
          <div className="w-10 md:w-12" />
          <div className="flex-1 text-center">
            <span className="font-[var(--font-heading)] text-lg md:text-xl font-bold text-foreground tracking-wide uppercase">
              {game.team_b_name}
            </span>
          </div>
        </div>

        {/* Column numbers header */}
        <div className="flex">
          <div className="w-10 md:w-12 flex-shrink-0" />
          {Array.from({ length: gridSize }, (_, colIdx) => {
            const colState = (isRevealing || justLocked) && hasNumbers
              ? getColDisplay(colIdx)
              : null;

            const showRevealed = colState?.isRevealed;
            const showSpinning = colState?.isSpinning;
            const displayNumber = showNumbers
              ? game.col_numbers![colIdx]
              : showRevealed
                ? colState!.digit
                : showSpinning
                  ? colState!.digit
                  : null;

            return (
              <div
                key={`col-header-${colIdx}`}
                className={cn(
                  'flex-1 aspect-square flex items-center justify-center text-xs md:text-sm font-bold overflow-hidden',
                  showNumbers || showRevealed ? 'text-primary' : 'text-muted-foreground/40',
                  showRevealed && !showNumbers && 'squares-number-land',
                )}
              >
                {displayNumber !== null ? (
                  <span className={showSpinning ? 'opacity-60' : ''}>
                    {displayNumber}
                  </span>
                ) : (
                  <span className={isLocked ? 'animate-pulse' : ''}>?</span>
                )}
              </div>
            );
          })}
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
            {Array.from({ length: gridSize }, (_, rowIdx) => {
              const rowState = (isRevealing || justLocked) && hasNumbers
                ? getRowDisplay(rowIdx)
                : null;

              const showRowRevealed = rowState?.isRevealed;
              const showRowSpinning = rowState?.isSpinning;
              const displayRowNumber = showNumbers
                ? game.row_numbers![rowIdx]
                : showRowRevealed
                  ? rowState!.digit
                  : showRowSpinning
                    ? rowState!.digit
                    : null;

              return (
                <div key={`row-${rowIdx}`} className="flex">
                  {/* Row number */}
                  <div
                    className={cn(
                      'w-6 md:w-8 flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-bold overflow-hidden',
                      showNumbers || showRowRevealed ? 'text-primary' : 'text-muted-foreground/40',
                      showRowRevealed && !showNumbers && 'squares-number-land',
                    )}
                  >
                    {displayRowNumber !== null ? (
                      <span className={showRowSpinning ? 'opacity-60' : ''}>
                        {displayRowNumber}
                      </span>
                    ) : (
                      <span className={isLocked ? 'animate-pulse' : ''}>?</span>
                    )}
                  </div>

                  {/* Grid cells */}
                  {Array.from({ length: gridSize }, (_, colIdx) => {
                    const key = `${rowIdx}-${colIdx}`;
                    const entry = entryMap.get(key);
                    const isSelected = selectedSquares.has(key);
                    const isWinner = winnerPositions.has(key);
                    const winnerQuarter = winnerPositions.get(key);
                    const isCurrentUser = entry?.player_name === currentUser || entry?.player_user_id === currentUser;

                    let cellState: 'unclaimed' | 'claimed' | 'mine' | 'winner' | 'selected';
                    if (isWinner && entry) cellState = 'winner';
                    else if (isSelected) cellState = 'selected';
                    else if (entry && isCurrentUser) cellState = 'mine';
                    else if (entry) cellState = 'claimed';
                    else cellState = 'unclaimed';

                    return (
                      <SquareCell
                        key={key}
                        state={cellState}
                        row={rowIdx}
                        col={colIdx}
                        playerName={entry?.player_name}
                        playerEmoji={entry?.player_emoji}
                        playerColor={entry?.player_color}
                        winnerQuarter={winnerQuarter}
                        isGameOpen={game.status === 'open'}
                        onClick={() => handleClick(rowIdx, colIdx)}
                        onLongPress={entry && onSquareLongPress ? () => onSquareLongPress(entry) : undefined}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
