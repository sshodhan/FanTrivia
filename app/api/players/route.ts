import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import { samplePlayers } from '@/lib/mock-data'

// Position groups for sorting
const POSITION_ORDER = [
  'Quarterback',
  'Running Back',
  'Wide Receiver',
  'Tight End',
  'Offensive Line',
  'Defensive Line',
  'Linebacker',
  'Cornerback',
  'Safety',
  'Free Safety',
  'Strong Safety',
  'Special Teams'
]

function getPositionOrder(position: string | null): number {
  if (!position) return 999
  const index = POSITION_ORDER.findIndex(p =>
    position.toLowerCase().includes(p.toLowerCase())
  )
  return index === -1 ? 999 : index
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const positionFilter = searchParams.get('position')
    const search = searchParams.get('search')

    // Demo mode
    if (isDemoMode()) {
      let players = [...samplePlayers]

      // Apply position filter
      if (positionFilter && positionFilter !== 'all') {
        players = players.filter(p =>
          p.position.toLowerCase().includes(positionFilter.toLowerCase())
        )
      }

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        players = players.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.position.toLowerCase().includes(searchLower)
        )
      }

      // Sort by position group then by number
      players.sort((a, b) => {
        const posOrderA = getPositionOrder(a.position)
        const posOrderB = getPositionOrder(b.position)
        if (posOrderA !== posOrderB) return posOrderA - posOrderB
        return a.number - b.number
      })

      // Transform to API response format
      const response = players.map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        image_url: p.imageUrl,
        stats: p.stats,
        super_bowl_highlight: p.superBowlHighlight
      }))

      return NextResponse.json({
        players: response,
        total_count: response.length,
        positions: [...new Set(samplePlayers.map(p => p.position))]
      })
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build query
    let query = supabase
      .from('seahawks_players')
      .select('*')
      .eq('is_active', true)

    // Apply position filter
    if (positionFilter && positionFilter !== 'all') {
      query = query.ilike('position', `%${positionFilter}%`)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,position.ilike.%${search}%`)
    }

    const { data: players, error } = await query

    if (error) {
      console.error('Players fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      )
    }

    // Sort by position group then by number
    const sortedPlayers = [...(players || [])].sort((a, b) => {
      const posOrderA = getPositionOrder(a.position)
      const posOrderB = getPositionOrder(b.position)
      if (posOrderA !== posOrderB) return posOrderA - posOrderB
      return (a.number || 0) - (b.number || 0)
    })

    // Get unique positions for filter UI
    const { data: allPlayers } = await supabase
      .from('seahawks_players')
      .select('position')
      .eq('is_active', true)

    const positions = [...new Set(allPlayers?.map(p => p.position).filter(Boolean) || [])]

    return NextResponse.json({
      players: sortedPlayers,
      total_count: sortedPlayers.length,
      positions
    })

  } catch (error) {
    console.error('Players error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
