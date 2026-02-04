import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAccess'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { sampleQuestions } from '@/lib/mock-data'
import { v4 as uuidv4 } from 'uuid'
import type { TriviaQuestionInsert } from '@/lib/database.types'

// GET - List all questions
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (isDemoMode()) {
      let questions = sampleQuestions.map(q => ({
        id: q.id,
        question_text: q.question,
        image_url: q.imageUrl,
        image_source: null,
        options: q.options,
        correct_answer_index: q.correctAnswer,
        hint_text: q.explanation || null,
        time_limit_seconds: 15,
        points: 100,
        difficulty: q.difficulty,
        category: q.category,
        created_at: new Date().toISOString()
      }))

      if (category) {
        questions = questions.filter(q => q.category === category)
      }
      if (difficulty) {
        questions = questions.filter(q => q.difficulty === difficulty)
      }

      return NextResponse.json({
        questions: questions.slice(offset, offset + limit),
        total_count: questions.length,
        has_more: offset + limit < questions.length
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build query
    let query = supabase
      .from('trivia_questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    const { data: questions, error, count } = await query

    if (error) {
      console.error('Questions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      questions,
      total_count: count || 0,
      has_more: offset + limit < (count || 0)
    })

  } catch (error) {
    console.error('Questions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new question
export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    const body = await request.json()
    const {
      question_text,
      image_url,
      image_source,
      options,
      correct_answer_index,
      hint_text,
      time_limit_seconds,
      points,
      difficulty,
      category
    } = body

    // Validate required fields
    if (!question_text || !options || correct_answer_index === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: question_text, options, correct_answer_index' },
        { status: 400 }
      )
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { error: 'Options must be an array of exactly 4 items' },
        { status: 400 }
      )
    }

    if (correct_answer_index < 0 || correct_answer_index > 3) {
      return NextResponse.json(
        { error: 'correct_answer_index must be 0-3' },
        { status: 400 }
      )
    }

    const questionData: TriviaQuestionInsert = {
      id: uuidv4(),
      question_text,
      image_url: image_url || null,
      image_source: image_source || null,
      options,
      correct_answer_index,
      hint_text: hint_text || null,
      time_limit_seconds: time_limit_seconds || 15,
      points: points || 100,
      difficulty: difficulty || 'medium',
      category: category || null
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        question: { ...questionData, created_at: new Date().toISOString() }
      }, { status: 201 })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { data: question, error } = await supabase
      .from('trivia_questions')
      .insert(questionData)
      .select()
      .single()

    if (error) {
      console.error('Question create error:', error)
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'question_create',
        target_type: 'trivia_question',
        target_id: question.id,
        details: { question_text: question.question_text.slice(0, 100) }
      })

    return NextResponse.json({
      success: true,
      question
    }, { status: 201 })

  } catch (error) {
    console.error('Question create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update question
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Question ID required' },
        { status: 400 }
      )
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - question updated'
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { data: question, error } = await supabase
      .from('trivia_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Question update error:', error)
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'question_update',
        target_type: 'trivia_question',
        target_id: id,
        details: { updated_fields: Object.keys(updates) }
      })

    return NextResponse.json({
      success: true,
      question
    })

  } catch (error) {
    console.error('Question update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete question
export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Question ID required' },
        { status: 400 }
      )
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - question deleted'
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { error } = await supabase
      .from('trivia_questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Question delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete question' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'question_delete',
        target_type: 'trivia_question',
        target_id: id,
        details: {}
      })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Question delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
