import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAccess } from '@/lib/admin-auth'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { ALL_CATEGORIES } from '@/lib/category-data'

interface CategoryStatus {
  categoryId: string
  title: string
  dbCategory: string
  expectedQuestions: number
  answeredQuestions: number
  correctAnswers: number
  totalPoints: number
  isCompleted: boolean
}

interface UserTriviaReport {
  username: string
  totalPoints: number
  completedCategories: CategoryStatus[]
  pendingCategories: CategoryStatus[]
  unattemptedCategories: Array<{
    categoryId: string
    title: string
    expectedQuestions: number
  }>
}

// GET - Verify trivia completion status for all users
export async function GET(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    if (isDemoMode()) {
      return NextResponse.json({
        error: 'Not available in demo mode',
      }, { status: 503 })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, total_points')
      .order('total_points', { ascending: false })

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        users: [],
        summary: { totalUsers: 0, categoriesDefinition: ALL_CATEGORIES.length },
      })
    }

    // Fetch ALL daily_answers in one query (more efficient than per-user)
    const { data: allAnswers, error: answersError } = await supabase
      .from('daily_answers')
      .select('username, question_id, is_correct, points_earned, streak_bonus, category, answered_at')
      .order('answered_at', { ascending: false })

    if (answersError) {
      return NextResponse.json(
        { error: 'Failed to fetch answers', details: answersError.message },
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

    // Also count actual questions per dbCategory in the database
    const { data: questionCounts, error: qcError } = await supabase
      .from('trivia_questions')
      .select('category')
      .eq('is_active', true)

    const dbQuestionCounts = new Map<string, number>()
    if (questionCounts) {
      for (const q of questionCounts) {
        if (q.category) {
          dbQuestionCounts.set(q.category, (dbQuestionCounts.get(q.category) || 0) + 1)
        }
      }
    }

    // Build report for each user
    const reports: UserTriviaReport[] = []

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
        const dbCategory = answer.category
        if (!dbCategory) continue

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

      // Map to categories
      const completedCategories: CategoryStatus[] = []
      const pendingCategories: CategoryStatus[] = []
      const unattemptedCategories: Array<{
        categoryId: string
        title: string
        expectedQuestions: number
      }> = []

      for (const cat of ALL_CATEGORIES) {
        if (!cat.dbCategory) continue

        const stats = categoryStats.get(cat.dbCategory)

        if (!stats || stats.totalAnswered === 0) {
          unattemptedCategories.push({
            categoryId: cat.id,
            title: cat.title,
            expectedQuestions: cat.questionCount,
          })
          continue
        }

        const isCompleted = stats.totalAnswered >= cat.questionCount
        const status: CategoryStatus = {
          categoryId: cat.id,
          title: cat.title,
          dbCategory: cat.dbCategory,
          expectedQuestions: cat.questionCount,
          answeredQuestions: stats.totalAnswered,
          correctAnswers: stats.correctAnswers,
          totalPoints: stats.totalPoints,
          isCompleted,
        }

        if (isCompleted) {
          completedCategories.push(status)
        } else {
          pendingCategories.push(status)
        }
      }

      reports.push({
        username: user.username,
        totalPoints: user.total_points,
        completedCategories,
        pendingCategories,
        unattemptedCategories,
      })
    }

    // Build category-level summary: expected vs actual question counts
    const categoryDiscrepancies: Array<{
      categoryId: string
      title: string
      configuredCount: number
      actualDbCount: number
      match: boolean
    }> = []

    for (const cat of ALL_CATEGORIES) {
      if (!cat.dbCategory) continue
      const actualCount = dbQuestionCounts.get(cat.dbCategory) || 0
      categoryDiscrepancies.push({
        categoryId: cat.id,
        title: cat.title,
        configuredCount: cat.questionCount,
        actualDbCount: actualCount,
        match: actualCount >= cat.questionCount,
      })
    }

    return NextResponse.json({
      users: reports,
      categoryQuestionCounts: categoryDiscrepancies,
      summary: {
        totalUsers: users.length,
        totalCategories: ALL_CATEGORIES.length,
        usersWithActivity: reports.filter(r =>
          r.completedCategories.length > 0 || r.pendingCategories.length > 0
        ).length,
        mismatches: categoryDiscrepancies.filter(c => !c.match),
      },
    })
  } catch (error) {
    console.error('Verify trivia status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
