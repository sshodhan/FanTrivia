import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { espnProvider } from '@/lib/player-stats/providers/espn'
import { normalizeEspnStats, type EspnCategory } from '@/lib/player-stats/providers/espn-normalize'
import type { SeasonStatsRequest } from '@/lib/player-stats/types'

const request: SeasonStatsRequest = {
  player: { id: '2026-hawks-sam-darnold', name: 'Sam Darnold', position: 'Quarterback' },
  season: 2025, seasonType: 'regular',
}
const category = (name: string, values: Record<string, number>): EspnCategory => ({
  name, stats: Object.entries(values).map(([name, value]) => ({ name, value, displayValue: String(value) })),
})
function totals(categories = [category('passing', { passingYards: 4048, passingTouchdowns: 25 })], season = 2025, type = 2, id = '3912547') {
  const root = `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}`
  return {
    season: { $ref: root }, seasonType: { $ref: `${root}/types/${type}` }, athlete: { $ref: `${root}/athletes/${id}` },
    splits: { type: 'total', categories },
  }
}
function mockResponse(data: unknown, status = 200) {
  return vi.stubGlobal('fetch', vi.fn(async () => Response.json(data, { status })))
}
afterEach(() => vi.unstubAllGlobals())

describe('ESPN adapter', () => {
  it.each([['regular', 2], ['postseason', 3]] as const)('requests exact %s totals on a fixed host', async (seasonType, type) => {
    mockResponse(totals(undefined, 2025, type))
    const result = await espnProvider.getSeasonStats({ ...request, seasonType })
    expect(fetch).toHaveBeenCalledWith(
      `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/${type}/athletes/3912547/statistics`,
      expect.objectContaining({ cache: 'no-store', redirect: 'error', signal: expect.any(AbortSignal) }),
    )
    expect(result).toMatchObject({ season: 2025, seasonType, coverage: 'available', scope: 'all-teams' })
    expect(result.groups[0].metrics[0].value).toBe(4048)
  })
  it('does not substitute the current team or sum team and career totals', async () => {
    const transferred = { ...request, player: { id: '2026-hawks-rashid-shaheed', name: 'Rashid Shaheed', position: 'Wide Receiver' } }
    mockResponse({ ...totals([category('receiving', { receivingYards: 687, yardsPerReception: 11.7 })], 2025, 2, '4032473'), teams: ['18', '26'], career: { receivingYards: 99999 } })
    const result = await espnProvider.getSeasonStats(transferred)
    expect(result.groups[0].metrics.map(m => m.value)).toEqual([687, 11.7])
    expect(String(vi.mocked(fetch).mock.calls[0][0])).not.toContain('/teams/')
  })
  it('uses the complete season log, including participation-only years', async () => {
    mockResponse({ entries: [2024, 2025, 2025].map(year => ({ season: { $ref: `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${year}?lang=en` } })) })
    expect(await espnProvider.getAvailableSeasons(request.player)).toEqual([2025, 2024])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/statisticslog')
  })
  it('returns no past seasons for rookies without recorded statistics', async () => {
    mockResponse({ error: { message: 'No stats found.' } }, 404)
    expect(await espnProvider.getAvailableSeasons(request.player)).toEqual([])
  })
  it.each([{}, { entries: [{ season: { $ref: 'https://other.example/seasons/2025' } }] }])('rejects malformed season metadata', async payload => {
    mockResponse(payload)
    await expect(espnProvider.getAvailableSeasons(request.player)).rejects.toMatchObject({ code: 'invalid-response' })
  })
  it('treats a documented no-stats 404 as empty, not an outage', async () => {
    mockResponse({ error: { message: 'No stats found.' } }, 404)
    expect(await espnProvider.getSeasonStats(request)).toMatchObject({ coverage: 'no-stats', groups: [] })
  })
  it.each([429, 500, 503, 403, 404])('does not mislabel an upstream %i error as no stats', async status => {
    mockResponse({ error: { message: 'Unavailable' } }, status)
    await expect(espnProvider.getSeasonStats(request)).rejects.toMatchObject({ code: 'unavailable' })
  })
  it('reports timeout separately', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')))
    await expect(espnProvider.getSeasonStats(request)).rejects.toMatchObject({ code: 'timeout' })
  })
  it.each([
    {}, { splits: { type: 'career', categories: [] } },
    totals(undefined, 2024), totals(undefined, 2025, 3), totals(undefined, 2025, 2, '999'),
    { ...totals(), season: { $ref: 'https://malicious.example/seasons/2025' } },
    totals([{ name: 'passing', stats: [{ name: 'passingYards', value: 'invalid' }] }] as never),
  ])('rejects malformed, mismatched or non-total data', async payload => {
    mockResponse(payload)
    await expect(espnProvider.getSeasonStats(request)).rejects.toMatchObject({ code: 'invalid-response' })
  })
  it('distinguishes unsupported metrics from missing player mapping', async () => {
    mockResponse(totals([category('unknownCategory', { unknownMetric: 20 })]))
    expect(await espnProvider.getSeasonStats(request)).toMatchObject({ coverage: 'unsupported', groups: [] })
    vi.mocked(fetch).mockClear()
    expect(await espnProvider.getSeasonStats({ ...request, player: { ...request.player, id: 'unmapped-player' } })).toMatchObject({ coverage: 'unmapped' })
    expect(fetch).not.toHaveBeenCalled()
  })
  it('shows participation-only coverage for a lineman', async () => {
    mockResponse(totals([category('general', { gamesPlayed: 14 })], 2025, 2, '4426376'))
    const result = await espnProvider.getSeasonStats({ ...request, player: { id: '2026-hawks-charles-cross', name: 'Charles Cross', position: 'Offensive Tackle' } })
    expect(result.coverage).toBe('available')
    expect(result.note).toContain('Only participation statistics')
    expect(result.groups[0].metrics[0].value).toBe(14)
  })
})

