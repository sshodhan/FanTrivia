import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logServer, logServerError } from '@/lib/error-tracking/server-logger'

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
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  logServer({
    level: 'info',
    component: 'user-api',
    event: 'get_user_request',
    data: { username }
  })

  const supabase = getSupabase()

  if (!supabase) {
    logServer({
      level: 'warn',
      component: 'user-api',
      event: 'supabase_not_configured',
      data: {}
    })
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      logServerError('user-api', 'get_user_failed', error, { username })
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    logServer({
      level: 'info',
      component: 'user-api',
      event: 'user_fetched',
      data: { username, is_admin: user.is_admin }
    })

    return NextResponse.json({ user })
  } catch (error) {
    logServerError('user-api', 'unexpected_error', error, { username })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
