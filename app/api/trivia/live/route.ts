import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import type { GameState, QuestionWithoutAnswer } from '@/lib/database.types'

// GET - Get current live game state and question
export async function GET(request: NextRequest) {
  try {
    const teamId = request.headers.get('x-team-id')

    // Demo mode response
    if (isDemoMode()) {
      const demoGameState: GameState = {
        id: 1,
        current_mode: 'daily', // Not live in demo
        current_day: 'day_minus_4',
        live_question_index: 0,
        is_paused: false,
        leaderboard_locked: false,
        updated_at: new Date().toISOString()
      }

      return NextResponse.json({
        game_state: demoGameState,
        is_live: false,
        current_question: null,
        message: 'Live game not active'
      })
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get game state
    const { data: gameState, error: stateError } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (stateError || !gameState) {
      return NextResponse.json(
        { error: 'Failed to get game state' },
        { status: 500 }
      )
    }

    // If not in live mode, return state only
    if (gameState.current_mode !== 'live') {
      return NextResponse.json({
        game_state: gameState,
        is_live: false,
        current_question: null
      })
    }

    // Get current live round
    const { data: liveRound, error: roundError } = await supabase
      .from('game_day_rounds')
      .select('*')
      .eq('is_live', true)
      .single()

    if (roundError || !liveRound) {
      return NextResponse.json({
        game_state: gameState,
        is_live: true,
        current_question: null,
        message: 'Waiting for next question'
      })
    }

    // Get current question
    const questionId = liveRound.question_ids[gameState.live_question_index]

    if (!questionId) {
      return NextResponse.json({
        game_state: gameState,
        is_live: true,
        current_question: null,
        message: 'All questions completed'
      })
    }

    const { data: question, error: questionError } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json({
        game_state: gameState,
        is_live: true,
        current_question: null,
        error: 'Question not found'
      })
    }

    // Check if team already answered this question
    let alreadyAnswered = false
    if (teamId) {
      const { data: existingAnswer } = await supabase
        .from('scores')
        .select('id')
        .eq('team_id', teamId)
        .eq('question_id', questionId)
        .single()

      alreadyAnswered = !!existingAnswer
    }

    // Strip answer from question
    const safeQuestion: QuestionWithoutAnswer = {
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

    return NextResponse.json({
      game_state: gameState,
      is_live: true,
      current_question: safeQuestion,
      question_index: gameState.live_question_index,
      total_questions: liveRound.question_ids.length,
      already_answered: alreadyAnswered
    })

  } catch (error) {
    console.error('Live trivia error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
