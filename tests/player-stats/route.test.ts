import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/player-stats', () => ({ getPlayerSeasonStats: vi.fn() }))
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/players/[playerId]/stats/route'
import { getPlayerSeasonStats } from '@/lib/player-stats'
import { StatsRequestError } from '@/lib/player-stats/service'

const request = new NextRequest('http://localhost/api/players/2026-hawks-sam-darnold/stats?season=2025&seasonType=regular')
const context = { params: Promise.resolve({ playerId: '2026-hawks-sam-darnold' }) }
beforeEach(() => { vi.mocked(getPlayerSeasonStats).mockReset() })

it('awaits route params and returns the stable provider-neutral response', async () => {
  const payload = { coverage: 'available', season: 2025, seasonType: 'regular', groups: [] }
  vi.mocked(getPlayerSeasonStats).mockResolvedValue(payload as never)
  const response = await GET(request, context)
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(payload)
  expect(getPlayerSeasonStats).toHaveBeenCalledWith('2026-hawks-sam-darnold', request.nextUrl.searchParams)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
})

it.each([400, 404] as const)('returns validation status %i', async status => {
  vi.mocked(getPlayerSeasonStats).mockRejectedValue(new StatsRequestError(status, 'Invalid request'))
  const response = await GET(request, context)
  expect(response.status).toBe(status)
})

it('does not leak upstream errors and advertises retry on outages', async () => {
  vi.mocked(getPlayerSeasonStats).mockRejectedValue(new Error('secret provider details'))
  const response = await GET(request, context)
  expect(response.status).toBe(503)
  expect(response.headers.get('Retry-After')).toBe('30')
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(await response.text()).not.toContain('secret provider details')
})
