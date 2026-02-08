import type { SquaresGame, SquaresEntry } from './database.types';

/**
 * Fisher-Yates shuffle to generate random number assignment (0-9)
 */
export function shuffleNumbers(): number[] {
  const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

/**
 * Generate a short share code for a game
 */
export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get the score for a specific quarter
 */
export function getQuarterScores(game: SquaresGame, quarter: number): { scoreA: number | null; scoreB: number | null } {
  switch (quarter) {
    case 1: return { scoreA: game.q1_score_a, scoreB: game.q1_score_b };
    case 2: return { scoreA: game.q2_score_a, scoreB: game.q2_score_b };
    case 3: return { scoreA: game.q3_score_a, scoreB: game.q3_score_b };
    case 4: return { scoreA: game.q4_score_a, scoreB: game.q4_score_b };
    default: return { scoreA: null, scoreB: null };
  }
}

/**
 * Determine the winning entry for a given quarter
 */
export function getWinningSquare(
  game: SquaresGame,
  quarter: number,
  entries: SquaresEntry[]
): { entry: SquaresEntry; rowDigit: number; colDigit: number } | null {
  if (!game.row_numbers || !game.col_numbers) return null;

  const { scoreA, scoreB } = getQuarterScores(game, quarter);
  if (scoreA === null || scoreB === null) return null;

  const rowDigit = scoreA % 10;
  const colDigit = scoreB % 10;

  const row = game.row_numbers.indexOf(rowDigit);
  const col = game.col_numbers.indexOf(colDigit);

  if (row === -1 || col === -1) return null;

  const entry = entries.find(e => e.row_index === row && e.col_index === col);
  if (!entry) return null;

  return { entry, rowDigit, colDigit };
}

/**
 * Get initials from a player name (max 3 chars)
 */
export function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 3).toUpperCase();
  }
  return parts.map(p => p[0]).join('').substring(0, 3).toUpperCase();
}

/**
 * Build a 10x10 grid map from entries
 */
export function buildGridMap(entries: SquaresEntry[]): Map<string, SquaresEntry> {
  const map = new Map<string, SquaresEntry>();
  for (const entry of entries) {
    map.set(`${entry.row_index}-${entry.col_index}`, entry);
  }
  return map;
}

/**
 * Count total claimed squares
 */
export function countClaimed(entries: SquaresEntry[]): number {
  return entries.length;
}

/**
 * Check if the game board is full
 */
export function isBoardFull(entries: SquaresEntry[], gridSize: number = 10): boolean {
  return entries.length >= gridSize * gridSize;
}

/**
 * Get the latest quarter with scores entered
 */
export function getLatestQuarter(game: SquaresGame): number {
  if (game.q4_score_a !== null && game.q4_score_b !== null) return 4;
  if (game.q3_score_a !== null && game.q3_score_b !== null) return 3;
  if (game.q2_score_a !== null && game.q2_score_b !== null) return 2;
  if (game.q1_score_a !== null && game.q1_score_b !== null) return 1;
  return 0;
}
