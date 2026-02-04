import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import type { GameState, GameMode } from '@/lib/database.types'

// Demo mode game state
let demoGameState: GameState = {
  id: 1,
  current_mode: 'daily',
  current_day: 'day_minus_4',
  live_question_index: 0,
  is_paused: false,
  leaderboard_locked: false,
  updated_at: new Date().toISOString()
}

// GET - Get current game state
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    if (isDemoMode()) {
      return NextResponse.json({ game_state: demoGameState })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { data: gameState, error } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Game state fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch game state' },
        { status: 500 }
      )
    }

    return NextResponse.json({ game_state: gameState })

  } catch (error) {
    console.error('Game state error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update game state
export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    const body = await request.json()
    const { current_mode, current_day, live_question_index, is_paused, leaderboard_locked } = body

    if (isDemoMode()) {
      // Update demo state
      if (current_mode !== undefined) demoGameState.current_mode = current_mode as GameMode
      if (current_day !== undefined) demoGameState.current_day = current_day
      if (live_question_index !== undefined) demoGameState.live_question_index = live_question_index
      if (is_paused !== undefined) demoGameState.is_paused = is_paused
      if (leaderboard_locked !== undefined) demoGameState.leaderboard_locked = leaderboard_locked
      demoGameState.updated_at = new Date().toISOString()

      return NextResponse.json({ game_state: demoGameState })
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
    if (leaderboard_locked !== undefined) updates.leaderboard_locked = leaderboard_locked

    const { data: gameState, error } = await supabase
      .from('game_state')
      .update(updates)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Game state update error:', error)
      return NextResponse.json(
        { error: 'Failed to update game state' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'game_state_update',
        target_type: 'game_state',
        target_id: null,
        details: updates
      })

    return NextResponse.json({ game_state: gameState })

  } catch (error) {
    console.error('Game state update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
