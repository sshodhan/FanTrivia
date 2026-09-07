'use client'

import { useId, useState } from 'react'
import useSWR from 'swr'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROSTER_SEASON, STATS_REFRESH_MS, type PlayerSeasonStatsResponse, type SeasonType } from '@/lib/player-stats/types'

async function fetchSeasonStats(url: string): Promise<PlayerSeasonStatsResponse> {
  const response = await fetch(url, { signal: AbortSignal.timeout(25_000), cache: 'no-store' })
  if (!response.ok) throw new Error('Season statistics are temporarily unavailable. Please try again.')
  return response.json()
}

const EMPTY_TITLES = {
  'no-stats': 'No recorded stats for this selection',
  unsupported: 'Statistics not covered',
  unmapped: 'Player not linked to a stats source',
} as const

export function PlayerSeasonStats({ playerId }: { playerId: string }) {
  const id = useId()
  const [season, setSeason] = useState(ROSTER_SEASON)
  const [seasonType, setSeasonType] = useState<SeasonType>('regular')
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([ROSTER_SEASON])
  const { data, error, isLoading, isValidating, mutate } = useSWR<PlayerSeasonStatsResponse>(
    `/api/players/${encodeURIComponent(playerId)}/stats?season=${season}&seasonType=${seasonType}`,
    fetchSeasonStats,
    {
      refreshInterval: STATS_REFRESH_MS,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      keepPreviousData: false,
      errorRetryCount: 2,
      errorRetryInterval: 30_000,
      onSuccess: result => setAvailableSeasons(result.availableSeasons),
    },
  )
  const result = data?.playerId === playerId && data.season === season && data.seasonType === seasonType ? data : undefined
  const years = [...new Set([...availableSeasons, ...(result?.availableSeasons ?? []), season])].sort((a, b) => b - a)
  const seasonLabel = seasonType === 'regular' ? 'Regular season' : 'Playoffs'

  return (
    <section className="p-4 font-sans" aria-labelledby={`${id}-heading`}>
      <div className="flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <h3 id={`${id}-heading`} className="text-lg font-semibold text-foreground text-balance">Season statistics</h3>
          <Button variant="ghost" size="sm" onClick={() => { void mutate().catch(() => undefined) }} disabled={isValidating} aria-label="Check for stats updates">
            <RefreshCw data-icon="inline-start" />
            {isValidating ? 'Checking…' : 'Refresh'}
          </Button>
        </header>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor={`${id}-season`}>NFL season</FieldLabel>
            <Select value={String(season)} onValueChange={value => setSeason(Number(value))}>
              <SelectTrigger id={`${id}-season`} className="min-w-28" aria-describedby={`${id}-season-help`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <Tabs value={seasonType} onValueChange={value => setSeasonType(value as SeasonType)}>
          <TabsList className="w-full" aria-label="Season statistics type">
            <TabsTrigger value="regular">Regular season</TabsTrigger>
            <TabsTrigger value="postseason">Playoffs</TabsTrigger>
          </TabsList>
          <TabsContent value={seasonType}>
            <div className="flex flex-col gap-4" aria-busy={isLoading}>
              <p className="text-sm leading-relaxed text-muted-foreground" id={`${id}-season-help`}>
                {season} {seasonLabel.toLowerCase()} · Totals across all teams.
                {seasonType === 'postseason' && ` Includes playoffs played in early ${season + 1}.`}
              </p>
              {error && (
                <Alert>
                  <AlertTitle>{result ? 'Could not refresh statistics' : 'Statistics temporarily unavailable'}</AlertTitle>
                  <AlertDescription>
                    <p>{result ? 'Showing previously fetched data for this selection. It may be out of date.' : 'The stats source could not be reached. Your player profile is still available below.'}</p>
                    <Button variant="outline" size="sm" disabled={isValidating} onClick={() => { void mutate().catch(() => undefined) }}>Try again</Button>
                  </AlertDescription>
                </Alert>
              )}
              {isLoading && !result && (
                <div role="status" className="grid grid-cols-2 gap-3">
                  <span className="sr-only">Loading {season} {seasonLabel.toLowerCase()} statistics</span>
                  {[0, 1, 2, 3].map(item => <Skeleton key={item} className="h-20 rounded-xl" />)}
                </div>
              )}
              {result && (
                <div className="flex flex-col gap-5" aria-live="polite">
                  {result.coverage === 'available' ? result.groups.map(group => (
                    <section key={group.key} className="flex flex-col gap-2" aria-labelledby={`${id}-${group.key}`}>
                      <h4 id={`${id}-${group.key}`} className="text-sm font-semibold text-primary">{group.label}</h4>
                      <dl className="grid grid-cols-2 gap-3">
                        {group.metrics.map(metric => (
                          <div key={metric.key} className="rounded-xl bg-card p-3 text-card-foreground">
                            <dt className="text-sm leading-relaxed text-muted-foreground">{metric.label}</dt>
                            <dd className="text-2xl font-bold leading-relaxed tabular-nums">{metric.displayValue}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )) : (
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyTitle>{EMPTY_TITLES[result.coverage]}</EmptyTitle>
                        <EmptyDescription>
                          {result.coverage === 'no-stats' && `${result.source.name} has no recorded totals for this player in the ${season} ${seasonLabel.toLowerCase()}. The season may not have started, or the player may not have recorded statistics. Try another selection.`}
                          {result.coverage === 'unsupported' && `The source does not supply supported metrics for this player and selection. Missing values are not treated as zero.`}
                          {result.coverage === 'unmapped' && `A verified player match is not yet available from ${result.source.name}. The player profile below is unaffected.`}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                  {result.note && <p className="text-sm leading-relaxed text-muted-foreground">{result.note}</p>}
                  {result.seasonOptionsUnavailable && (
                    <Alert>
                      <AlertTitle>Season list could not be loaded</AlertTitle>
                      <AlertDescription>Some earlier seasons may be missing from the selector. Refresh to try again.</AlertDescription>
                    </Alert>
                  )}
                  <footer className="flex flex-col gap-1 text-sm leading-relaxed text-muted-foreground">
                    {result.source.url ? (
                      <a href={result.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start underline underline-offset-4 hover:text-foreground">
                        Source: {result.source.name}<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </a>
                    ) : <span>Source: {result.source.name}</span>}
                    <p>Last fetched: <time dateTime={result.fetchedAt}>{new Date(result.fetchedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></p>
                    <p>Checks every 5 minutes while visible. Refresh uses the same cache window; not live play-by-play.</p>
                  </footer>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
