import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAccess, getUsernameFromRequest } from '@/lib/admin-auth'
import { createSupabaseAdminClient, checkDemoMode } from '@/lib/supabase'
import { logServer } from '@/lib/error-tracking/server-logger'

export async function POST(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    if (await checkDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - game ended',
        game_settings: {
          current_mode: 'ended',
          scores_locked: true
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

    // Update game settings to ended and lock scores
    const { data: gameSettings, error } = await supabase
      .from('game_settings')
      .update({
        current_mode: 'ended',
        is_paused: false,
        scores_locked: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Game end error:', error)
      return NextResponse.json(
        { error: 'Failed to end game' },
        { status: 500 }
      )
    }

    // Log admin action
    const adminUser = getUsernameFromRequest(request)
    logServer({
      level: 'info',
      component: 'admin',
      event: 'game_end',
      data: { admin: adminUser }
    })

    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'game_end',
        target_type: 'game_settings',
        details: { ended_at: new Date().toISOString() }
      })

    // TODO: Emit WebSocket event with final results

    return NextResponse.json({
      success: true,
      game_settings: gameSettings
    })

  } catch (error) {
    console.error('Game end error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
