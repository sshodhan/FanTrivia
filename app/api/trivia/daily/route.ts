import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import { sampleQuestions } from '@/lib/mock-data'
import type { DailyTriviaResponse, QuestionWithoutAnswer } from '@/lib/database.types'

/**
 * Get the current day identifier based on game schedule
 * Days -4, -3, -2, -1 before game day, then 'game_day'
 */
function getCurrentDayIdentifier(): string {
  // For demo, just use a fixed identifier
  // In production, calculate based on game date
  return 'day_minus_4'
}

/**
 * Strip answer information from question for client
 */
function stripAnswers(question: {
  id: string
  question_text: string
  image_url: string | null
  options: string[]
  hint_text: string | null
  time_limit_seconds: number
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string | null
}): QuestionWithoutAnswer {
  return {
    id: question.id,
    question_text: question.question_text,
    image_url: question.image_url,
    options: question.options,
    hint_text: question.hint_text,
    time_limit_seconds: question.time_limit_seconds,
    points: question.points,
    difficulty: question.difficulty,
    category: question.category
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get team ID from header or query param
    const teamId = request.headers.get('x-team-id') ||
                   request.nextUrl.searchParams.get('team_id')

    const dayIdentifier = getCurrentDayIdentifier()

    // Demo mode - return sample questions
    if (isDemoMode()) {
      // Check if team has completed today (from localStorage on client side)
      const demoQuestions = sampleQuestions.slice(0, 5).map(q => ({
        id: q.id,
        question_text: q.question,
        image_url: q.imageUrl,
        options: q.options,
        hint_text: q.explanation || null,
        time_limit_seconds: 15,
        points: 100,
        difficulty: q.difficulty,
        category: q.category
      }))

      const response: DailyTriviaResponse = {
        day_identifier: dayIdentifier,
        display_date: new Date().toISOString().split('T')[0],
        questions: demoQuestions.map(stripAnswers),
        already_completed: false
      }

      return NextResponse.json(response)
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check if team has already completed today
    if (teamId) {
      const { data: progress } = await supabase
        .from('team_daily_progress')
        .select('*')
        .eq('team_id', teamId)
        .eq('day_identifier', dayIdentifier)
        .single()

      if (progress?.completed) {
        return NextResponse.json({
          day_identifier: dayIdentifier,
          display_date: new Date().toISOString().split('T')[0],
          questions: [],
          already_completed: true,
          team_progress: {
            total_points: progress.total_points,
            completed_at: progress.completed_at
          }
        })
      }
    }

    // Get today's trivia set
    const { data: dailySet, error: setError } = await supabase
      .from('daily_trivia_sets')
      .select('*')
      .eq('day_identifier', dayIdentifier)
      .eq('is_active', true)
      .single()

    if (setError || !dailySet) {
      // No set configured for today, return sample questions in demo mode
      console.warn('No active trivia set for', dayIdentifier)

      // Return sample questions as fallback
      const fallbackQuestions = sampleQuestions.slice(0, 5).map(q => ({
        id: q.id,
        question_text: q.question,
        image_url: q.imageUrl,
        options: q.options,
        hint_text: q.explanation || null,
        time_limit_seconds: 15,
        points: 100,
        difficulty: q.difficulty,
        category: q.category
      }))

      return NextResponse.json({
        day_identifier: dayIdentifier,
        display_date: new Date().toISOString().split('T')[0],
        questions: fallbackQuestions.map(stripAnswers),
        already_completed: false
      })
    }

    // Fetch questions by IDs
    const { data: questions, error: questionsError } = await supabase
      .from('trivia_questions')
      .select('*')
      .in('id', dailySet.question_ids)

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: 'Failed to load questions' },
        { status: 500 }
      )
    }

    // Sort questions by the order in question_ids
    const sortedQuestions = dailySet.question_ids
      .map(id => questions.find(q => q.id === id))
      .filter(Boolean) as typeof questions

    const response: DailyTriviaResponse = {
      day_identifier: dailySet.day_identifier,
      display_date: dailySet.display_date,
      questions: sortedQuestions.map(stripAnswers),
      already_completed: false
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Daily trivia error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
