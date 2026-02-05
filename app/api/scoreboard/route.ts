import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { LeaderboardEntry, AvatarId } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Demo leaderboard data
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'Legion of Boom', avatar: 'hawk', total_points: 2450, current_streak: 5, days_played: 4 },
  { rank: 2, username: '12th Man Army', avatar: '12th_man', total_points: 2100, current_streak: 3, days_played: 4 },
  { rank: 3, username: 'Beast Mode', avatar: 'champion', total_points: 1850, current_streak: 2, days_played: 3 },
  { rank: 4, username: 'Sea Hawks Rising', avatar: 'fire', total_points: 1600, current_streak: 4, days_played: 3 },
  { rank: 5, username: 'Blue Thunder', avatar: 'sparkle', total_points: 1400, current_streak: 1, days_played: 2 },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const supabase = getSupabase()

    // Demo mode
    if (!supabase) {
      return NextResponse.json({
        leaderboard: DEMO_LEADERBOARD,
        total: DEMO_LEADERBOARD.length,
      })
    }

    // Query users directly - skip RPC to ensure we get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, avatar, total_points, current_streak, days_played')
      .order('total_points', { ascending: false })
      .limit(limit)

    console.log('[v0] Users query result:', { users, usersError })

    if (usersError) {
      console.error('[v0] Users query error:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    const entries: LeaderboardEntry[] = (users || []).map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar as AvatarId,
      total_points: user.total_points,
      current_streak: user.current_streak,
      days_played: user.days_played,
    }))

    console.log('[v0] Leaderboard entries:', entries)

    return NextResponse.json({
      leaderboard: entries,
      total: entries.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })

  } catch (error) {
    console.error('Scoreboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
