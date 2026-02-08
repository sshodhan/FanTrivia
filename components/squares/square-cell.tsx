'use client';

import { cn } from '@/lib/utils';
import { getPlayerInitials, getPlayerColor, getPlayerEmoji } from '@/lib/squares-utils';

export type SquareState = 'unclaimed' | 'claimed' | 'mine' | 'winner' | 'selected';

interface SquareCellProps {
  state: SquareState;
  row: number;
  col: number;
  playerName?: string;
  playerEmoji?: string | null;
  playerColor?: string | null;
  winnerQuarter?: number;
  isGameOpen: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
}

export function SquareCell({
  state,
  row,
  col,
  playerName,
  playerEmoji,
  playerColor,
  winnerQuarter,
  isGameOpen,
  onClick,
  onLongPress,
}: SquareCellProps) {
  const initials = playerName ? getPlayerInitials(playerName) : '';
  const emoji = playerEmoji || (playerName ? getPlayerEmoji(playerName) : '');
  const color = playerColor || (playerName ? getPlayerColor(playerName) : '');

  return (
    <button
      onClick={onClick}
      onContextMenu={(e: React.MouseEvent) => {
        e.preventDefault();
        if (onLongPress) onLongPress();
      }}
      disabled={!isGameOpen || state !== 'unclaimed'}
      className={cn(
        'flex-1 aspect-square border border-border/50 flex flex-col items-center justify-center',
        'text-[10px] md:text-xs transition-all relative overflow-hidden',
        // Unclaimed - pulsing and interactive
        state === 'unclaimed' && isGameOpen && 'cursor-pointer hover:bg-primary/20 active:scale-95 squares-unclaimed-pulse',
        state === 'unclaimed' && !isGameOpen && 'bg-muted/20',
        // Selected (pending claim)
        state === 'selected' && 'bg-primary/40 border-primary border-dashed border-2',
        // Claimed by current user - green glow border
        state === 'mine' && 'bg-primary/15 ring-2 ring-primary/60 ring-inset',
        // Claimed by someone else
        state === 'claimed' && 'bg-card/80',
        // Winner - gold treatment
        state === 'winner' && 'bg-yellow-500/30 border-yellow-500 ring-2 ring-yellow-500 squares-winner-glow',
      )}
      style={
        (state === 'claimed' || state === 'mine') && color
          ? { borderBottomColor: color, borderBottomWidth: '3px' }
          : undefined
      }
      aria-label={
        playerName
          ? `Square ${row},${col}: ${playerName}`
          : `Square ${row},${col}: empty`
      }
    >
      {/* Unclaimed state - small plus icon */}
      {state === 'unclaimed' && isGameOpen && (
        <span className="text-muted-foreground/40 text-sm">+</span>
      )}

      {/* Selected state - bold plus */}
      {state === 'selected' && (
        <span className="text-primary font-bold text-sm">+</span>
      )}

      {/* Claimed / mine states - emoji + initials */}
      {(state === 'claimed' || state === 'mine') && playerName && (
        <div className="flex flex-col items-center gap-0 squares-claim-pop">
          <span className="text-[10px] md:text-xs leading-tight">{emoji}</span>
          <span
            className={cn(
              'font-bold truncate px-0.5 leading-tight text-[8px] md:text-[10px]',
              state === 'mine' ? 'text-primary' : 'text-foreground/70'
            )}
          >
            {initials}
          </span>
        </div>
      )}

      {/* Winner state - trophy overlay */}
      {state === 'winner' && playerName && (
        <div className="flex flex-col items-center gap-0">
          <span className="text-sm md:text-base">🏆</span>
          <span className="font-bold text-yellow-400 text-[8px] md:text-[10px] leading-tight truncate px-0.5">
            {initials}
          </span>
        </div>
      )}

      {/* Winner quarter badge */}
      {state === 'winner' && winnerQuarter && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500 rounded-full text-[8px] font-bold text-black flex items-center justify-center z-10">
          Q{winnerQuarter}
        </span>
      )}
    </button>
  );
}
