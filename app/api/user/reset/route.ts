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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body as { user_id: string }

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    if (!supabase) {
      logServer({
        level: 'info',
        component: 'user-reset',
        event: 'demo_mode_reset',
        data: { user_id }
      })
      return NextResponse.json({ success: true, mode: 'demo' })
    }

    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'reset_requested',
      data: { user_id }
    })

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, username')
      .eq('user_id', user_id)
      .single()

    if (userError || !user) {
      logServer({
        level: 'warn',
        component: 'user-reset',
        event: 'user_not_found',
        data: { user_id, error: userError?.message }
      })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete daily_answers for this user (by username since that's what the table uses)
    const { error: answersError, count: answersDeleted } = await supabase
      .from('daily_answers')
      .delete({ count: 'exact' })
      .eq('username', user.username)

    if (answersError) {
      logServerError('user-reset', 'delete_answers_failed', answersError, { user_id, username: user.username })
    }

    // Delete photo_likes by this user
    const { error: likesError, count: likesDeleted } = await supabase
      .from('photo_likes')
      .delete({ count: 'exact' })
      .eq('user_id', user_id)

    if (likesError) {
      logServerError('user-reset', 'delete_likes_failed', likesError, { user_id })
    }

    // Delete photo_uploads by this user
    const { error: photosError, count: photosDeleted } = await supabase
      .from('photo_uploads')
      .delete({ count: 'exact' })
      .eq('user_id', user_id)

    if (photosError) {
      logServerError('user-reset', 'delete_photos_failed', photosError, { user_id })
    }

    // Delete the user record itself
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', user_id)

    if (deleteUserError) {
      logServerError('user-reset', 'delete_user_failed', deleteUserError, { user_id })
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'reset_complete',
      data: {
        user_id,
        username: user.username,
        answers_deleted: answersDeleted ?? 0,
        likes_deleted: likesDeleted ?? 0,
        photos_deleted: photosDeleted ?? 0,
      }
    })

    return NextResponse.json({
      success: true,
      deleted: {
        answers: answersDeleted ?? 0,
        likes: likesDeleted ?? 0,
        photos: photosDeleted ?? 0,
        user: 1,
      }
    })
  } catch (error) {
    logServerError('user-reset', 'reset_error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
