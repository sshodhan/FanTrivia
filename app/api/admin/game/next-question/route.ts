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
        message: 'Demo mode - advanced to next question',
        live_question_index: 1
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get current game settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from('game_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (fetchError || !currentSettings) {
      return NextResponse.json(
        { error: 'Failed to get current settings' },
        { status: 500 }
      )
    }

    if (currentSettings.current_mode !== 'live') {
      return NextResponse.json(
        { error: 'Game is not in live mode' },
        { status: 400 }
      )
    }

    // Increment question index
    const newIndex = currentSettings.live_question_index + 1

    const { data: gameSettings, error } = await supabase
      .from('game_settings')
      .update({
        live_question_index: newIndex,
        is_paused: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('Next question error:', error)
      return NextResponse.json(
        { error: 'Failed to advance question' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'next_question',
        target_type: 'game_settings',
        details: {
          previous_index: currentSettings.live_question_index,
          new_index: newIndex
        }
      })

    // TODO: Emit WebSocket event with new question

    return NextResponse.json({
      success: true,
      game_settings: gameSettings,
      question_index: newIndex
    })

  } catch (error) {
    console.error('Next question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
