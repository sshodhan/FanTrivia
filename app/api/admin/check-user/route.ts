import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Step 1: Get user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        user_id,
        found: false,
        message: 'User not found in database',
      })
    }

    // Step 2: Get all daily_answers (by username)
    const { data: answers, error: answersError } = await supabase
      .from('daily_answers')
      .select('*')
      .eq('username', user.username)
      .order('answered_at', { ascending: false })

    // Step 3: Get all photo_uploads
    const { data: photos, error: photosError } = await supabase
      .from('photo_uploads')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    // Step 4: Get all photo_likes
    const { data: likes, error: likesError } = await supabase
      .from('photo_likes')
      .select('*')
      .eq('user_id', user_id)

    return NextResponse.json({
      user_id,
      found: true,
      user,
      daily_answers: {
        count: answers?.length ?? 0,
        records: answers ?? [],
        error: answersError?.message ?? null,
      },
      photo_uploads: {
        count: photos?.length ?? 0,
        records: photos ?? [],
        error: photosError?.message ?? null,
      },
      photo_likes: {
        count: likes?.length ?? 0,
        records: likes ?? [],
        error: likesError?.message ?? null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
