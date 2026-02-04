import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import type { GameSettings, TriviaQuestionPublic } from '@/lib/database.types'

// GET - Get current live game state and question
export async function GET(request: NextRequest) {
  try {
    const username = request.headers.get('x-username')

    // Demo mode response
    if (isDemoMode()) {
      const demoGameSettings: GameSettings = {
        id: 1,
        current_mode: 'daily', // Not live in demo
        questions_per_day: 5,
        timer_duration: 15,
        scores_locked: false,
        current_day: 'day_minus_4',
        live_question_index: 0,
        is_paused: false,
        updated_at: new Date().toISOString()
      }

      return NextResponse.json({
        game_settings: demoGameSettings,
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

    // Get game settings
    const { data: gameSettings, error: settingsError } = await supabase
      .from('game_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !gameSettings) {
      return NextResponse.json(
        { error: 'Failed to get game settings' },
        { status: 500 }
      )
    }

    // If not in live mode, return settings only
    if (gameSettings.current_mode !== 'live') {
      return NextResponse.json({
        game_settings: gameSettings,
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
        game_settings: gameSettings,
        is_live: true,
        current_question: null,
        message: 'Waiting for next question'
      })
    }

    // Get current question
    const questionId = liveRound.question_ids[gameSettings.live_question_index]

    if (!questionId) {
      return NextResponse.json({
        game_settings: gameSettings,
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
        game_settings: gameSettings,
        is_live: true,
        current_question: null,
        error: 'Question not found'
      })
    }

    // Check if user already answered this question
    let alreadyAnswered = false
    if (username) {
      const { data: existingAnswer } = await supabase
        .from('daily_answers')
        .select('id')
        .eq('username', username)
        .eq('question_id', questionId)
        .single()

      alreadyAnswered = !!existingAnswer
    }

    // Strip answer from question
    const safeQuestion: TriviaQuestionPublic = {
      id: question.id,
      question_text: question.question_text,
      image_url: question.image_url,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      hint_text: question.hint_text,
      time_limit_seconds: question.time_limit_seconds,
      points: question.points,
      difficulty: question.difficulty,
      category: question.category
    }

    return NextResponse.json({
      game_settings: gameSettings,
      is_live: true,
      current_question: safeQuestion,
      question_index: gameSettings.live_question_index,
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
