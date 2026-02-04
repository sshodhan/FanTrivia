'use client'

import { calculateScore } from './scoring'
import type { QuestionWithoutAnswer } from './database.types'

// State types
export type TriviaState =
  | 'loading'
  | 'ready'
  | 'question_active'
  | 'showing_answer'
  | 'completed'
  | 'error'

// Events that can trigger transitions
export type TriviaEvent =
  | { type: 'LOAD_COMPLETE'; questions: QuestionWithoutAnswer[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'START_GAME' }
  | { type: 'SUBMIT_ANSWER'; answerIndex: number; timeTakenMs: number }
  | { type: 'TIME_UP' }
  | { type: 'REVEAL_ANSWER'; isCorrect: boolean; correctIndex: number; explanation?: string }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESET' }

// Answer record for each question
export interface AnswerRecord {
  questionId: string
  answerIndex: number | null
  isCorrect: boolean
  timeTakenMs: number
  pointsEarned: number
  streakBonus: number
}

// Full context of the trivia session
export interface TriviaContext {
  state: TriviaState
  questions: QuestionWithoutAnswer[]
  currentQuestionIndex: number
  answers: AnswerRecord[]
  totalScore: number
  currentStreak: number
  bestStreak: number
  timeRemainingMs: number
  currentAnswer: {
    submitted: boolean
    index: number | null
    isCorrect: boolean | null
    correctIndex: number | null
    explanation?: string
    timeTakenMs: number
  }
  error: string | null
}

// Initial context
export function createInitialContext(): TriviaContext {
  return {
    state: 'loading',
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    totalScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    timeRemainingMs: 15000,
    currentAnswer: {
      submitted: false,
      index: null,
      isCorrect: null,
      correctIndex: null,
      timeTakenMs: 0
    },
    error: null
  }
}

// Storage key for persisting state (anti-cheat)
const STORAGE_KEY = 'hawktrivia_game_state'

/**
 * Save context to localStorage to prevent refresh cheating
 */
export function persistContext(context: TriviaContext, dayIdentifier: string): void {
  if (typeof window === 'undefined') return

  const data = {
    ...context,
    dayIdentifier,
    savedAt: Date.now()
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Load persisted context if valid for today
 */
export function loadPersistedContext(dayIdentifier: string): TriviaContext | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored)

    // Check if same day and not too old (1 hour max)
    const hourInMs = 60 * 60 * 1000
    if (data.dayIdentifier !== dayIdentifier || Date.now() - data.savedAt > hourInMs) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    // Don't restore if already completed
    if (data.state === 'completed') {
      return null
    }

    return {
      state: data.state,
      questions: data.questions,
      currentQuestionIndex: data.currentQuestionIndex,
      answers: data.answers,
      totalScore: data.totalScore,
      currentStreak: data.currentStreak,
      bestStreak: data.bestStreak,
      timeRemainingMs: data.timeRemainingMs,
      currentAnswer: data.currentAnswer,
      error: null
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

/**
 * Clear persisted context
 */
export function clearPersistedContext(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * State machine transition function
 */
export function triviaReducer(context: TriviaContext, event: TriviaEvent): TriviaContext {
  switch (event.type) {
    case 'LOAD_COMPLETE': {
      return {
        ...context,
        state: 'ready',
        questions: event.questions,
        currentQuestionIndex: 0,
        timeRemainingMs: event.questions[0]?.time_limit_seconds * 1000 || 15000
      }
    }

    case 'LOAD_ERROR': {
      return {
        ...context,
        state: 'error',
        error: event.error
      }
    }

    case 'START_GAME': {
      if (context.state !== 'ready') return context
      return {
        ...context,
        state: 'question_active',
        currentAnswer: {
          submitted: false,
          index: null,
          isCorrect: null,
          correctIndex: null,
          timeTakenMs: 0
        }
      }
    }

    case 'SUBMIT_ANSWER': {
      if (context.state !== 'question_active') return context
      if (context.currentAnswer.submitted) return context

      return {
        ...context,
        currentAnswer: {
          ...context.currentAnswer,
          submitted: true,
          index: event.answerIndex,
          timeTakenMs: event.timeTakenMs
        }
      }
    }

    case 'TIME_UP': {
      if (context.state !== 'question_active') return context
      if (context.currentAnswer.submitted) return context

      // Auto-submit with no answer
      return {
        ...context,
        currentAnswer: {
          ...context.currentAnswer,
          submitted: true,
          index: null,
          timeTakenMs: context.questions[context.currentQuestionIndex]?.time_limit_seconds * 1000 || 15000
        }
      }
    }

    case 'REVEAL_ANSWER': {
      if (context.state !== 'question_active') return context

      const question = context.questions[context.currentQuestionIndex]
      const isCorrect = event.isCorrect

      // Calculate score
      const scoring = calculateScore(
        isCorrect,
        context.currentAnswer.timeTakenMs,
        context.currentStreak,
        question?.time_limit_seconds || 15
      )

      // Create answer record
      const answerRecord: AnswerRecord = {
        questionId: question?.id || '',
        answerIndex: context.currentAnswer.index,
        isCorrect,
        timeTakenMs: context.currentAnswer.timeTakenMs,
        pointsEarned: scoring.totalPoints,
        streakBonus: scoring.streakBonus
      }

      const newStreak = isCorrect ? context.currentStreak + 1 : 0
      const newBestStreak = Math.max(context.bestStreak, newStreak)

      return {
        ...context,
        state: 'showing_answer',
        answers: [...context.answers, answerRecord],
        totalScore: context.totalScore + scoring.totalPoints,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        currentAnswer: {
          ...context.currentAnswer,
          isCorrect,
          correctIndex: event.correctIndex,
          explanation: event.explanation
        }
      }
    }

    case 'NEXT_QUESTION': {
      if (context.state !== 'showing_answer') return context

      const nextIndex = context.currentQuestionIndex + 1
      const isLastQuestion = nextIndex >= context.questions.length

      if (isLastQuestion) {
        return {
          ...context,
          state: 'completed'
        }
      }

      const nextQuestion = context.questions[nextIndex]

      return {
        ...context,
        state: 'question_active',
        currentQuestionIndex: nextIndex,
        timeRemainingMs: nextQuestion?.time_limit_seconds * 1000 || 15000,
        currentAnswer: {
          submitted: false,
          index: null,
          isCorrect: null,
          correctIndex: null,
          timeTakenMs: 0
        }
      }
    }

    case 'RESET': {
      clearPersistedContext()
      return createInitialContext()
    }

    default:
      return context
  }
}

/**
 * Calculate game statistics for results screen
 */
export function calculateGameStats(context: TriviaContext): {
  totalQuestions: number
  correctAnswers: number
  totalScore: number
  accuracy: number
  averageTime: number
  bestStreak: number
  fastAnswers: number
} {
  const totalQuestions = context.answers.length
  const correctAnswers = context.answers.filter(a => a.isCorrect).length
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  const totalTime = context.answers.reduce((sum, a) => sum + a.timeTakenMs, 0)
  const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0
  const fastAnswers = context.answers.filter(a => a.isCorrect && a.timeTakenMs <= 5000).length

  return {
    totalQuestions,
    correctAnswers,
    totalScore: context.totalScore,
    accuracy: Math.round(accuracy),
    averageTime: Math.round(averageTime / 100) / 10, // Round to 1 decimal
    bestStreak: context.bestStreak,
    fastAnswers
  }
}
