import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAccess, getUsernameFromRequest } from '@/lib/admin-auth'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { logServer } from '@/lib/error-tracking/server-logger'

export async function POST(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - game started',
        game_settings: {
          current_mode: 'live',
          live_question_index: 0,
          is_paused: false
        }
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Update game settings to live mode
    const { data: gameSettings, error } = await supabase
      .from('game_settings')
      .update({
        current_mode: 'live',
        live_question_index: 0,
        is_paused: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Game start error:', error)
      return NextResponse.json(
        { error: 'Failed to start game' },
        { status: 500 }
      )
    }

    // Log admin action
    const adminUser = getUsernameFromRequest(request)
    logServer({
      level: 'info',
      component: 'admin',
      event: 'game_start',
      data: { admin: adminUser }
    })

    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'game_start',
        target_type: 'game_settings',
        details: { started_at: new Date().toISOString() }
      })

    // TODO: Emit WebSocket event to all connected clients
    // This would be done through Socket.io server

    return NextResponse.json({
      success: true,
      game_settings: gameSettings
    })

  } catch (error) {
    console.error('Game start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
