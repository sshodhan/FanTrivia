import { NextRequest, NextResponse } from 'next/server'
import { getPlayerSeasonStats } from '@/lib/player-stats'
import { StatsRequestError } from '@/lib/player-stats/service'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest, context: { params: Promise<{ playerId: string }> }) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  try {
    const { playerId } = await context.params
    const result = await getPlayerSeasonStats(playerId, request.nextUrl.searchParams)
    return NextResponse.json(result, { headers })
  } catch (error) {
    if (error instanceof StatsRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers })
    }
    return NextResponse.json(
      { error: 'Season statistics are temporarily unavailable. Please try again.' },
      { status: 503, headers: { ...headers, 'Retry-After': '30' } },
    )
  }
}
