import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAccess, getUsernameFromRequest } from '@/lib/admin-auth'
import { createSupabaseAdminClient, checkDemoMode, invalidateDemoModeCache } from '@/lib/supabase'
import { logServer } from '@/lib/error-tracking/server-logger'
import type { GameSettings, GameMode } from '@/lib/database.types'
import { sampleQuestions } from '@/lib/mock-data'

// Demo mode game settings
let demoGameSettings: GameSettings = {
  id: 1,
  current_mode: 'daily',
  questions_per_day: 5,
  timer_duration: 15,
  scores_locked: false,
  current_day: 'day_minus_4',
  live_question_index: 0,
  is_paused: false,
  demo_mode: true,
  updated_at: new Date().toISOString()
}

// GET - Get current game settings
export async function GET(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    if (await checkDemoMode()) {
      return NextResponse.json({ game_settings: demoGameSettings })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { data: gameSettings, error } = await supabase
      .from('game_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Game settings fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch game settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ game_settings: gameSettings })

  } catch (error) {
    console.error('Game settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update game settings
export async function PATCH(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    const body = await request.json()
    const { current_mode, current_day, live_question_index, is_paused, scores_locked, questions_per_day, timer_duration, demo_mode } = body

    // If toggling demo_mode, we always need the real DB (not the demo fallback)
    if (demo_mode !== undefined) {
      const supabase = createSupabaseAdminClient()
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database not available' },
          { status: 503 }
        )
      }

      const updates: Record<string, unknown> = {
        demo_mode,
        updated_at: new Date().toISOString()
      }

      const { data: gameSettings, error } = await supabase
        .from('game_settings')
        .update(updates)
        .eq('id', 1)
        .select()
        .single()

      if (error) {
        console.error('Demo mode update error:', error)
        return NextResponse.json(
          { error: 'Failed to update demo mode' },
          { status: 500 }
        )
      }

      // Invalidate the cached demo mode value
      invalidateDemoModeCache()

      // Log admin action
      const adminUser = getUsernameFromRequest(request)
      logServer({
        level: 'info',
        component: 'admin',
        event: 'demo_mode_toggle',
        data: { admin: adminUser, demo_mode }
      })

      await supabase
        .from('admin_action_logs')
        .insert({
          action_type: 'demo_mode_toggle',
          target_type: 'game_settings',
          target_id: null,
          details: { demo_mode }
        })

      return NextResponse.json({ game_settings: gameSettings })
    }

    if (await checkDemoMode()) {
      // Update demo settings
      if (current_mode !== undefined) demoGameSettings.current_mode = current_mode as GameMode
      if (current_day !== undefined) demoGameSettings.current_day = current_day
      if (live_question_index !== undefined) demoGameSettings.live_question_index = live_question_index
      if (is_paused !== undefined) demoGameSettings.is_paused = is_paused
      if (scores_locked !== undefined) demoGameSettings.scores_locked = scores_locked
      if (questions_per_day !== undefined) demoGameSettings.questions_per_day = questions_per_day
      if (timer_duration !== undefined) demoGameSettings.timer_duration = timer_duration
      demoGameSettings.updated_at = new Date().toISOString()

      return NextResponse.json({ game_settings: demoGameSettings })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (current_mode !== undefined) updates.current_mode = current_mode
    if (current_day !== undefined) updates.current_day = current_day
    if (live_question_index !== undefined) updates.live_question_index = live_question_index
    if (is_paused !== undefined) updates.is_paused = is_paused
    if (scores_locked !== undefined) updates.scores_locked = scores_locked
    if (questions_per_day !== undefined) updates.questions_per_day = questions_per_day
    if (timer_duration !== undefined) updates.timer_duration = timer_duration

    const { data: gameSettings, error } = await supabase
      .from('game_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Game settings update error:', error)
      return NextResponse.json(
        { error: 'Failed to update game settings' },
        { status: 500 }
      )
    }

    // Log admin action
    const adminUser = getUsernameFromRequest(request)
    logServer({
      level: 'info',
      component: 'admin',
      event: 'game_settings_update',
      data: { admin: adminUser, changes: updates }
    })

    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'game_settings_update',
        target_type: 'game_settings',
        target_id: null,
        details: updates
      })

    return NextResponse.json({ game_settings: gameSettings })

  } catch (error) {
    console.error('Game settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
