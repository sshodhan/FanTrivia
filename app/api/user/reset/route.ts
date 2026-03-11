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
      logServer({
        level: 'warn',
        component: 'user-reset',
        event: 'invalid_request',
        data: { user_id: user_id ?? 'missing', type: typeof user_id }
      })
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    if (!supabase) {
      logServer({
        level: 'warn',
        component: 'user-reset',
        event: 'demo_mode_reset',
        data: {
          user_id,
          reason: 'no_supabase_client',
          has_url: !!supabaseUrl,
          has_key: !!supabaseServiceKey,
        }
      })
      return NextResponse.json({ success: true, mode: 'demo' })
    }

    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'reset_started',
      data: { user_id, step: '1_verify_user' }
    })

    // Step 1: Verify user exists
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
        data: {
          user_id,
          step: '1_verify_user',
          error_message: userError?.message || 'no data returned',
          error_code: userError?.code || null,
        }
      })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'user_verified',
      data: { user_id, username: user.username, step: '1_verify_user' }
    })

    // Track soft errors -- continue even if individual deletes fail
    const softErrors: Array<{ step: string; table: string; error: string }> = []

    // Step 2: Delete daily_answers (by username since that's what the table uses)
    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'delete_step_start',
      data: { user_id, username: user.username, step: '2_delete_answers', table: 'daily_answers' }
    })

    const { error: answersError, count: answersDeleted } = await supabase
      .from('daily_answers')
      .delete({ count: 'exact' })
      .eq('username', user.username)

    if (answersError) {
      softErrors.push({ step: '2_delete_answers', table: 'daily_answers', error: answersError.message })
      logServerError('user-reset', 'delete_answers_soft_error', answersError, {
        user_id,
        username: user.username,
        step: '2_delete_answers',
        severity: 'soft_error',
        note: 'Continuing with reset despite failure',
      })
    } else {
      logServer({
        level: 'info',
        component: 'user-reset',
        event: 'delete_step_complete',
        data: { user_id, step: '2_delete_answers', table: 'daily_answers', rows_deleted: answersDeleted ?? 0 }
      })
    }

    // Step 3: Delete photo_likes
    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'delete_step_start',
      data: { user_id, step: '3_delete_likes', table: 'photo_likes' }
    })

    const { error: likesError, count: likesDeleted } = await supabase
      .from('photo_likes')
      .delete({ count: 'exact' })
      .eq('username', user.username)

    if (likesError) {
      softErrors.push({ step: '3_delete_likes', table: 'photo_likes', error: likesError.message })
      logServerError('user-reset', 'delete_likes_soft_error', likesError, {
        user_id,
        step: '3_delete_likes',
        severity: 'soft_error',
        note: 'Continuing with reset despite failure',
      })
    } else {
      logServer({
        level: 'info',
        component: 'user-reset',
        event: 'delete_step_complete',
        data: { user_id, step: '3_delete_likes', table: 'photo_likes', rows_deleted: likesDeleted ?? 0 }
      })
    }

    // Step 4: Delete photo_uploads
    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'delete_step_start',
      data: { user_id, step: '4_delete_photos', table: 'photo_uploads' }
    })

    const { error: photosError, count: photosDeleted } = await supabase
      .from('photo_uploads')
      .delete({ count: 'exact' })
      .eq('username', user.username)

    if (photosError) {
      softErrors.push({ step: '4_delete_photos', table: 'photo_uploads', error: photosError.message })
      logServerError('user-reset', 'delete_photos_soft_error', photosError, {
        user_id,
        step: '4_delete_photos',
        severity: 'soft_error',
        note: 'Continuing with reset despite failure',
      })
    } else {
      logServer({
        level: 'info',
        component: 'user-reset',
        event: 'delete_step_complete',
        data: { user_id, step: '4_delete_photos', table: 'photo_uploads', rows_deleted: photosDeleted ?? 0 }
      })
    }

    // Step 5: Delete the user record itself (hard error if this fails)
    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'delete_step_start',
      data: { user_id, step: '5_delete_user', table: 'users' }
    })

    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', user_id)

    if (deleteUserError) {
      logServerError('user-reset', 'delete_user_hard_error', deleteUserError, {
        user_id,
        username: user.username,
        step: '5_delete_user',
        severity: 'hard_error',
        prior_soft_errors: softErrors,
        note: 'User record deletion failed -- reset incomplete',
      })
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    logServer({
      level: 'info',
      component: 'user-reset',
      event: 'delete_step_complete',
      data: { user_id, step: '5_delete_user', table: 'users', rows_deleted: 1 }
    })

    // Final summary log
    logServer({
      level: softErrors.length > 0 ? 'warn' : 'info',
      component: 'user-reset',
      event: 'reset_complete',
      data: {
        user_id,
        username: user.username,
        answers_deleted: answersDeleted ?? 0,
        likes_deleted: likesDeleted ?? 0,
        photos_deleted: photosDeleted ?? 0,
        user_deleted: 1,
        soft_errors_count: softErrors.length,
        soft_errors: softErrors.length > 0 ? softErrors : undefined,
        outcome: softErrors.length > 0 ? 'completed_with_soft_errors' : 'completed_clean',
      }
    })

    return NextResponse.json({
      success: true,
      deleted: {
        answers: answersDeleted ?? 0,
        likes: likesDeleted ?? 0,
        photos: photosDeleted ?? 0,
        user: 1,
      },
      soft_errors: softErrors.length > 0 ? softErrors : undefined,
    })
  } catch (error) {
    logServerError('user-reset', 'reset_unhandled_error', error, {
      severity: 'hard_error',
      note: 'Unhandled exception in reset flow',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