describe('normalized metrics', () => {
  it('preserves true zeros, omits absent metrics, and qualifies ambiguous stat names', () => {
    const result = normalizeEspnStats([
      category('passing', { interceptions: 0, sacks: 27, completionPct: 67.7 }),
      category('defensive', { sacks: 2 }), category('defensiveInterceptions', { interceptions: 1 }),
    ], 'Quarterback').flatMap(group => group.metrics)
    expect(result.find(m => m.key === 'passing.interceptionsThrown')?.value).toBe(0)
    expect(result.find(m => m.key === 'passing.sacksTaken')?.value).toBe(27)
    expect(result.find(m => m.key === 'defense.sacks')?.value).toBe(2)
    expect(result.find(m => m.key === 'defense.interceptions')?.value).toBe(1)
    expect(result.find(m => m.key === 'passing.completionPercentage')?.displayValue).toBe('67.7%')
    expect(result.some(m => m.key === 'passing.yards')).toBe(false)
  })
  it('omits missing placeholders without inventing zero', () => {
    expect(normalizeEspnStats([{ name: 'passing', stats: [{ name: 'passingYards', value: null, displayValue: '--' }] }], 'Quarterback')).toEqual([])
  })
  it.each([
    ['Running Back', 'rushing', 'rushingYards', 'rushing.yards'],
    ['Wide Receiver', 'receiving', 'receivingYards', 'receiving.yards'],
    ['Linebacker', 'defensive', 'sacks', 'defense.sacks'],
    ['Kicker', 'kicking', 'fieldGoalsMade', 'kicking.fieldGoalsMade'],
    ['Punter', 'punting', 'punts', 'punting.punts'],
    ['Cornerback', 'returning', 'puntReturnYards', 'returns.puntReturnYards'],
  ])('supports %s statistics', (position, group, name, key) => {
    expect(normalizeEspnStats([category(group, { [name]: 7 })], position)[0].metrics[0]).toMatchObject({ key, value: 7 })
  })
})
