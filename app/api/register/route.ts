import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AVATARS, type AvatarId, type User } from '@/lib/database.types'
import { logServer, logServerError } from '@/lib/error-tracking/server-logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    logServer({
      level: 'warn',
      component: 'register-api',
      event: 'supabase_not_configured',
      data: { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey }
    })
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  logServer({
    level: 'info',
    component: 'register-api',
    event: 'request_received',
    data: {}
  })
  
  try {
    const body = await request.json()
    const { username, avatar } = body as { username: string; avatar: AvatarId }
    
    logServer({
      level: 'info',
      component: 'register-api',
      event: 'request_parsed',
      data: { username, avatar }
    })

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const trimmedUsername = username.trim()
    if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 2 and 30 characters' },
        { status: 400 }
      )
    }

    // Validate avatar
    if (!avatar || !AVATARS[avatar]) {
      return NextResponse.json(
        { error: 'Invalid avatar selection' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    if (!supabase) {
      // Demo mode - return mock user
      logServer({
        level: 'info',
        component: 'register-api',
        event: 'demo_mode_user_created',
        data: { username: trimmedUsername, avatar }
      })
      const mockUser: User = {
        username: trimmedUsername,
        avatar,
        is_preset_image: true,
        image_url: null,
        total_points: 0,
        current_streak: 0,
        days_played: 0,
        created_at: new Date().toISOString(),
        last_played_at: null,
      }
      return NextResponse.json({ user: mockUser, isNew: true })
    }

    logServer({
      level: 'info',
      component: 'register-api',
      event: 'supabase_connected',
      data: { username: trimmedUsername }
    })

    // Check if username already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('*')
      .eq('username', trimmedUsername)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected for new users
      logServerError('register-api', 'user_lookup_failed', lookupError, { username: trimmedUsername })
    }

    if (existingUser) {
      logServer({
        level: 'info',
        component: 'register-api',
        event: 'existing_user_found',
        data: { username: trimmedUsername, userId: existingUser.username }
      })
      // Return existing user (login)
      return NextResponse.json({ user: existingUser, isNew: false })
    }

    logServer({
      level: 'info',
      component: 'register-api',
      event: 'creating_new_user',
      data: { username: trimmedUsername, avatar }
    })

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username: trimmedUsername,
        avatar,
        is_preset_image: true,
      })
      .select()
      .single()

    if (error) {
      logServerError('register-api', 'user_creation_failed', error, { 
        username: trimmedUsername, 
        avatar,
        errorCode: error.code 
      })
      if (error.code === '23505') {
        // Unique constraint violation - username taken
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    logServer({
      level: 'info',
      component: 'register-api',
      event: 'user_created_successfully',
      data: { username: newUser.username, avatar: newUser.avatar }
    })

    return NextResponse.json({ user: newUser, isNew: true }, { status: 201 })
  } catch (error) {
    logServerError('register-api', 'registration_error', error, {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Check if username exists
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const supabase = getSupabase()

  if (!supabase) {
    // Demo mode
    return NextResponse.json({ exists: false, user: null })
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.trim())
    .single()

  return NextResponse.json({
    exists: !!user,
    user: user || null,
  })
}
