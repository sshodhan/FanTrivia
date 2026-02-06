import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkDemoMode } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body as { user_id: string }

    // Validate user_id
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const trimmedUserId = user_id.trim()
    if (trimmedUserId.length < 5) {
      return NextResponse.json(
        { error: 'Invalid User ID format' },
        { status: 400 }
      )
    }

    if (await checkDemoMode()) {
      return NextResponse.json(
        { error: 'Sign in is not available in demo mode' },
        { status: 503 }
      )
    }

    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Look up user by user_id
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', trimmedUserId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User ID not found. Please check your ID and try again.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user, success: true })
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
