import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkDemoMode } from '@/lib/supabase'
import type { LeaderboardEntry, AvatarId } from '@/lib/database.types'
import { logServer, logServerError } from '@/lib/error-tracking/server-logger'

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

    // Check if demo mode is enabled via admin setting
    if (await checkDemoMode()) {
      return NextResponse.json({
        leaderboard: DEMO_LEADERBOARD,
        total: DEMO_LEADERBOARD.length,
      })
    }

    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Query users directly - skip RPC to ensure we get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, avatar, total_points, current_streak, days_played')
      .order('total_points', { ascending: false })
      .limit(limit)

    if (usersError) {
      logServerError('scoreboard', 'users_query_failed', usersError, { limit })
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Soft error: no users returned when we expected data
    if (!users || users.length === 0) {
      logServer({
        level: 'warn',
        component: 'scoreboard',
        event: 'no_users_returned',
        data: { 
          limit,
          usersNull: users === null,
          usersUndefined: users === undefined,
          usersEmpty: Array.isArray(users) && users.length === 0
        }
      })
    }

    const entries: LeaderboardEntry[] = (users || []).map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar as AvatarId,
      total_points: user.total_points,
      current_streak: user.current_streak,
      days_played: user.days_played,
    }))

    logServer({
      level: 'info',
      component: 'scoreboard',
      event: 'leaderboard_fetched',
      data: { entriesCount: entries.length, limit }
    })

    return NextResponse.json({
      leaderboard: entries,
      total: entries.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })

  } catch (error) {
    logServerError('scoreboard', 'unexpected_error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
