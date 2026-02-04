import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - game started',
        game_state: {
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

    // Update game state to live
    const { data: gameState, error } = await supabase
      .from('game_state')
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
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'game_start',
        target_type: 'game_state',
        details: { started_at: new Date().toISOString() }
      })

    // TODO: Emit WebSocket event to all connected clients
    // This would be done through Socket.io server

    return NextResponse.json({
      success: true,
      game_state: gameState
    })

  } catch (error) {
    console.error('Game start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
