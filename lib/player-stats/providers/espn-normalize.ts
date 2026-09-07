import type { StatGroup, StatMetric } from '../types'

export interface EspnCategory {
  name: string
  stats: { name: string; value?: number | null; displayValue?: string | null }[]
}

type Field = [category: string, name: string, key: string, label: string, unit?: StatMetric['unit']]
type Group = { key: string; label: string; primary: RegExp; fields: Field[] }

const GROUPS: Group[] = [
  { key: 'passing', label: 'Passing', primary: /Quarterback/i, fields: [
    ['passing', 'passingYards', 'yards', 'Passing yards', 'yards'],
    ['passing', 'passingTouchdowns', 'touchdowns', 'Passing TDs'],
    ['passing', 'completions', 'completions', 'Completions'],
    ['passing', 'passingAttempts', 'attempts', 'Pass attempts'],
    ['passing', 'completionPct', 'completionPercentage', 'Completion %', 'percent'],
    ['passing', 'interceptions', 'interceptionsThrown', 'Interceptions thrown'],
    ['passing', 'QBRating', 'passerRating', 'Passer rating', 'rating'],
    ['passing', 'sacks', 'sacksTaken', 'Sacks taken'],
  ] },
  { key: 'rushing', label: 'Rushing', primary: /Running Back|Fullback/i, fields: [
    ['rushing', 'rushingYards', 'yards', 'Rushing yards', 'yards'],
    ['rushing', 'rushingTouchdowns', 'touchdowns', 'Rushing TDs'],
    ['rushing', 'rushingAttempts', 'attempts', 'Carries'],
    ['rushing', 'yardsPerRushAttempt', 'yardsPerAttempt', 'Yards per carry', 'yards'],
    ['rushing', 'longRushing', 'longest', 'Longest rush', 'yards'],
    ['rushing', 'rushingFumblesLost', 'fumblesLost', 'Rushing fumbles lost'],
  ] },
  { key: 'receiving', label: 'Receiving', primary: /Wide Receiver|Tight End/i, fields: [
    ['receiving', 'receivingYards', 'yards', 'Receiving yards', 'yards'],
    ['receiving', 'receivingTouchdowns', 'touchdowns', 'Receiving TDs'],
    ['receiving', 'receptions', 'receptions', 'Receptions'],
    ['receiving', 'receivingTargets', 'targets', 'Targets'],
    ['receiving', 'yardsPerReception', 'yardsPerReception', 'Yards per reception', 'yards'],
    ['receiving', 'longReception', 'longest', 'Longest reception', 'yards'],
  ] },
  { key: 'defense', label: 'Defense', primary: /Defensive|Nose Tackle|Linebacker|Cornerback|Safety/i, fields: [
    ['defensive', 'totalTackles', 'tackles', 'Total tackles'],
    ['defensive', 'sacks', 'sacks', 'Defensive sacks'],
    ['defensive', 'soloTackles', 'soloTackles', 'Solo tackles'],
    ['defensive', 'assistTackles', 'assistedTackles', 'Assisted tackles'],
    ['defensive', 'tacklesForLoss', 'tacklesForLoss', 'Tackles for loss'],
    ['defensive', 'passesDefended', 'passesDefended', 'Passes defended'],
    ['defensiveInterceptions', 'interceptions', 'interceptions', 'Defensive interceptions'],
    ['general', 'fumblesForced', 'forcedFumbles', 'Forced fumbles'],
  ] },
  { key: 'kicking', label: 'Kicking', primary: /Kicker/i, fields: [
    ['kicking', 'fieldGoalsMade', 'fieldGoalsMade', 'Field goals made'],
    ['kicking', 'fieldGoalAttempts', 'fieldGoalAttempts', 'Field goal attempts'],
    ['kicking', 'fieldGoalPct', 'fieldGoalPercentage', 'Field goal %', 'percent'],
    ['kicking', 'longFieldGoalMade', 'longestFieldGoal', 'Longest field goal', 'yards'],
    ['kicking', 'extraPointsMade', 'extraPointsMade', 'Extra points made'],
    ['kicking', 'extraPointAttempts', 'extraPointAttempts', 'Extra point attempts'],
  ] },
  { key: 'punting', label: 'Punting', primary: /Punter/i, fields: [
    ['punting', 'punts', 'punts', 'Punts'],
    ['punting', 'puntYards', 'yards', 'Punt yards', 'yards'],
    ['punting', 'grossAvgPuntYards', 'averageYards', 'Punt average', 'yards'],
    ['punting', 'netAvgPuntYards', 'netAverageYards', 'Net punt average', 'yards'],
    ['punting', 'puntsInside20', 'inside20', 'Punts inside 20'],
    ['punting', 'longPunt', 'longest', 'Longest punt', 'yards'],
  ] },
  { key: 'returns', label: 'Returns', primary: /Returner/i, fields: [
    ['returning', 'kickReturns', 'kickReturns', 'Kick returns'],
    ['returning', 'kickReturnYards', 'kickReturnYards', 'Kick return yards', 'yards'],
    ['returning', 'kickReturnTouchdowns', 'kickReturnTouchdowns', 'Kick return TDs'],
    ['returning', 'puntReturns', 'puntReturns', 'Punt returns'],
    ['returning', 'puntReturnYards', 'puntReturnYards', 'Punt return yards', 'yards'],
    ['returning', 'puntReturnTouchdowns', 'puntReturnTouchdowns', 'Punt return TDs'],
  ] },
  { key: 'general', label: 'Participation', primary: /./, fields: [
    ['general', 'gamesPlayed', 'gamesPlayed', 'Games played'],
    ['general', 'gamesStarted', 'gamesStarted', 'Games started'],
  ] },
]

export function normalizeEspnStats(categories: EspnCategory[], position: string): StatGroup[] {
  const values = new Map(categories.flatMap(category => category.stats.map(stat => [`${category.name}.${stat.name}`, stat] as const)))
  const ordered = [...GROUPS].sort((a, b) => Number(b.primary.test(position)) - Number(a.primary.test(position)))
  return ordered.flatMap(group => {
    const metrics = group.fields.flatMap(([category, name, key, label, unit]): StatMetric[] => {
      const stat = values.get(`${category}.${name}`)
      if (!stat || (stat.value == null && !stat.displayValue)) return []
      if (stat.value == null && /^(--?|N\/A)$/i.test(stat.displayValue!.trim())) return []
      let displayValue = stat.displayValue?.trim() || String(stat.value)
      if (unit === 'percent' && !displayValue.endsWith('%')) displayValue += '%'
      return [{ key: `${group.key}.${key}`, label, value: stat.value ?? null, displayValue, ...(unit ? { unit } : {}) }]
    })
    if (!metrics.length) return []
    if (!group.primary.test(position) && !metrics.some(metric => metric.value !== null && metric.value !== 0)) return []
    return [{ key: group.key, label: group.label, metrics }]
  })
}
