import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints, type AnswerOption, type AnswerResult } from '@/lib/database.types'
import { logServer, logTrivia, logServerError } from '@/lib/error-tracking/server-logger'
import { sampleQuestions } from '@/lib/mock-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Build demo answers dynamically from the full sampleQuestions list so that
// all demo-1 through demo-N IDs are covered (the old hard-coded map only had
// demo-1..demo-5, causing "Question not found" for demo-6+).
const DEMO_ANSWERS: Record<string, AnswerOption> = Object.fromEntries(
  sampleQuestions.map(q => [q.id, q.correct_answer])
)

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

    logServer({
      level: 'info',
      component: 'trivia-answer',
      event: 'answer_request_received',
      data: {
        username,
        question_id,
        selected_answer,
        time_taken_ms,
        has_supabase: !!(supabaseUrl && supabaseServiceKey),
      }
    })

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
      logServer({
        level: 'info',
        component: 'trivia-answer',
        event: 'demo_mode_active',
        data: { question_id, selected_answer }
      })

      const correctAnswer = DEMO_ANSWERS[question_id]
      if (!correctAnswer) {
        logServer({
          level: 'warn',
          component: 'trivia-answer',
          event: 'demo_question_not_found',
          data: { question_id, available_demo_ids: Object.keys(DEMO_ANSWERS) }
        })
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

      const isCorrect = selected_answer === correctAnswer

      logTrivia({
        level: isCorrect ? 'info' : 'warn',
        event: 'answer_submitted',
        userId: username,
        questionId: question_id,
        userAnswer: selected_answer,
        correct: isCorrect,
        data: {
          mode: 'demo',
          correct_answer_from_demo: correctAnswer,
          selected_answer,
          match: selected_answer === correctAnswer,
        }
      })
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
      .select('username, current_streak, total_points, days_played, last_played_at')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 401 }
      )
    }

    // Get current day from settings first (needed for duplicate check and insert)
    const { data: settings } = await supabase
      .from('game_settings')
      .select('current_day')
      .eq('id', 1)
      .single()

    const dayIdentifier = settings?.current_day || 'day_1'

    // Check if already answered this question (across all days, not just current)
    // to prevent earning duplicate points by replaying on a different day
    const { data: existingAnswer } = await supabase
      .from('daily_answers')
      .select('id, selected_answer, is_correct, points_earned, streak_bonus')
      .eq('username', username)
      .eq('question_id', question_id)
      .order('answered_at', { ascending: false })
      .limit(1)
      .single()

    if (existingAnswer) {
      // Duplicate answer — grade the CURRENT selection so UI feedback is
      // accurate, but award zero additional points to prevent point farming.
      const { data: existingQuestion } = await supabase
        .from('trivia_questions')
        .select('correct_answer')
        .eq('id', question_id)
        .single()

      const correctAnswer = (existingQuestion?.correct_answer || existingAnswer.selected_answer) as AnswerOption
      const currentIsCorrect = selected_answer === correctAnswer

      const result: AnswerResult = {
        is_correct: currentIsCorrect,
        correct_answer: correctAnswer,
        points_earned: 0,
        streak_bonus: 0,
        current_streak: user.current_streak,
        total_points: user.total_points,
      }

      logServer({
        level: 'info',
        component: 'trivia-answer',
        event: 'duplicate_answer_idempotent',
        data: {
          username,
          question_id,
          original_answer: existingAnswer.selected_answer,
          new_attempt: selected_answer,
          same_answer: existingAnswer.selected_answer === selected_answer,
          current_is_correct: currentIsCorrect,
        }
      })

      return NextResponse.json({ ...result, already_answered: true }, { status: 200 })
    }

    // Get the question to check answer
    const { data: question, error: questionError } = await supabase
      .from('trivia_questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, hint_text, category')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      logServer({
        level: 'error',
        component: 'trivia-answer',
        event: 'question_not_found_in_db',
        data: { question_id, error: questionError?.message || 'No data returned' }
      })
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const isCorrect = selected_answer === question.correct_answer

    // Detailed logging for answer grading
    logTrivia({
      level: isCorrect ? 'info' : 'warn',
      event: 'answer_submitted',
      userId: username,
      questionId: question_id,
      questionText: question.question_text,
      userAnswer: selected_answer,
      correct: isCorrect,
      data: {
        mode: 'supabase',
        db_correct_answer: question.correct_answer,
        selected_answer,
        match: selected_answer === question.correct_answer,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer_text: question[`option_${question.correct_answer}` as keyof typeof question],
        selected_answer_text: question[`option_${selected_answer}` as keyof typeof question],
      }
    })

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

    // Save answer
    const { error: insertError } = await supabase
      .from('daily_answers')
      .insert({
        username,
        question_id,
        day_identifier: dayIdentifier,
        category: question.category,
        selected_answer,
        is_correct: isCorrect,
        points_earned: points,
        streak_bonus: streakBonus,
        time_taken_ms,
      })

    if (insertError) {
      // Handle race condition: if duplicate constraint fires despite the check above
      if (insertError.code === '23505') {
        // Return idempotent result even on race condition
        const raceResult: AnswerResult = {
          is_correct: isCorrect,
          correct_answer: question.correct_answer as AnswerOption,
          points_earned: points,
          streak_bonus: streakBonus,
          current_streak: newStreak,
          total_points: user.total_points,
        }
        logServer({
          level: 'info',
          component: 'trivia-answer',
          event: 'duplicate_answer_race_condition',
          data: { username, question_id }
        })
        return NextResponse.json({ ...raceResult, already_answered: true }, { status: 200 })
      }
      console.error('Answer insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      )
    }

    // Check if this is the first play of a new calendar day
    const todayDate = new Date().toISOString().split('T')[0]
    const lastPlayedDate = user.last_played_at
      ? new Date(user.last_played_at).toISOString().split('T')[0]
      : null
    const isNewDay = lastPlayedDate !== todayDate

    // Update user's current streak, total points, and days_played
    const pointsToAdd = points + streakBonus
    const updateData: Record<string, unknown> = {
      current_streak: newStreak,
      total_points: user.total_points + pointsToAdd,
    }
    if (isNewDay) {
      updateData.days_played = (user.days_played || 0) + 1
    }
    await supabase
      .from('users')
      .update(updateData)
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

    logServer({
      level: 'info',
      component: 'trivia-answer',
      event: 'answer_result_sent',
      data: {
        username,
        question_id,
        result_is_correct: result.is_correct,
        result_correct_answer: result.correct_answer,
        selected_answer,
        points_earned: result.points_earned,
        streak_bonus: result.streak_bonus,
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    logServerError('trivia-answer', 'answer_submission_error', error, {
      body: 'Unable to parse - error during processing'
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
