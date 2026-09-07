import 'server-only'
import { espnProvider } from './providers/espn'
import { createPlayerStatsService } from './service'
import type { PlayerStatsProvider } from './types'

const providers = {
  espn: espnProvider,
} satisfies Record<string, PlayerStatsProvider>

// Add an adapter and its identity mappings above; the API and cards stay unchanged.
export const ACTIVE_STATS_PROVIDER: keyof typeof providers = 'espn'
export const getPlayerSeasonStats = createPlayerStatsService(providers[ACTIVE_STATS_PROVIDER])
