import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ALL_CATEGORIES } from '@/lib/category-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface CategoryStatus {
  categoryId: string
  title: string
  expectedQuestions: number
  answeredQuestions: number
  correctAnswers: number
  totalPoints: number
  isCompleted: boolean
}

interface UserStatus {
  username: string
  totalPoints: number
  completedCount: number
  pendingCount: number
  unattemptedCount: number
  categories: CategoryStatus[]
}

export async function GET() {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ users: [] })
    }

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, total_points')
      .order('total_points', { ascending: false })

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Fetch all daily_answers in one query
    const { data: allAnswers, error: answersError } = await supabase
      .from('daily_answers')
      .select('username, question_id, is_correct, points_earned, streak_bonus, category, answered_at')
      .order('answered_at', { ascending: false })

    if (answersError) {
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      )
    }

    // Group answers by username
    const answersByUser = new Map<string, typeof allAnswers>()
    for (const answer of (allAnswers || [])) {
      const existing = answersByUser.get(answer.username) || []
      existing.push(answer)
      answersByUser.set(answer.username, existing)
    }

    const totalCategories = ALL_CATEGORIES.filter(c => c.dbCategory).length

    // Build status for each user
    const result: UserStatus[] = []

    for (const user of users) {
      const userAnswers = answersByUser.get(user.username) || []

      // Deduplicate by question_id (keep most recent)
      const seenQuestions = new Set<string>()
      const uniqueAnswers = []
      for (const answer of userAnswers) {
        if (!seenQuestions.has(answer.question_id)) {
          seenQuestions.add(answer.question_id)
          uniqueAnswers.push(answer)
        }
      }

      // Group by category
      const categoryStats = new Map<string, {
        correctAnswers: number
        totalAnswered: number
        totalPoints: number
      }>()

      for (const answer of uniqueAnswers) {
        if (!answer.category) continue
        const existing = categoryStats.get(answer.category) || {
          correctAnswers: 0,
          totalAnswered: 0,
          totalPoints: 0,
        }
        existing.totalAnswered++
        if (answer.is_correct) existing.correctAnswers++
        existing.totalPoints += (answer.points_earned || 0) + (answer.streak_bonus || 0)
        categoryStats.set(answer.category, existing)
      }

      // Map to categories
      const categories: CategoryStatus[] = []
      let completedCount = 0
      let pendingCount = 0
      let unattemptedCount = 0

      for (const cat of ALL_CATEGORIES) {
        if (!cat.dbCategory) continue
        const stats = categoryStats.get(cat.dbCategory)

        if (!stats || stats.totalAnswered === 0) {
          unattemptedCount++
          continue
        }

        const isCompleted = stats.totalAnswered >= cat.questionCount
        if (isCompleted) completedCount++
        else pendingCount++

        categories.push({
          categoryId: cat.id,
          title: cat.title,
          expectedQuestions: cat.questionCount,
          answeredQuestions: stats.totalAnswered,
          correctAnswers: stats.correctAnswers,
          totalPoints: stats.totalPoints,
          isCompleted,
        })
      }

      result.push({
        username: user.username,
        totalPoints: user.total_points,
        completedCount,
        pendingCount,
        unattemptedCount,
        categories,
      })
    }

    return NextResponse.json({
      users: result,
      totalCategories,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Trivia all-status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
