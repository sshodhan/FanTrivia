import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAccess } from '@/lib/admin-auth'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { samplePlayers } from '@/lib/mock-data'
import { v4 as uuidv4 } from 'uuid'
import type { Player } from '@/lib/database.types'

// GET - List all players with optional filtering
export async function GET(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') // sb48, 2025-hawks, 2025-pats, hof
    const position = searchParams.get('position')
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (isDemoMode()) {
      // Transform demo data to match Player type
      let players = samplePlayers.map(p => ({
        id: p.id,
        name: p.name,
        jersey_number: p.jersey_number,
        position: p.position,
        image_url: p.image_url,
        image_validated: (p as any).image_validated ?? false, // Default to false for demo data
        // Normalize stats - some demo data has array format, convert to Record
        stats: Array.isArray(p.stats)
          ? p.stats.reduce((acc, s) => ({ ...acc, [s.label]: s.value }), {} as Record<string, string | number>)
          : (p.stats as Record<string, string | number> | null),
        trivia: Array.isArray(p.trivia) ? p.trivia : null,
        bio: p.bio || null,
        super_bowl_highlight: p.super_bowl_highlight || null,
        display_order: p.display_order,
        is_active: p.is_active,
      })) as Player[]

      // Filter by category based on display_order ranges
      if (category) {
        switch (category) {
          case '2025-hawks':
            players = players.filter(p => p.display_order >= 1 && p.display_order < 100)
            break
          case '2025-pats':
            players = players.filter(p => p.display_order >= 100 && p.display_order < 200)
            break
          case 'sb48':
            players = players.filter(p => p.display_order >= 200 && p.display_order < 300)
            break
          case 'hof':
            players = players.filter(p => p.display_order >= 300 && p.display_order < 400)
            break
        }
      }

      if (position) {
        players = players.filter(p => p.position.toLowerCase() === position.toLowerCase())
      }

      if (isActive !== null && isActive !== undefined && isActive !== '') {
        const activeFilter = isActive === 'true'
        players = players.filter(p => p.is_active === activeFilter)
      }

      if (search) {
        const searchLower = search.toLowerCase()
        players = players.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.jersey_number.toString().includes(searchLower)
        )
      }

      // Sort by display_order
      players.sort((a, b) => a.display_order - b.display_order)

      return NextResponse.json({
        players: players.slice(offset, offset + limit),
        total_count: players.length,
        has_more: offset + limit < players.length
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build query
    let query = supabase
      .from('players')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1)

    // Filter by category using display_order ranges
    if (category) {
      switch (category) {
        case '2025-hawks':
          query = query.gte('display_order', 1).lt('display_order', 100)
          break
        case '2025-pats':
          query = query.gte('display_order', 100).lt('display_order', 200)
          break
        case 'sb48':
          query = query.gte('display_order', 200).lt('display_order', 300)
          break
        case 'hof':
          query = query.gte('display_order', 300).lt('display_order', 400)
          break
      }
    }

    if (position) {
      query = query.eq('position', position)
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,jersey_number.eq.${parseInt(search) || -1}`)
    }

    const { data: players, error, count } = await query

    if (error) {
      console.error('Players fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      players,
      total_count: count || 0,
      has_more: offset + limit < (count || 0)
    })

  } catch (error) {
    console.error('Players error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new player
export async function POST(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    const body = await request.json()
    const {
      name,
      jersey_number,
      position,
      image_url,
      image_validated,
      stats,
      trivia,
      bio,
      super_bowl_highlight,
      display_order,
      is_active
    } = body

    // Validate required fields
    if (!name || jersey_number === undefined || !position) {
      return NextResponse.json(
        { error: 'Missing required fields: name, jersey_number, position' },
        { status: 400 }
      )
    }

    const playerData = {
      id: uuidv4(),
      name,
      jersey_number: parseInt(jersey_number),
      position,
      image_url: image_url || null,
      image_validated: image_validated ?? false,
      stats: stats || null,
      trivia: trivia || null,
      bio: bio || null,
      super_bowl_highlight: super_bowl_highlight || null,
      display_order: display_order || 0,
      is_active: is_active ?? true
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        player: playerData
      }, { status: 201 })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { data: player, error } = await supabase
      .from('players')
      .insert(playerData)
      .select()
      .single()

    if (error) {
      console.error('Player create error:', error)
      return NextResponse.json(
        { error: 'Failed to create player' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'player_create',
        target_type: 'player',
        target_id: player.id,
        details: { name: player.name, jersey_number: player.jersey_number }
      })

    return NextResponse.json({
      success: true,
      player
    }, { status: 201 })

  } catch (error) {
    console.error('Player create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update player
export async function PUT(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 400 }
      )
    }

    // Convert jersey_number to int if provided
    if (updates.jersey_number !== undefined) {
      updates.jersey_number = parseInt(updates.jersey_number)
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - player updated'
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const { data: player, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Player update error:', error)
      return NextResponse.json(
        { error: 'Failed to update player' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'player_update',
        target_type: 'player',
        target_id: id,
        details: { updated_fields: Object.keys(updates) }
      })

    return NextResponse.json({
      success: true,
      player
    })

  } catch (error) {
    console.error('Player update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete player
export async function DELETE(request: NextRequest) {
  try {
    const authError = await validateAdminAccess(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 400 }
      )
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - player deleted'
      })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // First get the player name for logging
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Player delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete player' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        action_type: 'player_delete',
        target_type: 'player',
        target_id: id,
        details: { name: existingPlayer?.name }
      })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Player delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
