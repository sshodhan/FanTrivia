import 'server-only'
import { z } from 'zod'
import { ESPN_PLAYER_IDS } from './espn-player-ids'
import { normalizeEspnStats } from './espn-normalize'
import { StatsProviderError, type PlayerStatsProvider, type ProviderSeasonStats, type SeasonStatsRequest } from '../types'

const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl'
const SEASON_TYPES = { regular: 2, postseason: 3 } as const
const reference = z.object({ $ref: z.string().url() })
const totalsSchema = z.object({
  season: reference,
  seasonType: reference,
  athlete: reference,
  splits: z.object({
    type: z.literal('total'),
    categories: z.array(z.object({
      name: z.string(),
      stats: z.array(z.object({
        name: z.string(),
        value: z.number().finite().nullable().optional(),
        displayValue: z.string().max(100).nullable().optional(),
      })),
    })),
  }),
})
const seasonsSchema = z.object({
  entries: z.array(z.object({ season: reference })),
})
const missingSchema = z.object({ error: z.object({ message: z.string() }) })

async function fetchEspn(url: string, allowMissingStats = false): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json' },
    })
    if (response.status === 404 && allowMissingStats) {
      const error = missingSchema.safeParse(await response.json())
      if (error.success && /no stat(?:s|istics)(?:\s|\.)/i.test(error.data.error.message)) return null
    }
    if (!response.ok) throw new StatsProviderError('unavailable')
    return await response.json()
  } catch (error) {
    if (error instanceof StatsProviderError) throw error
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new StatsProviderError('timeout')
    throw new StatsProviderError('invalid-response')
  }
}

function validateReference(ref: string, pathname: string) {
  const url = new URL(ref)
  if (url.hostname !== 'sports.core.api.espn.com' || url.pathname !== pathname) {
    throw new StatsProviderError('invalid-response')
  }
}

function baseResult(request: SeasonStatsRequest, athleteId?: string): ProviderSeasonStats {
  return {
    playerId: request.player.id,
    season: request.season,
    seasonType: request.seasonType,
    coverage: 'unmapped',
    groups: [],
    scope: 'all-teams',
    fetchedAt: new Date().toISOString(),
    source: {
      provider: 'espn', name: 'ESPN',
      url: athleteId ? `https://www.espn.com/nfl/player/stats/_/id/${athleteId}/type/nfl/seasontype/${SEASON_TYPES[request.seasonType]}` : null,
    },
  }
}

export const espnProvider: PlayerStatsProvider = {
  id: 'espn',
  name: 'ESPN',
  async getAvailableSeasons(player) {
    const id = ESPN_PLAYER_IDS[player.id]
    if (!id) return []
    // The common stats endpoint omits seasons with participation-only stats (e.g. linemen).
    // Read the complete availability log, but never follow its external reference URLs.
    const response = await fetchEspn(`${CORE}/athletes/${id}/statisticslog`, true)
    if (response === null) return []
    const parsed = seasonsSchema.safeParse(response)
    if (!parsed.success) throw new StatsProviderError('invalid-response')
    const years = parsed.data.entries.map(entry => {
      const url = new URL(entry.season.$ref)
      const match = url.pathname.match(/^\/v2\/sports\/football\/leagues\/nfl\/seasons\/(\d{4})$/)
      if (url.hostname !== 'sports.core.api.espn.com' || !match) throw new StatsProviderError('invalid-response')
      return Number(match[1])
    })
    return [...new Set(years)].sort((a, b) => b - a)
  },
  async getSeasonStats(request) {
    const id = ESPN_PLAYER_IDS[request.player.id]
    if (!id) return baseResult(request)
    const type = SEASON_TYPES[request.seasonType]
    const response = await fetchEspn(`${CORE}/seasons/${request.season}/types/${type}/athletes/${id}/statistics`, true)
    const base = baseResult(request, id)
    if (response === null) return { ...base, coverage: 'no-stats' }
    const parsed = totalsSchema.safeParse(response)
    if (!parsed.success) throw new StatsProviderError('invalid-response')
    const prefix = `/v2/sports/football/leagues/nfl/seasons/${request.season}`
    validateReference(parsed.data.season.$ref, prefix)
    validateReference(parsed.data.seasonType.$ref, `${prefix}/types/${type}`)
    validateReference(parsed.data.athlete.$ref, `${prefix}/athletes/${id}`)
    const groups = normalizeEspnStats(parsed.data.splits.categories, request.player.position)
    return {
      ...base,
      groups,
      coverage: groups.length ? 'available' : parsed.data.splits.categories.length ? 'unsupported' : 'no-stats',
      ...(groups.length === 1 && groups[0].key === 'general' ? {
        note: 'Only participation statistics are reported for this player and season. Position-specific performance metrics are not available.',
      } : {}),
    }
  },
}
