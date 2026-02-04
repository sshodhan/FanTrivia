import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Player } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Demo players data (Super Bowl XLVIII heroes)
const DEMO_PLAYERS: Player[] = [
  {
    id: 'demo-1',
    name: 'Russell Wilson',
    jersey_number: 3,
    position: 'Quarterback',
    image_url: null,
    stats: { passing_yards: 206, touchdowns: 2, passer_rating: 123.1 },
    bio: 'Led the Seahawks to their first Super Bowl victory',
    super_bowl_highlight: 'Led the Seahawks to a 43-8 victory in Super Bowl XLVIII',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'demo-2',
    name: 'Marshawn Lynch',
    jersey_number: 24,
    position: 'Running Back',
    image_url: null,
    stats: { rushing_yards: 39, touchdowns: 1, carries: 15 },
    bio: 'Beast Mode - known for his powerful running style',
    super_bowl_highlight: 'Beast Mode touchdown run in Super Bowl XLVIII',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'demo-3',
    name: 'Richard Sherman',
    jersey_number: 25,
    position: 'Cornerback',
    image_url: null,
    stats: { interceptions: 8, passes_defended: 16 },
    bio: 'All-Pro cornerback and leader of the Legion of Boom',
    super_bowl_highlight: 'Key interception sealing NFC Championship',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'demo-4',
    name: 'Malcolm Smith',
    jersey_number: 53,
    position: 'Linebacker',
    image_url: null,
    stats: { tackles: 10, interceptions: 1, forced_fumbles: 1 },
    bio: 'Super Bowl XLVIII MVP',
    super_bowl_highlight: 'Super Bowl XLVIII MVP with pick-six',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'demo-5',
    name: 'Earl Thomas',
    jersey_number: 29,
    position: 'Safety',
    image_url: null,
    stats: { interceptions: 5, tackles: 105 },
    bio: 'Legion of Boom leader and ball hawk',
    super_bowl_highlight: 'Legion of Boom leader, 2 interceptions in playoffs',
    display_order: 5,
    is_active: true,
  },
  {
    id: 'demo-6',
    name: 'Kam Chancellor',
    jersey_number: 31,
    position: 'Safety',
    image_url: null,
    stats: { tackles: 99, forced_fumbles: 3 },
    bio: 'Enforcer of the Legion of Boom secondary',
    super_bowl_highlight: 'Devastating hits and forced fumbles',
    display_order: 6,
    is_active: true,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position')

    const supabase = getSupabase()

    // Demo mode
    if (!supabase) {
      let players = [...DEMO_PLAYERS]

      if (position && position !== 'all') {
        players = players.filter(p =>
          p.position.toLowerCase().includes(position.toLowerCase())
        )
      }

      return NextResponse.json({
        players,
        total: players.length,
      })
    }

    // Build query
    let query = supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (position && position !== 'all') {
      query = query.ilike('position', `%${position}%`)
    }

    const { data: players, error } = await query

    if (error) {
      console.error('Players fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      players: players || [],
      total: players?.length || 0,
    })

  } catch (error) {
    console.error('Players error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
