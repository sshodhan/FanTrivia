import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import { calculateScore } from '@/lib/scoring'
import { sampleQuestions } from '@/lib/mock-data'
import type { AnswerSubmissionRequest, AnswerSubmissionResponse, ScoreInsert } from '@/lib/database.types'

// Track current streak per team (in memory for demo, use DB in production)
const teamStreaks = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    // Get authentication from headers
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const teamId = request.headers.get('x-team-id')

    if (!sessionToken || !teamId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json() as AnswerSubmissionRequest
    const { team_id, question_id, answer_index, time_taken_ms } = body

    // Validate input
    if (!team_id || !question_id || answer_index === undefined || time_taken_ms === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify that the team_id in body matches the authenticated team
    if (team_id !== teamId) {
      return NextResponse.json(
        { error: 'Team ID mismatch' },
        { status: 403 }
      )
    }

    if (answer_index < 0 || answer_index > 3) {
      return NextResponse.json(
        { error: 'Invalid answer index' },
        { status: 400 }
      )
    }

    // Demo mode
    if (isDemoMode()) {
      // In demo mode, accept demo session tokens
      if (!sessionToken.startsWith('demo_ses_')) {
        return NextResponse.json(
          { error: 'Invalid session token' },
          { status: 401 }
        )
      }

      // Find question in sample data
      const question = sampleQuestions.find(q => q.id === question_id)

      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

      const isCorrect = answer_index === question.correctAnswer
      const currentStreak = teamStreaks.get(team_id) || 0

      const scoring = calculateScore(isCorrect, time_taken_ms, currentStreak)

      // Update streak
      if (isCorrect) {
        teamStreaks.set(team_id, currentStreak + 1)
      } else {
        teamStreaks.set(team_id, 0)
      }

      const response: AnswerSubmissionResponse = {
        is_correct: isCorrect,
        correct_answer_index: question.correctAnswer,
        points_earned: scoring.totalPoints,
        streak_bonus: scoring.streakBonus,
        current_streak: scoring.newStreak,
        explanation: question.explanation
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

    // Verify session token matches the team
    const { data: team, error: sessionError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !team) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if answer already submitted
    const { data: existingScore } = await supabase
      .from('scores')
      .select('id')
      .eq('team_id', team_id)
      .eq('question_id', question_id)
      .single()

    if (existingScore) {
      return NextResponse.json(
        { error: 'Answer already submitted for this question' },
        { status: 409 }
      )
    }

    // Get the question to check answer
    const { data: question, error: questionError } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Check if answer is correct
    const isCorrect = answer_index === question.correct_answer_index

    // Get current streak from recent scores
    const { data: recentScores } = await supabase
      .from('scores')
      .select('is_correct')
      .eq('team_id', team_id)
      .order('answered_at', { ascending: false })
      .limit(10)

    let currentStreak = 0
    if (recentScores) {
      for (const score of recentScores) {
        if (score.is_correct) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate score
    const scoring = calculateScore(
      isCorrect,
      time_taken_ms,
      currentStreak,
      question.time_limit_seconds
    )

    // Get current day identifier
    const dayIdentifier = 'day_minus_4' // TODO: Calculate dynamically

    // Save score
    const scoreRecord: ScoreInsert = {
      team_id,
      question_id,
      day_identifier: dayIdentifier,
      is_correct: isCorrect,
      points_earned: scoring.totalPoints,
      streak_bonus: scoring.streakBonus,
      time_taken_ms
    }

    const { error: insertError } = await supabase
      .from('scores')
      .insert(scoreRecord)

    if (insertError) {
      console.error('Score insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500 }
      )
    }

    // Check if all questions for today are answered
    const { data: dailySet } = await supabase
      .from('daily_trivia_sets')
      .select('question_ids')
      .eq('day_identifier', dayIdentifier)
      .eq('is_active', true)
      .single()

    if (dailySet) {
      const { data: answeredScores } = await supabase
        .from('scores')
        .select('question_id, points_earned, streak_bonus')
        .eq('team_id', team_id)
        .in('question_id', dailySet.question_ids)

      if (answeredScores && answeredScores.length === dailySet.question_ids.length) {
        // All questions answered, update daily progress
        const totalPoints = answeredScores.reduce(
          (sum, s) => sum + s.points_earned + s.streak_bonus,
          0
        )

        await supabase
          .from('team_daily_progress')
          .upsert({
            team_id,
            day_identifier: dayIdentifier,
            completed: true,
            total_points: totalPoints,
            completed_at: new Date().toISOString()
          })
      }
    }

    const response: AnswerSubmissionResponse = {
      is_correct: isCorrect,
      correct_answer_index: question.correct_answer_index,
      points_earned: scoring.totalPoints,
      streak_bonus: scoring.streakBonus,
      current_streak: scoring.newStreak,
      explanation: question.hint_text || undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
