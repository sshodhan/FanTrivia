import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints, type AnswerOption, type AnswerResult } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Demo mode correct answers
const DEMO_ANSWERS: Record<string, AnswerOption> = {
  'demo-1': 'b', // 2013
  'demo-2': 'c', // Malcolm Smith
  'demo-3': 'a', // 43-8
  'demo-4': 'c', // Denver Broncos
  'demo-5': 'b', // Legion of Boom
}

// In-memory streak tracking for demo mode
const demoStreaks = new Map<string, number>()

interface AnswerRequest {
  username: string
  question_id: string
  selected_answer: AnswerOption
  time_taken_ms: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnswerRequest
    const { username, question_id, selected_answer, time_taken_ms } = body

    // Validate input
    if (!username || !question_id || !selected_answer || time_taken_ms === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: username, question_id, selected_answer, time_taken_ms' },
        { status: 400 }
      )
    }

    if (!['a', 'b', 'c', 'd'].includes(selected_answer)) {
      return NextResponse.json(
        { error: 'Invalid answer. Must be a, b, c, or d' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Demo mode
    if (!supabase) {
      const correctAnswer = DEMO_ANSWERS[question_id]
      if (!correctAnswer) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

      const isCorrect = selected_answer === correctAnswer
      const currentStreak = demoStreaks.get(username) || 0
      const { points, streakBonus, newStreak } = calculatePoints(isCorrect, time_taken_ms, currentStreak)

      // Update demo streak
      demoStreaks.set(username, newStreak)

      const result: AnswerResult = {
        is_correct: isCorrect,
        correct_answer: correctAnswer,
        points_earned: points,
        streak_bonus: streakBonus,
        current_streak: newStreak,
        total_points: points + streakBonus, // Demo doesn't track total
      }

      return NextResponse.json(result)
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, current_streak, total_points')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 401 }
      )
    }

    // Check if already answered this question today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingAnswer } = await supabase
      .from('daily_answers')
      .select('id')
      .eq('username', username)
      .eq('question_id', question_id)
      .gte('answered_at', `${today}T00:00:00`)
      .single()

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'You have already answered this question today' },
        { status: 409 }
      )
    }

    // Get the question to check answer
    const { data: question, error: questionError } = await supabase
      .from('trivia_questions')
      .select('correct_answer, hint_text')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const isCorrect = selected_answer === question.correct_answer

    // Get current streak from recent answers
    const { data: recentAnswers } = await supabase
      .from('daily_answers')
      .select('is_correct')
      .eq('username', username)
      .order('answered_at', { ascending: false })
      .limit(10)

    let currentStreak = 0
    if (recentAnswers) {
      for (const answer of recentAnswers) {
        if (answer.is_correct) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate score
    const { points, streakBonus, newStreak } = calculatePoints(isCorrect, time_taken_ms, currentStreak)

    // Get current day from settings
    const { data: settings } = await supabase
      .from('game_settings')
      .select('current_day')
      .eq('id', 1)
      .single()

    const dayIdentifier = settings?.current_day || 'day_1'

    // Save answer
    const { error: insertError } = await supabase
      .from('daily_answers')
      .insert({
        username,
        question_id,
        day_identifier: dayIdentifier,
        selected_answer,
        is_correct: isCorrect,
        points_earned: points,
        streak_bonus: streakBonus,
        time_taken_ms,
      })

    if (insertError) {
      console.error('Answer insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      )
    }

    // Update user's current streak and total points
    const pointsToAdd = points + streakBonus
    await supabase
      .from('users')
      .update({ 
        current_streak: newStreak,
        total_points: user.total_points + pointsToAdd
      })
      .eq('username', username)

    // Get updated total points
    const { data: updatedUser } = await supabase
      .from('users')
      .select('total_points')
      .eq('username', username)
      .single()

    const result: AnswerResult = {
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      points_earned: points,
      streak_bonus: streakBonus,
      current_streak: newStreak,
      total_points: updatedUser?.total_points || 0,
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
