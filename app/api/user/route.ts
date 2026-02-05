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
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  const username = searchParams.get('username')

  if (!user_id && !username) {
    return NextResponse.json({ error: 'user_id or username is required' }, { status: 400 })
  }

  const supabase = getSupabase()

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    // Prefer user_id lookup, fall back to username
    const query = supabase.from('users').select('*')
    
    if (user_id) {
      query.eq('user_id', user_id)
    } else if (username) {
      query.eq('username', username)
    }

    const { data: user, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
