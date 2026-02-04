import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { TriviaQuestionPublic, DailyTriviaResponse, GameSettings } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Demo questions when Supabase not configured
const DEMO_QUESTIONS: TriviaQuestionPublic[] = [
  {
    id: 'demo-1',
    question_text: 'What year did the Seattle Seahawks win their first Super Bowl?',
    image_url: null,
    option_a: '2012',
    option_b: '2013',
    option_c: '2014',
    option_d: '2015',
    hint_text: 'The season was 2013-2014',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy',
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-2',
    question_text: 'Who was named MVP of Super Bowl XLVIII?',
    image_url: null,
    option_a: 'Russell Wilson',
    option_b: 'Marshawn Lynch',
    option_c: 'Malcolm Smith',
    option_d: 'Richard Sherman',
    hint_text: 'He had a pick-six',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy',
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-3',
    question_text: 'What was the final score of Super Bowl XLVIII?',
    image_url: null,
    option_a: '43-8',
    option_b: '34-7',
    option_c: '38-10',
    option_d: '41-14',
    hint_text: 'It was the largest margin in Super Bowl history at the time',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'medium',
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-4',
    question_text: 'Which team did the Seahawks defeat in Super Bowl XLVIII?',
    image_url: null,
    option_a: 'New England Patriots',
    option_b: 'San Francisco 49ers',
    option_c: 'Denver Broncos',
    option_d: 'Green Bay Packers',
    hint_text: 'They had the #1 offense that year',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy',
    category: 'Super Bowl XLVIII',
  },
  {
    id: 'demo-5',
    question_text: 'What was the nickname of the Seahawks legendary defense?',
    image_url: null,
    option_a: 'Steel Curtain',
    option_b: 'Legion of Boom',
    option_c: 'Purple People Eaters',
    option_d: 'Monsters of the Midway',
    hint_text: 'It references their big hits',
    time_limit_seconds: 15,
    points: 100,
    difficulty: 'easy',
    category: 'Seahawks History',
  },
]

function stripCorrectAnswer(question: {
  id: string
  question_text: string
  image_url: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  hint_text: string | null
  time_limit_seconds: number
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string | null
}): TriviaQuestionPublic {
  return {
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
    category: question.category,
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get username from header or query param
    const username = request.headers.get('x-username') ||
                     request.nextUrl.searchParams.get('username')

    const supabase = getSupabase()

    // Demo mode
    if (!supabase) {
      const response: DailyTriviaResponse = {
        day_identifier: 'demo',
        questions: DEMO_QUESTIONS,
        already_answered_ids: [],
        settings: {
          questions_per_day: 5,
          timer_duration: 15,
        },
      }
      return NextResponse.json(response)
    }

    // Get game settings
    const { data: settings } = await supabase
      .from('game_settings')
      .select('*')
      .eq('id', 1)
      .single()

    const gameSettings: GameSettings = settings || {
      id: 1,
      game_day_mode: false,
      questions_per_day: 5,
      timer_duration: 15,
      scores_locked: false,
      current_day: 'day_minus_4',
      live_question_index: 0,
      is_paused: false,
      updated_at: new Date().toISOString(),
    }

    // Get questions user has already answered today
    let alreadyAnsweredIds: string[] = []
    if (username) {
      const today = new Date().toISOString().split('T')[0]
      const { data: answers } = await supabase
        .from('daily_answers')
        .select('question_id')
        .eq('username', username)
        .gte('answered_at', `${today}T00:00:00`)
        .lt('answered_at', `${today}T23:59:59`)

      alreadyAnsweredIds = answers?.map(a => a.question_id) || []
    }

    // Get active questions (limit to questions_per_day)
    const { data: questions, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('is_active', true)
      .limit(gameSettings.questions_per_day)

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        { error: 'Failed to load questions' },
        { status: 500 }
      )
    }

    // If no questions in DB, return demo questions
    if (!questions || questions.length === 0) {
      const response: DailyTriviaResponse = {
        day_identifier: gameSettings.current_day,
        questions: DEMO_QUESTIONS.slice(0, gameSettings.questions_per_day),
        already_answered_ids: [],
        settings: {
          questions_per_day: gameSettings.questions_per_day,
          timer_duration: gameSettings.timer_duration,
        },
      }
      return NextResponse.json(response)
    }

    const response: DailyTriviaResponse = {
      day_identifier: gameSettings.current_day,
      questions: questions.map(stripCorrectAnswer),
      already_answered_ids: alreadyAnsweredIds,
      settings: {
        questions_per_day: gameSettings.questions_per_day,
        timer_duration: gameSettings.timer_duration,
      },
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
