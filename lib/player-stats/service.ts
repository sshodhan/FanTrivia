import 'server-only'
import { z } from 'zod'
import { getCurrentRoster } from '../rosters-2026'
import { createStatsCache } from './cache'
import {
  FIRST_SUPPORTED_SEASON, ROSTER_SEASON, STATS_REFRESH_MS, StatsProviderError,
  type PlayerSeasonStatsResponse, type PlayerStatsProvider,
} from './types'

const players = new Map(
  [...getCurrentRoster('2026-hawks').players, ...getCurrentRoster('2026-pats').players]
    .map(player => [player.id, { id: player.id, name: player.name, position: player.position }]),
)

export class StatsRequestError extends Error {
  constructor(public readonly status: 400 | 404, message: string) {
    super(message)
  }
}

export function validateStatsRequest(playerId: string, query: URLSearchParams) {
  const schema = z.object({
    season: z.string().regex(/^\d{4}$/).transform(Number)
      .refine(year => year >= FIRST_SUPPORTED_SEASON && year <= Math.max(ROSTER_SEASON, new Date().getUTCFullYear())),
    seasonType: z.enum(['regular', 'postseason']),
  })
  if (query.getAll('season').length !== 1 || query.getAll('seasonType').length !== 1) {
    throw new StatsRequestError(400, 'Select one season year and regular or postseason statistics.')
  }
  const result = schema.safeParse(Object.fromEntries(query))
  if (!result.success) throw new StatsRequestError(400, 'Invalid season year or season type.')
  const player = players.get(playerId)
  if (!player) throw new StatsRequestError(404, 'Current-roster player not found.')
  return { player, ...result.data }
}

export function createPlayerStatsService(provider: PlayerStatsProvider, cached = createStatsCache()) {
  return async (playerId: string, query: URLSearchParams): Promise<PlayerSeasonStatsResponse> => {
    const request = validateStatsRequest(playerId, query)
    const key = `${provider.id}:${request.player.id}`
    const [seasons, stats] = await Promise.allSettled([
      cached(`${key}:seasons`, () => provider.getAvailableSeasons(request.player), () => 6 * 60 * 60 * 1000),
      cached(`${key}:${request.season}:${request.seasonType}`, async () => {
        const result = await provider.getSeasonStats(request)
        if (result.playerId !== playerId || result.season !== request.season ||
            result.seasonType !== request.seasonType || result.source.provider !== provider.id) {
          throw new StatsProviderError('invalid-response')
        }
        return result
      }, result => result.coverage === 'available' ? STATS_REFRESH_MS : 60_000),
    ])
    if (stats.status === 'rejected') throw stats.reason
    const maxSeason = Math.max(ROSTER_SEASON, new Date().getUTCFullYear())
    const availableSeasons = [...new Set([
      ROSTER_SEASON, request.season, ...(seasons.status === 'fulfilled' ? seasons.value : []),
    ])].filter(year => Number.isInteger(year) && year >= FIRST_SUPPORTED_SEASON && year <= maxSeason)
      .sort((a, b) => b - a)
    return {
      ...stats.value,
      availableSeasons,
      seasonOptionsUnavailable: seasons.status === 'rejected',
    }
  }
}
