import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAccess, getUsernameFromRequest } from '@/lib/admin-auth'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { logServer } from '@/lib/error-tracking/server-logger'

export async function POST(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    const body = await request.json().catch(() => ({}))
    const { paused } = body

    // Toggle pause state (or set explicitly if provided)
    const shouldPause = paused !== undefined ? paused : true

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: `Demo mode - game ${shouldPause ? 'paused' : 'resumed'}`,
        is_paused: shouldPause
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get current state if toggling
    if (paused === undefined) {
      const { data: currentSettings } = await supabase
        .from('game_settings')
        .select('is_paused')
        .eq('id', 1)
        .single()

      const newPausedState = !(currentSettings?.is_paused ?? false)

      const { data: gameSettings, error } = await supabase
        .from('game_settings')
        .update({
          is_paused: newPausedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to toggle pause' },
          { status: 500 }
        )
      }

      // Log admin action
      const adminUser = getUsernameFromRequest(request)
      logServer({
        level: 'info',
        component: 'admin',
        event: newPausedState ? 'game_pause' : 'game_resume',
        data: { admin: adminUser, is_paused: newPausedState }
      })

      await supabase
        .from('admin_action_logs')
        .insert({
          action_type: newPausedState ? 'game_pause' : 'game_resume',
          target_type: 'game_settings',
          details: {}
        })

      return NextResponse.json({
        success: true,
        game_settings: gameSettings
      })
    }

    // Set explicit pause state
    const { data: gameSettings, error } = await supabase
      .from('game_settings')
      .update({
        is_paused: shouldPause,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Pause error:', error)
      return NextResponse.json(
        { error: 'Failed to update pause state' },
        { status: 500 }
      )
    }

    // Log admin action
    const adminUser2 = getUsernameFromRequest(request)
    logServer({
      level: 'info',
      component: 'admin',
      event: shouldPause ? 'game_pause' : 'game_resume',
      data: { admin: adminUser2, is_paused: shouldPause }
    })

    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: shouldPause ? 'game_pause' : 'game_resume',
        target_type: 'game_settings',
        details: {}
      })

    // TODO: Emit WebSocket event

    return NextResponse.json({
      success: true,
      game_settings: gameSettings
    })

  } catch (error) {
    console.error('Pause error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
