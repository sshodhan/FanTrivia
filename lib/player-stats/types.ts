export const ROSTER_SEASON = 2026
export const FIRST_SUPPORTED_SEASON = 1970
export const STATS_REFRESH_MS = 5 * 60 * 1000

export type SeasonType = 'regular' | 'postseason'
export type StatsCoverage = 'available' | 'no-stats' | 'unsupported' | 'unmapped'

export interface StatsPlayer {
  id: string
  name: string
  position: string
}

export interface SeasonStatsRequest {
  player: StatsPlayer
  season: number
  seasonType: SeasonType
}

export interface StatMetric {
  key: string
  label: string
  value: number | null
  displayValue: string
  unit?: 'yards' | 'percent' | 'rating'
}

export interface StatGroup {
  key: string
  label: string
  metrics: StatMetric[]
}

export interface StatsSource {
  provider: string
  name: string
  url: string | null
}

export interface ProviderSeasonStats {
  playerId: string
  season: number
  seasonType: SeasonType
  coverage: StatsCoverage
  groups: StatGroup[]
  source: StatsSource
  fetchedAt: string
  scope: 'all-teams'
  note?: string
}

export interface PlayerSeasonStatsResponse extends ProviderSeasonStats {
  availableSeasons: number[]
  seasonOptionsUnavailable: boolean
}

export interface PlayerStatsProvider {
  readonly id: string
  readonly name: string
  getAvailableSeasons(player: StatsPlayer): Promise<number[]>
  getSeasonStats(request: SeasonStatsRequest): Promise<ProviderSeasonStats>
}

export class StatsProviderError extends Error {
  constructor(public readonly code: 'unavailable' | 'invalid-response' | 'timeout') {
    super('The statistics provider is temporarily unavailable.')
    this.name = 'StatsProviderError'
  }
}
