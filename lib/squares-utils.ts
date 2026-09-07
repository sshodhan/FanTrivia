import type { SquaresGame, SquaresEntry, SquaresAuditAction } from './database.types';

// ============================================
// CSV EXPORT
// ============================================

/**
 * Escape a value for CSV: wrap in double-quotes if it contains commas,
 * double-quotes, or newlines. Internal double-quotes are doubled.
 * Null/undefined become empty strings.
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate a CSV string from squares entries.
 * One row per square with columns: User, User ID, Square
 * Square is formatted as "(row,col)" grid position.
 * If the board is locked (row_numbers/col_numbers assigned),
 * an additional column "Assigned Numbers" shows "[rowNum,colNum]".
 */
export function generateSquaresCsv(
  entries: SquaresEntry[],
  game?: SquaresGame | null,
): string {
  const hasNumbers = !!game?.row_numbers && !!game?.col_numbers;
  const headers = hasNumbers
    ? ['User', 'User ID', 'Square', 'Assigned Numbers']
    : ['User', 'User ID', 'Square'];

  const rows: string[] = [headers.join(',')];

  // Sort entries for a deterministic export order: by player name, then position
  const sorted = [...entries].sort((a, b) => {
    const nameCompare = a.player_name.localeCompare(b.player_name);
    if (nameCompare !== 0) return nameCompare;
    if (a.row_index !== b.row_index) return a.row_index - b.row_index;
    return a.col_index - b.col_index;
  });

  for (const entry of sorted) {
    const user = escapeCsvField(entry.player_name);
    const userId = escapeCsvField(entry.player_user_id ?? '');
    const square = escapeCsvField(`(${entry.row_index},${entry.col_index})`);

    if (hasNumbers) {
      const assignedNumbers = escapeCsvField(
        `[${game!.row_numbers![entry.row_index]},${game!.col_numbers![entry.col_index]}]`,
      );
      rows.push(`${user},${userId},${square},${assignedNumbers}`);
    } else {
      rows.push(`${user},${userId},${square}`);
    }
  }

  return rows.join('\r\n');
}

/**
 * Trigger a browser download of a CSV string as a file.
 * Uses Blob + Object URL for broad browser compatibility.
 * Includes a BOM for proper UTF-8 handling in Excel.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// ============================================
// PLAYER COLORS & EMOJIS
// ============================================

/** Pool of distinguishable player colors for the grid */
export const PLAYER_COLORS = [
  '#E74C3C', // red
  '#3498DB', // blue
  '#2ECC71', // green
  '#F39C12', // orange
  '#9B59B6', // purple
  '#1ABC9C', // teal
  '#E91E63', // pink
  '#FF9800', // amber
  '#00BCD4', // cyan
  '#8BC34A', // lime
  '#FF5722', // deep orange
  '#607D8B', // blue grey
  '#CDDC39', // yellow-green
  '#795548', // brown
  '#4CAF50', // medium green
];

/** Pool of player emojis */
export const PLAYER_EMOJIS = [
  '🦅', '🏈', '🎉', '🍕', '🍺', '🎯', '⭐', '🔥', '💪', '🎶',
  '🦁', '🐻', '🎸', '🎮', '🚀',
];

/**
 * Get a consistent color for a player name (deterministic hash)
 */
export function getPlayerColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
}

/**
 * Get a consistent emoji for a player name (deterministic hash)
 */
export function getPlayerEmoji(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 7) - hash);
  }
  return PLAYER_EMOJIS[Math.abs(hash) % PLAYER_EMOJIS.length];
}

/**
 * Count how many squares a player has claimed in a game
 */
export function countPlayerSquares(entries: SquaresEntry[], playerName: string): number {
  return entries.filter(e => e.player_name === playerName).length;
}

export interface UniquePlayer {
  name: string;
  count: number;
  emoji: string;
  color: string;
  playerUserId: string | null;
  squares: Array<{ row: number; col: number }>;
}

/**
 * Get unique players from entries with their user IDs and square positions
 */
export function getUniquePlayers(entries: SquaresEntry[]): UniquePlayer[] {
  const playerMap = new Map<string, { userId: string | null; squares: Array<{ row: number; col: number }> }>();
  for (const entry of entries) {
    const existing = playerMap.get(entry.player_name);
    if (existing) {
      existing.squares.push({ row: entry.row_index, col: entry.col_index });
    } else {
      playerMap.set(entry.player_name, {
        userId: entry.player_user_id,
        squares: [{ row: entry.row_index, col: entry.col_index }],
      });
    }
  }
  return Array.from(playerMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.squares.length,
      emoji: getPlayerEmoji(name),
      color: getPlayerColor(name),
      playerUserId: data.userId,
      squares: data.squares.sort((a, b) => a.row - b.row || a.col - b.col),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get the winning position for a quarter (even if unclaimed)
 */
export function getWinningPosition(
  game: SquaresGame,
  quarter: number,
): { row: number; col: number; rowDigit: number; colDigit: number } | null {
  if (!game.row_numbers || !game.col_numbers) return null;

  const { scoreA, scoreB } = getQuarterScores(game, quarter);
  if (scoreA === null || scoreB === null) return null;

  const rowDigit = scoreA % 10;
  const colDigit = scoreB % 10;
  const row = game.row_numbers.indexOf(rowDigit);
  const col = game.col_numbers.indexOf(colDigit);

  if (row === -1 || col === -1) return null;
  return { row, col, rowDigit, colDigit };
}

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
