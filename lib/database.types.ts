// Database types for HawkTrivia - Simplified username-based auth

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// AVATAR TYPES
// ============================================
export const AVATARS = {
  hawk: { id: 'hawk', name: 'Hawk', emoji: '🦅' },
  blitz: { id: 'blitz', name: 'Blitz', emoji: '🦅💚' },
  '12': { id: '12', name: '#12', emoji: '1️⃣2️⃣' },
  superfan: { id: 'superfan', name: 'Superfan', emoji: '🙋' },
  '12th_man': { id: '12th_man', name: '12th Man', emoji: '🙋‍♂️' },
  girls_rule: { id: 'girls_rule', name: 'Girls Rule', emoji: '👸' },
  hero: { id: 'hero', name: 'Hero', emoji: '🧝' },
  champion: { id: 'champion', name: 'Champion', emoji: '🧑‍🦲' },
  trophy: { id: 'trophy', name: 'Trophy', emoji: '🏆' },
  queen: { id: 'queen', name: 'Queen', emoji: '👑' },
  sparkle: { id: 'sparkle', name: 'Sparkle', emoji: '✨' },
  fire: { id: 'fire', name: 'Fire', emoji: '🔥' },
} as const

export type AvatarId = keyof typeof AVATARS

export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnswerOption = 'a' | 'b' | 'c' | 'd'

// ============================================
// USER TYPES
// ============================================
export interface User {
  user_id: string
  username: string
  avatar: AvatarId
  is_preset_image: boolean
  image_url: string | null
  total_points: number
  current_streak: number
  days_played: number
  created_at: string
  last_played_at: string | null
  is_admin: boolean
}

export interface UserInsert {
  username: string
  avatar: AvatarId
  is_preset_image?: boolean
  image_url?: string | null
}

export interface UserUpdate {
  avatar?: AvatarId
  is_preset_image?: boolean
  image_url?: string | null
  total_points?: number
  current_streak?: number
  days_played?: number
  last_played_at?: string | null
}

// ============================================
// TRIVIA QUESTION TYPES
// ============================================
export interface TriviaQuestion {
  id: string
  question_text: string
  image_url: string | null
  image_source: 'web' | 'generated' | 'uploaded' | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: AnswerOption
  hint_text: string | null
  time_limit_seconds: number
  points: number
  difficulty: Difficulty
  category: string | null
  is_active: boolean
  created_at: string
}

export interface TriviaQuestionInsert {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: AnswerOption
  image_url?: string | null
  image_source?: 'web' | 'generated' | 'uploaded' | null
  hint_text?: string | null
  time_limit_seconds?: number
  points?: number
  difficulty?: Difficulty
  category?: string | null
  is_active?: boolean
}

// Question without the correct answer (for client)
export interface TriviaQuestionPublic {
  id: string
  question_text: string
  image_url: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  hint_text: string | null
  time_limit_seconds: number
  points: number
  difficulty: Difficulty
  category: string | null
}

// ============================================
// DAILY TRIVIA TYPES
// ============================================
export interface DailyTriviaSet {
  id: string
  day_identifier: string
  display_date: string
  question_ids: string[]
  is_active: boolean
  created_at: string
}

// ============================================
// GAME DAY ROUND TYPES
// ============================================
export interface GameDayRound {
  id: string
  round_number: number
  question_ids: string[]
  is_live: boolean
  started_at: string | null
  ended_at: string | null
}

// ============================================
// DAILY ANSWER TYPES
// ============================================
export interface DailyAnswer {
  id: string
  username: string
  question_id: string
  day_identifier: string | null
  selected_answer: AnswerOption
  is_correct: boolean
  points_earned: number
  streak_bonus: number
  time_taken_ms: number | null
  answered_at: string
}

export interface DailyAnswerInsert {
  username: string
  question_id: string
  selected_answer: AnswerOption
  is_correct: boolean
  day_identifier?: string | null
  points_earned?: number
  streak_bonus?: number
  time_taken_ms?: number | null
}

export interface AnswerSubmission {
  username: string
  question_id: string
  selected_answer: AnswerOption
  time_taken_ms: number
}

