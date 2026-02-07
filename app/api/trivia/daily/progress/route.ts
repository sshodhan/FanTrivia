import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logServer, logServerError } from '@/lib/error-tracking/server-logger'
import { ALL_CATEGORIES } from '@/lib/category-data'
import type { CategoryProgress } from '@/lib/category-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'username query param is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ progress: [] })
    }

    // Get current day identifier (used for response metadata)
    const { data: settings } = await supabase
      .from('game_settings')
      .select('current_day')
      .eq('id', 1)
      .single()

    const dayIdentifier = settings?.current_day || 'day_1'

    // Fetch all answers by this user across ALL days, joined with question category.
    // Categories are cumulative (once unlocked, they stay), so progress must persist
    // across day transitions. We deduplicate by question_id below.
    const { data: answers, error: answersError } = await supabase
      .from('daily_answers')
      .select(`
        question_id,
        is_correct,
        points_earned,
        streak_bonus,
        answered_at,
        trivia_questions!inner(category)
      `)
      .eq('username', username)
      .order('answered_at', { ascending: false })

    if (answersError) {
      logServerError('trivia-progress', 'fetch_answers_error', answersError, { username, dayIdentifier })
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    if (!answers || answers.length === 0) {
      return NextResponse.json({ progress: [], day_identifier: dayIdentifier })
    }

    // Deduplicate by question_id: keep the most recent answer per question
    // (answers are ordered by answered_at DESC, so first occurrence is latest)
    const seenQuestions = new Set<string>()
    const uniqueAnswers = []
    for (const answer of answers) {
      if (!seenQuestions.has(answer.question_id)) {
        seenQuestions.add(answer.question_id)
        uniqueAnswers.push(answer)
      }
    }

    // Build a map of dbCategory -> { correctAnswers, totalAnswered, totalPoints }
    const categoryStats = new Map<string, {
      correctAnswers: number
      totalAnswered: number
      totalPoints: number
    }>()

    for (const answer of uniqueAnswers) {
      // trivia_questions is the joined row
      const questionData = answer.trivia_questions as unknown as { category: string | null }
      const dbCategory = questionData?.category || 'Unknown'

      const existing = categoryStats.get(dbCategory) || {
        correctAnswers: 0,
        totalAnswered: 0,
        totalPoints: 0,
      }

      existing.totalAnswered++
      if (answer.is_correct) {
        existing.correctAnswers++
      }
      existing.totalPoints += (answer.points_earned || 0) + (answer.streak_bonus || 0)

      categoryStats.set(dbCategory, existing)
    }

    // Map dbCategory stats back to client category IDs
    const progress: CategoryProgress[] = []

    for (const cat of ALL_CATEGORIES) {
      if (!cat.dbCategory) continue

      const stats = categoryStats.get(cat.dbCategory)
      if (!stats || stats.totalAnswered === 0) continue

      progress.push({
        categoryId: cat.id,
        isCompleted: stats.totalAnswered >= cat.questionCount,
        score: stats.correctAnswers,
        correctAnswers: stats.correctAnswers,
        totalQuestions: cat.questionCount,
        totalPoints: stats.totalPoints,
      })
    }

    logServer({
      level: 'info',
      component: 'trivia-progress',
      event: 'progress_fetched',
      data: {
        username,
        dayIdentifier,
        total_answers: answers.length,
        unique_answers: uniqueAnswers.length,
        categories_with_progress: progress.length,
      }
    })

    return NextResponse.json({ progress, day_identifier: dayIdentifier })
  } catch (error) {
    logServerError('trivia-progress', 'progress_unhandled_error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
