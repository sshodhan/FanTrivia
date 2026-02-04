import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      )
    }

    // Demo mode
    if (isDemoMode()) {
      // In demo mode, return a mock validation
      if (sessionToken.startsWith('demo_ses_')) {
        return NextResponse.json({
          valid: true,
          team: null, // Client should use local storage in demo mode
          message: 'Demo mode - session accepted'
        })
      }
      return NextResponse.json(
        { valid: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Validate session token
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('session_token', sessionToken)
      .single()

    if (error || !team) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Update last active
    await supabase
      .from('teams')
      .update({ last_active: new Date().toISOString() })
      .eq('id', team.id)

    return NextResponse.json({
      valid: true,
      team
    })

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update team info (name, image)
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, image_url, is_preset_image } = body

    // Demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - changes not persisted'
      })
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get team by session token
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('id')
      .eq('session_token', sessionToken)
      .single()

    if (fetchError || !team) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {
      last_active: new Date().toISOString()
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 30) {
        return NextResponse.json(
          { error: 'Invalid team name' },
          { status: 400 }
        )
      }
      updates.name = name.trim()
    }

    if (image_url !== undefined) {
      updates.image_url = image_url
    }

    if (is_preset_image !== undefined) {
      updates.is_preset_image = is_preset_image
    }

    // Update team
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', team.id)
      .select()
      .single()

    if (updateError) {
      console.error('Team update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      team: updatedTeam
    })

  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