export interface AnswerResult {
  is_correct: boolean
  correct_answer: AnswerOption
  points_earned: number
  streak_bonus: number
  current_streak: number
  total_points: number
}

// ============================================
// PHOTO TYPES
// ============================================
export interface PhotoUpload {
  id: string
  username: string
  image_url: string
  caption: string | null
  like_count: number
  is_approved: boolean
  is_hidden: boolean
  created_at: string
}

export interface PhotoUploadInsert {
  username: string
  image_url: string
  caption?: string | null
}

export interface PhotoWithUser extends PhotoUpload {
  user_avatar: AvatarId
  has_liked?: boolean
}

export interface PhotoWithTeam {
  id: string
  team_id: string
  image_url: string
  caption: string | null
  likes: number
  is_approved: boolean
  is_hidden: boolean
  uploaded_at: string
  team_name: string
  team_image: string | null
  has_liked: boolean
}

export interface PhotoLike {
  id: string
  photo_id: string
  username: string
  created_at: string
}

// ============================================
// PLAYER TYPES (Super Bowl Heroes)
// ============================================
export interface Player {
  id: string
  name: string
  jersey_number: number
  position: string
  image_url: string | null
  image_validated: boolean              // Only show image if admin has validated
  stats: Record<string, string | number> | null  // Flexible key-value stats
  trivia: string[] | null                        // Array of trivia facts
  bio: string | null
  super_bowl_highlight: string | null
  display_order: number
  is_active: boolean
}

// ============================================
// GAME SETTINGS TYPES
// ============================================
export type GameMode = 'pre_game' | 'daily' | 'live' | 'ended'

export interface GameSettings {
  id: number
  current_mode: GameMode
  questions_per_day: number
  timer_duration: number
  scores_locked: boolean
  current_day: string
  live_question_index: number
  is_paused: boolean
  updated_at: string
}

export interface GameSettingsUpdate {
  current_mode?: GameMode
  questions_per_day?: number
  timer_duration?: number
  scores_locked?: boolean
  current_day?: string
  live_question_index?: number
  is_paused?: boolean
}

// ============================================
// LEADERBOARD TYPES
// ============================================
export interface LeaderboardEntry {
  rank: number
  username: string
  avatar: AvatarId
  total_points: number
  current_streak: number
  days_played: number
}

// ============================================
// ADMIN TYPES
// ============================================
export interface AdminActionLog {
  id: string
  action_type: string
  target_type: string | null
  target_id: string | null
  details: Json | null
  performed_at: string
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface DailyTriviaResponse {
  day_identifier: string
  questions: TriviaQuestionPublic[]
  already_answered_ids: string[]
  data_source: 'supabase' | 'demo' | 'demo_fallback' | 'mock_fallback'
  settings: {
    questions_per_day: number
    timer_duration: number
  }
}

// ============================================
// SCORING
// ============================================
export const SCORING_CONFIG = {
  basePoints: 100,
  timeBonus: {
    threshold: 5000, // 5 seconds in ms
    bonus: 50,
  },
  streakMultipliers: {
    0: 1,
    1: 1,
    2: 1.2,
    3: 1.5,
    4: 2,
    5: 2.5, // Max multiplier at 5+ streak
  } as Record<number, number>,
}

export function calculatePoints(
  isCorrect: boolean,
  timeTakenMs: number,
  currentStreak: number
): { points: number; streakBonus: number; newStreak: number } {
  if (!isCorrect) {
    return { points: 0, streakBonus: 0, newStreak: 0 }
  }

  const basePoints = SCORING_CONFIG.basePoints
  const timeBonus = timeTakenMs < SCORING_CONFIG.timeBonus.threshold
    ? SCORING_CONFIG.timeBonus.bonus
    : 0

  const newStreak = currentStreak + 1
  const multiplierKey = Math.min(newStreak, 5)
  const multiplier = SCORING_CONFIG.streakMultipliers[multiplierKey] || 1

  const baseTotal = basePoints + timeBonus
  const totalWithMultiplier = Math.round(baseTotal * multiplier)
  const streakBonus = totalWithMultiplier - baseTotal

  return {
    points: baseTotal,
    streakBonus,
    newStreak,
  }
}
