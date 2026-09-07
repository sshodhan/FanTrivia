import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { createStatsCache } from '@/lib/player-stats/cache'
import { createPlayerStatsService, validateStatsRequest } from '@/lib/player-stats/service'
import { getCurrentRoster } from '@/lib/rosters-2026'
import { ESPN_PLAYER_IDS } from '@/lib/player-stats/providers/espn-player-ids'
import { STATS_REFRESH_MS, type PlayerStatsProvider, type ProviderSeasonStats, type SeasonStatsRequest } from '@/lib/player-stats/types'

const playerId = '2026-hawks-sam-darnold'
const query = (season = '2025', seasonType = 'regular') => new URLSearchParams({ season, seasonType })
function provider(id = 'fixture'): PlayerStatsProvider {
  return {
    id, name: id,
    getAvailableSeasons: vi.fn(async () => [2024, 2025, 2025]),
    getSeasonStats: vi.fn(async (request: SeasonStatsRequest): Promise<ProviderSeasonStats> => ({
      playerId: request.player.id, season: request.season, seasonType: request.seasonType,
      coverage: 'available', scope: 'all-teams',
      source: { provider: id, name: id, url: null }, fetchedAt: new Date().toISOString(),
      groups: [{ key: 'passing', label: 'Passing', metrics: [{ key: 'passing.yards', label: 'Passing yards', value: 100, displayValue: '100' }] }],
    })),
  }
}

describe('request validation and identities', () => {
  it.each(['', '2025.1', '1e3', '-1', '1969', '9999', '2025<script>'])('rejects invalid season %s', season => {
    expect(() => validateStatsRequest(playerId, query(season))).toThrow()
  })
  it('rejects missing, duplicate and invalid season types', () => {
    for (const value of ['season=2025', 'season=2025&season=2024&seasonType=regular', 'season=2025&seasonType=career']) {
      expect(() => validateStatsRequest(playerId, new URLSearchParams(value))).toThrow()
    }
  })
  it('only accepts current-roster app IDs', () => {
    for (const id of ['3912547', 'sb48-russell-wilson', 'https://example.com', '__proto__']) {
      expect(() => validateStatsRequest(id, query())).toThrow('Current-roster player not found')
    }
  })
  it('has a unique verified mapping for every current roster player', () => {
    const players = [...getCurrentRoster('2026-hawks').players, ...getCurrentRoster('2026-pats').players]
    expect(players).toHaveLength(106)
    expect(Object.keys(ESPN_PLAYER_IDS).sort()).toEqual(players.map(p => p.id).sort())
    expect(new Set(Object.values(ESPN_PLAYER_IDS)).size).toBe(106)
    for (const id of Object.values(ESPN_PLAYER_IDS)) expect(id).toMatch(/^\d+$/)
  })
})

describe('provider-independent service', () => {
  it('accepts a second adapter without API or component changes', async () => {
    for (const id of ['espn-fixture', 'alternate-test-provider']) {
      const adapter = provider(id)
      const result = await createPlayerStatsService(adapter)(playerId, query())
      expect(result.source.provider).toBe(id)
      expect(result.groups[0].metrics[0].key).toBe('passing.yards')
      expect(result.availableSeasons).toEqual([2026, 2025, 2024])
      expect(result.seasonOptionsUnavailable).toBe(false)
    }
  })
  it('isolates player, provider, year and season type in cache keys', async () => {
    const cached = createStatsCache()
    const a = provider('a'), b = provider('b')
    const first = createPlayerStatsService(a, cached), second = createPlayerStatsService(b, cached)
    await first(playerId, query())
    await first(playerId, query())
    await first(playerId, query('2024'))
    await first(playerId, query('2025', 'postseason'))
    await first('2026-pats-drake-maye', query())
    await second(playerId, query())
    expect(a.getSeasonStats).toHaveBeenCalledTimes(4)
    expect(a.getAvailableSeasons).toHaveBeenCalledTimes(2)
    expect(b.getSeasonStats).toHaveBeenCalledTimes(1)
  })
  it('rejects mismatched season data instead of relabeling it', async () => {
    const adapter = provider()
    vi.mocked(adapter.getSeasonStats).mockImplementationOnce(async request => ({
      ...await provider().getSeasonStats(request), season: 2024,
    }))
    await expect(createPlayerStatsService(adapter)(playerId, query())).rejects.toMatchObject({ code: 'invalid-response' })
  })
  it('still returns totals if the season metadata endpoint fails', async () => {
    const adapter = provider()
    vi.mocked(adapter.getAvailableSeasons).mockRejectedValue(new Error('outage'))
    const result = await createPlayerStatsService(adapter)(playerId, query())
    expect(result.coverage).toBe('available')
    expect(result.availableSeasons).toEqual([2026, 2025])
    expect(result.seasonOptionsUnavailable).toBe(true)
  })
  it('uses a shorter lifetime for legitimate empty results', async () => {
    let now = 0
    const cached = createStatsCache(100, () => now)
    const adapter = provider()
    vi.mocked(adapter.getSeasonStats).mockImplementation(async request => ({
      ...await provider().getSeasonStats(request), coverage: 'no-stats', groups: [],
    }))
    const service = createPlayerStatsService(adapter, cached)
    await service(playerId, query())
    now = 59_999
    await service(playerId, query())
    expect(adapter.getSeasonStats).toHaveBeenCalledTimes(1)
    now = 60_000
    await service(playerId, query())
    expect(adapter.getSeasonStats).toHaveBeenCalledTimes(2)
  })
})

describe('bounded cache', () => {
  it('coalesces concurrent requests and expires successful totals at five minutes', async () => {
    let now = 0
    const cached = createStatsCache(3, () => now)
    const load = vi.fn(async () => 42)
    await Promise.all([cached('key', load, () => STATS_REFRESH_MS), cached('key', load, () => STATS_REFRESH_MS)])
    expect(load).toHaveBeenCalledTimes(1)
    now = STATS_REFRESH_MS
    await cached('key', load, () => STATS_REFRESH_MS)
    expect(load).toHaveBeenCalledTimes(2)
  })
  it('never caches failures and bounds the number of entries', async () => {
    const cached = createStatsCache(1)
    const fail = vi.fn(async () => { throw new Error('outage') })
    await expect(cached('a', fail, () => 1000)).rejects.toThrow('outage')
    await expect(cached('a', fail, () => 1000)).rejects.toThrow('outage')
    expect(fail).toHaveBeenCalledTimes(2)
    const load = vi.fn(async () => 'ok')
    await cached('a', load, () => 1000)
    await cached('b', load, () => 1000)
    await cached('a', load, () => 1000)
    expect(load).toHaveBeenCalledTimes(3)
  })
})
