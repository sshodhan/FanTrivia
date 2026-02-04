/**
 * Scoring system for Seahawks Trivia
 *
 * Base points: 100 per correct answer
 * Time bonus: +50 if answered in first 5 seconds
 * Streak bonuses:
 *   - 2 in a row: 1.2x multiplier
 *   - 3 in a row: 1.5x multiplier
 *   - 4 in a row: 2x multiplier
 *   - 5+ in a row: 2.5x multiplier (max)
 */

export const SCORING_CONFIG = {
  basePoints: 100,
  timeBonus: {
    threshold: 5000, // 5 seconds in ms
    bonus: 50
  },
  streakMultipliers: {
    0: 1,
    1: 1,
    2: 1.2,
    3: 1.5,
    4: 2,
    5: 2.5 // Max multiplier
  } as Record<number, number>
}

/**
 * Calculate base points for an answer
 * @param isCorrect Whether the answer was correct
 * @param timeTakenMs Time taken to answer in milliseconds
 * @param timeLimit Time limit in seconds
 */
export function calculateBasePoints(
  isCorrect: boolean,
  timeTakenMs: number,
  timeLimit: number = 15
): number {
  if (!isCorrect) return 0

  let points = SCORING_CONFIG.basePoints

  // Add time bonus if answered quickly (within first 5 seconds)
  if (timeTakenMs <= SCORING_CONFIG.timeBonus.threshold) {
    points += SCORING_CONFIG.timeBonus.bonus
  }

  return points
}

/**
 * Get the streak multiplier based on current streak
 * @param currentStreak Current streak count (before this answer)
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  if (currentStreak >= 5) return SCORING_CONFIG.streakMultipliers[5]
  return SCORING_CONFIG.streakMultipliers[currentStreak] || 1
}

/**
 * Calculate total points including streak bonus
 * @param basePoints Base points earned
 * @param streakMultiplier Multiplier from streak
 */
export function calculateTotalPoints(
  basePoints: number,
  streakMultiplier: number
): { totalPoints: number; streakBonus: number } {
  const totalPoints = Math.round(basePoints * streakMultiplier)
  const streakBonus = totalPoints - basePoints

  return { totalPoints, streakBonus }
}

/**
 * Calculate all scoring for an answer submission
 * @param isCorrect Whether the answer was correct
 * @param timeTakenMs Time taken in milliseconds
 * @param currentStreak Current streak before this answer
 * @param timeLimit Time limit in seconds
 */
export function calculateScore(
  isCorrect: boolean,
  timeTakenMs: number,
  currentStreak: number,
  timeLimit: number = 15
): {
  basePoints: number
  streakMultiplier: number
  streakBonus: number
  totalPoints: number
  newStreak: number
} {
  const basePoints = calculateBasePoints(isCorrect, timeTakenMs, timeLimit)

  // Multiplier applies if there's already a streak
  const streakMultiplier = isCorrect ? calculateStreakMultiplier(currentStreak) : 1

  const { totalPoints, streakBonus } = calculateTotalPoints(basePoints, streakMultiplier)

  // Calculate new streak
  const newStreak = isCorrect ? currentStreak + 1 : 0

  return {
    basePoints,
    streakMultiplier,
    streakBonus,
    totalPoints,
    newStreak
  }
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return points.toLocaleString()
}

/**
 * Get streak label for display
 */
export function getStreakLabel(streak: number): string {
  if (streak === 0) return ''
  if (streak === 1) return ''
  if (streak === 2) return '2 in a row!'
  if (streak === 3) return '3 streak! 1.5x bonus!'
  if (streak === 4) return '4 streak! 2x bonus!'
  if (streak >= 5) return 'ON FIRE! 2.5x bonus!'
  return `${streak} streak!`
}

/**
 * Get time remaining category for feedback
 */
export function getTimeCategory(timeRemainingMs: number, timeLimitMs: number): 'fast' | 'medium' | 'slow' {
  const percentRemaining = timeRemainingMs / timeLimitMs
  if (percentRemaining > 0.66) return 'fast'
  if (percentRemaining > 0.33) return 'medium'
  return 'slow'
}
