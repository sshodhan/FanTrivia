import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import { sampleScores } from '@/lib/mock-data'
import type { LeaderboardEntry } from '@/lib/database.types'

// Cache for leaderboard (30 second TTL)
let leaderboardCache: {
  data: LeaderboardEntry[]
  timestamp: number
} | null = null

const CACHE_TTL = 30 * 1000 // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const dayFilter = searchParams.get('day') // Optional: filter by specific day

    // Demo mode - return sample scores
    if (isDemoMode()) {
      const leaderboard: LeaderboardEntry[] = sampleScores
        .sort((a, b) => b.points - a.points)
        .map((score, index) => ({
          rank: index + 1,
          team_id: score.teamId,
          team_name: score.teamName,
          team_image: score.teamImage,
          total_points: score.points,
          days_played: 4,
          best_streak: score.streak
        }))
        .slice(offset, offset + limit)

      return NextResponse.json({
        leaderboard,
        total_count: sampleScores.length,
        has_more: offset + limit < sampleScores.length
      })
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check cache (only for full leaderboard without filters)
    const now = Date.now()
    if (!dayFilter && offset === 0 && leaderboardCache && now - leaderboardCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        leaderboard: leaderboardCache.data.slice(0, limit),
        total_count: leaderboardCache.data.length,
        has_more: limit < leaderboardCache.data.length,
        cached: true
      })
    }

    // Build query for aggregated scores
    let query = supabase
      .from('scores')
      .select('team_id, points_earned, streak_bonus, day_identifier')

    if (dayFilter) {
      query = query.eq('day_identifier', dayFilter)
    }

    const { data: scores, error: scoresError } = await query

    if (scoresError) {
      console.error('Scores fetch error:', scoresError)
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      )
    }

    // Get all teams that have scores
    const teamIds = [...new Set(scores?.map(s => s.team_id) || [])]

    if (teamIds.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        total_count: 0,
        has_more: false
      })
    }

    // Fetch team info
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, image_url')
      .in('id', teamIds)

    if (teamsError) {
      console.error('Teams fetch error:', teamsError)
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      )
    }

    // Aggregate scores by team
    const teamScores = new Map<string, {
      totalPoints: number
      daysPlayed: Set<string>
      bestStreak: number
    }>()

    for (const score of scores || []) {
      const existing = teamScores.get(score.team_id) || {
        totalPoints: 0,
        daysPlayed: new Set<string>(),
        bestStreak: 0
      }

      existing.totalPoints += score.points_earned + score.streak_bonus
      if (score.day_identifier) {
        existing.daysPlayed.add(score.day_identifier)
      }

      teamScores.set(score.team_id, existing)
    }

    // Build leaderboard
    const leaderboard: LeaderboardEntry[] = []

    for (const team of teams || []) {
      const stats = teamScores.get(team.id)
      if (!stats) continue

      leaderboard.push({
        rank: 0, // Will be set after sorting
        team_id: team.id,
        team_name: team.name,
        team_image: team.image_url,
        total_points: stats.totalPoints,
        days_played: stats.daysPlayed.size,
        best_streak: stats.bestStreak
      })
    }

    // Sort by total points descending
    leaderboard.sort((a, b) => b.total_points - a.total_points)

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1
    })

    // Update cache (for full leaderboard)
    if (!dayFilter && offset === 0) {
      leaderboardCache = {
        data: leaderboard,
        timestamp: now
      }
    }

    // Apply pagination
    const paginatedLeaderboard = leaderboard.slice(offset, offset + limit)

    return NextResponse.json({
      leaderboard: paginatedLeaderboard,
      total_count: leaderboard.length,
      has_more: offset + limit < leaderboard.length
    })

  } catch (error) {
    console.error('Scoreboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
