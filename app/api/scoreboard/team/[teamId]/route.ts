import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkDemoMode } from '@/lib/supabase'
import { sampleLeaderboard } from '@/lib/mock-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface UserDetailedStats {
  username: string
  avatar: string
  rank: number
  total_points: number
  percentile: number
  days_played: number
  current_streak: number
  accuracy: number
  total_questions: number
  correct_answers: number
  points_by_day: { day: string; points: number }[]
  nearby_users: {
    rank: number
    username: string
    total_points: number
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    // teamId is actually username in the new schema
    const { teamId: username } = await params

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if demo mode is enabled via admin setting
    if (await checkDemoMode()) {
      const mockUser = sampleLeaderboard.find(u => u.username === username)
      const sortedUsers = [...sampleLeaderboard].sort((a, b) => b.total_points - a.total_points)
      const rank = sortedUsers.findIndex(u => u.username === username) + 1
      const percentile = Math.round(((sortedUsers.length - rank) / sortedUsers.length) * 100)

      // Get nearby users
      const nearbyUsers = sortedUsers
        .slice(Math.max(0, rank - 3), rank + 2)
        .map((u, i) => ({
          rank: Math.max(1, rank - 2) + i,
          username: u.username,
          total_points: u.total_points
        }))

      const stats: UserDetailedStats = {
        username: mockUser?.username || username,
        avatar: mockUser?.avatar || 'hawk',
        rank: rank || 999,
        total_points: mockUser?.total_points || 0,
        percentile: percentile || 0,
        days_played: mockUser?.days_played || 0,
        current_streak: mockUser?.current_streak || 0,
        accuracy: 80, // Demo value
        total_questions: 20,
        correct_answers: 16,
        points_by_day: [
          { day: 'day_1', points: Math.round((mockUser?.total_points || 0) * 0.25) },
          { day: 'day_2', points: Math.round((mockUser?.total_points || 0) * 0.25) },
          { day: 'day_3', points: Math.round((mockUser?.total_points || 0) * 0.25) },
          { day: 'day_4', points: Math.round((mockUser?.total_points || 0) * 0.25) }
        ],
        nearby_users: nearbyUsers
      }

      return NextResponse.json(stats)
    }

    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all answers for this user
    const { data: userAnswers, error: answersError } = await supabase
      .from('daily_answers')
      .select('*')
      .eq('username', username)

    if (answersError) {
      console.error('Answers fetch error:', answersError)
    }

    // Calculate user stats from answers
    const totalQuestions = userAnswers?.length || 0
    const correctAnswers = userAnswers?.filter(a => a.is_correct).length || 0
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    // Calculate points by day
    const pointsByDay = new Map<string, number>()
    for (const answer of userAnswers || []) {
      if (answer.day_identifier) {
        const current = pointsByDay.get(answer.day_identifier) || 0
        pointsByDay.set(answer.day_identifier, current + answer.points_earned + answer.streak_bonus)
      }
    }

    // Get leaderboard for ranking
    const { data: allUsers } = await supabase
      .from('users')
      .select('username, total_points')
      .gt('total_points', 0)
      .order('total_points', { ascending: false })

    const sortedUsers = allUsers || []
    const rank = sortedUsers.findIndex(u => u.username === username) + 1
    const totalUsers = sortedUsers.length
    const percentile = totalUsers > 1
      ? Math.round(((totalUsers - rank) / (totalUsers - 1)) * 100)
      : 100

    // Get nearby users
    const nearbyUsers = sortedUsers
      .slice(Math.max(0, rank - 3), rank + 2)
      .map((u, i) => ({
        rank: Math.max(1, rank - 2) + i,
        username: u.username,
        total_points: u.total_points
      }))

    const stats: UserDetailedStats = {
      username: user.username,
      avatar: user.avatar,
      rank: rank || 999,
      total_points: user.total_points,
      percentile,
      days_played: user.days_played,
      current_streak: user.current_streak,
      accuracy,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      points_by_day: [...pointsByDay.entries()].map(([day, points]) => ({
        day,
        points
      })),
      nearby_users: nearbyUsers
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
