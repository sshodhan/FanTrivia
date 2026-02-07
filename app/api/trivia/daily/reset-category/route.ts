import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logServer, logServerError } from '@/lib/error-tracking/server-logger'
import { ALL_CATEGORIES } from '@/lib/category-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface ResetCategoryRequest {
  username: string
  category_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ResetCategoryRequest
    const { username, category_id } = body

    if (!username || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields: username, category_id' },
        { status: 400 }
      )
    }

    // Look up the category to get the DB category name
    const category = ALL_CATEGORIES.find(c => c.id === category_id)
    if (!category || !category.dbCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: true, mode: 'demo', deleted: 0 })
    }

    logServer({
      level: 'info',
      component: 'reset-category',
      event: 'reset_started',
      data: { username, category_id, dbCategory: category.dbCategory }
    })

    // Verify user exists and get current points
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, total_points, current_streak')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get current day from settings
    const { data: settings } = await supabase
      .from('game_settings')
      .select('current_day')
      .eq('id', 1)
      .single()

    const dayIdentifier = settings?.current_day || 'day_1'

    // Find all question IDs in this category
    const { data: categoryQuestions, error: questionsError } = await supabase
      .from('trivia_questions')
      .select('id')
      .eq('category', category.dbCategory)
      .eq('is_active', true)

    if (questionsError || !categoryQuestions || categoryQuestions.length === 0) {
      logServer({
        level: 'warn',
        component: 'reset-category',
        event: 'no_questions_found',
        data: { category_id, dbCategory: category.dbCategory, error: questionsError?.message }
      })
      return NextResponse.json(
        { error: 'No questions found for this category' },
        { status: 404 }
      )
    }

    const questionIds = categoryQuestions.map(q => q.id)

    // Get the answers to delete so we can calculate the points to subtract
    const { data: answersToDelete, error: answersLookupError } = await supabase
      .from('daily_answers')
      .select('id, points_earned, streak_bonus')
      .eq('username', username)
      .eq('day_identifier', dayIdentifier)
      .in('question_id', questionIds)

    if (answersLookupError) {
      logServerError('reset-category', 'answers_lookup_error', answersLookupError, {
        username, category_id, dayIdentifier
      })
      return NextResponse.json(
        { error: 'Failed to look up answers' },
        { status: 500 }
      )
    }

    if (!answersToDelete || answersToDelete.length === 0) {
      logServer({
        level: 'info',
        component: 'reset-category',
        event: 'no_answers_to_reset',
        data: { username, category_id, dayIdentifier }
      })
      return NextResponse.json({ success: true, deleted: 0, points_deducted: 0 })
    }

    // Calculate total points to subtract
    const pointsToDeduct = answersToDelete.reduce(
      (sum, a) => sum + (a.points_earned || 0) + (a.streak_bonus || 0),
      0
    )

    const answerIds = answersToDelete.map(a => a.id)

    // Delete the answers
    const { error: deleteError, count: deletedCount } = await supabase
      .from('daily_answers')
      .delete({ count: 'exact' })
      .in('id', answerIds)

    if (deleteError) {
      logServerError('reset-category', 'delete_answers_error', deleteError, {
        username, category_id, answerIds
      })
      return NextResponse.json(
        { error: 'Failed to delete answers' },
        { status: 500 }
      )
    }

    // Deduct points from user
    const newTotalPoints = Math.max(0, user.total_points - pointsToDeduct)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_points: newTotalPoints,
        current_streak: 0, // Reset streak since we removed answers mid-sequence
      })
      .eq('username', username)

    if (updateError) {
      logServerError('reset-category', 'update_user_error', updateError, {
        username, newTotalPoints, pointsToDeduct
      })
      // Answers are already deleted, so this is a partial failure
    }

    logServer({
      level: 'info',
      component: 'reset-category',
      event: 'reset_complete',
      data: {
        username,
        category_id,
        dbCategory: category.dbCategory,
        dayIdentifier,
        answers_deleted: deletedCount ?? 0,
        points_deducted: pointsToDeduct,
        new_total_points: newTotalPoints,
      }
    })

    return NextResponse.json({
      success: true,
      deleted: deletedCount ?? 0,
      points_deducted: pointsToDeduct,
      new_total_points: newTotalPoints,
    })
  } catch (error) {
    logServerError('reset-category', 'reset_unhandled_error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
