import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAccess'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

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
