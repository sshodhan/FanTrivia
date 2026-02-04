import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import { sampleScores } from '@/lib/mock-data'

interface TeamDetailedStats {
  team_id: string
  team_name: string
  team_image: string | null
  rank: number
  total_points: number
  percentile: number
  days_played: number
  best_streak: number
  accuracy: number
  total_questions: number
  correct_answers: number
  points_by_day: { day: string; points: number }[]
  nearby_teams: {
    rank: number
    team_name: string
    total_points: number
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Demo mode
    if (isDemoMode()) {
      const mockScore = sampleScores.find(s => s.teamId === teamId)
      const allScores = [...sampleScores].sort((a, b) => b.points - a.points)
      const rank = allScores.findIndex(s => s.teamId === teamId) + 1
      const percentile = Math.round(((allScores.length - rank) / allScores.length) * 100)

      // Get nearby teams
      const nearbyTeams = allScores
        .slice(Math.max(0, rank - 3), rank + 2)
        .map((s, i) => ({
          rank: Math.max(1, rank - 2) + i,
          team_name: s.teamName,
          total_points: s.points
        }))

      const stats: TeamDetailedStats = {
        team_id: teamId,
        team_name: mockScore?.teamName || 'Unknown Team',
        team_image: mockScore?.teamImage || null,
        rank: rank || 999,
        total_points: mockScore?.points || 0,
        percentile: percentile || 0,
        days_played: 4,
        best_streak: mockScore?.streak || 0,
        accuracy: mockScore ? Math.round((mockScore.correctAnswers / mockScore.totalAnswers) * 100) : 0,
        total_questions: mockScore?.totalAnswers || 0,
        correct_answers: mockScore?.correctAnswers || 0,
        points_by_day: [
          { day: 'day_minus_4', points: Math.round((mockScore?.points || 0) * 0.25) },
          { day: 'day_minus_3', points: Math.round((mockScore?.points || 0) * 0.25) },
          { day: 'day_minus_2', points: Math.round((mockScore?.points || 0) * 0.25) },
          { day: 'day_minus_1', points: Math.round((mockScore?.points || 0) * 0.25) }
        ],
        nearby_teams: nearbyTeams
      }

      return NextResponse.json(stats)
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get team info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Get all scores for this team
    const { data: teamScores, error: scoresError } = await supabase
      .from('scores')
      .select('*')
      .eq('team_id', teamId)

    if (scoresError) {
      console.error('Scores fetch error:', scoresError)
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      )
    }

    // Calculate team stats
    const totalPoints = teamScores?.reduce((sum, s) => sum + s.points_earned + s.streak_bonus, 0) || 0
    const totalQuestions = teamScores?.length || 0
    const correctAnswers = teamScores?.filter(s => s.is_correct).length || 0
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    // Calculate points by day
    const pointsByDay = new Map<string, number>()
    for (const score of teamScores || []) {
      if (score.day_identifier) {
        const current = pointsByDay.get(score.day_identifier) || 0
        pointsByDay.set(score.day_identifier, current + score.points_earned + score.streak_bonus)
      }
    }

    // Get leaderboard for ranking
    const { data: allScoresAggregated } = await supabase
      .from('scores')
      .select('team_id, points_earned, streak_bonus')

    // Aggregate all teams' scores
    const teamTotals = new Map<string, number>()
    for (const score of allScoresAggregated || []) {
      const current = teamTotals.get(score.team_id) || 0
      teamTotals.set(score.team_id, current + score.points_earned + score.streak_bonus)
    }

    // Sort teams by points to get ranking
    const sortedTeams = [...teamTotals.entries()]
      .sort((a, b) => b[1] - a[1])

    const rank = sortedTeams.findIndex(([id]) => id === teamId) + 1
    const totalTeams = sortedTeams.length
    const percentile = totalTeams > 1
      ? Math.round(((totalTeams - rank) / (totalTeams - 1)) * 100)
      : 100

    // Get nearby teams
    const nearbyIndices = []
    for (let i = Math.max(0, rank - 3); i < Math.min(sortedTeams.length, rank + 2); i++) {
      nearbyIndices.push(i)
    }

    const nearbyTeamIds = nearbyIndices.map(i => sortedTeams[i]?.[0]).filter(Boolean)

    const { data: nearbyTeamsData } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', nearbyTeamIds)

    const nearbyTeams = nearbyIndices.map(i => {
      const [teamIdItem, points] = sortedTeams[i] || []
      const teamData = nearbyTeamsData?.find(t => t.id === teamIdItem)
      return {
        rank: i + 1,
        team_name: teamData?.name || 'Unknown',
        total_points: points || 0
      }
    })

    // Calculate best streak
    let bestStreak = 0
    let currentStreak = 0
    const sortedScores = [...(teamScores || [])].sort(
      (a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime()
    )
    for (const score of sortedScores) {
      if (score.is_correct) {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    const stats: TeamDetailedStats = {
      team_id: team.id,
      team_name: team.name,
      team_image: team.image_url,
      rank,
      total_points: totalPoints,
      percentile,
      days_played: pointsByDay.size,
      best_streak: bestStreak,
      accuracy,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      points_by_day: [...pointsByDay.entries()].map(([day, points]) => ({
        day,
        points
      })),
      nearby_teams: nearbyTeams
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Team stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
