import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAccess'
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
        message: 'Demo mode - game ended',
        game_state: {
          current_mode: 'ended',
          leaderboard_locked: true
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

    // Update game state to ended and lock leaderboard
    const { data: gameState, error } = await supabase
      .from('game_state')
      .update({
        current_mode: 'ended',
        is_paused: false,
        leaderboard_locked: true,
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
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'game_end',
        target_type: 'game_state',
        details: { ended_at: new Date().toISOString() }
      })

    // TODO: Emit WebSocket event with final results

    return NextResponse.json({
      success: true,
      game_state: gameState
    })

  } catch (error) {
    console.error('Game end error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
