export function parseHittingStat(statsArray) {
  return statsArray?.[0]?.splits?.[0]?.stat ?? {}
}

export function parsePitchingStat(statsArray) {
  return statsArray?.[0]?.splits?.[0]?.stat ?? {}
}

export function parseGameLogSplits(statsArray) {
  return statsArray?.[0]?.splits ?? []
}

export function computeOPS(stat) {
  if (!stat) return 0
  if (stat.ops) return parseFloat(stat.ops)
  const obp = parseFloat(stat.obp) || 0
  const slg = parseFloat(stat.slg) || 0
  return obp + slg
}

export function aggregateHittingStats(splits) {
  let ab = 0
  let h = 0
  let hr = 0
  let bb = 0
  let tb = 0

  for (const split of splits) {
    const s = split.stat ?? {}
    ab += parseInt(s.atBats ?? 0, 10)
    h += parseInt(s.hits ?? 0, 10)
    hr += parseInt(s.homeRuns ?? 0, 10)
    bb += parseInt(s.baseOnBalls ?? 0, 10)
    tb += parseInt(s.totalBases ?? 0, 10)
  }

  const avg = ab > 0 ? h / ab : 0
  const obp = ab + bb > 0 ? (h + bb) / (ab + bb) : 0
  const slg = ab > 0 ? tb / ab : 0
  const ops = obp + slg

  return { avg, ops, homeRuns: hr, atBats: ab, hits: h }
}

export function getRecentHittingSplits(splits, days = 7) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)

  return splits.filter((split) => {
    const gameDate = new Date(split.date)
    return gameDate >= cutoff
  })
}

export function computeHitterTrend(seasonStat, recentStat) {
  const seasonOPS = computeOPS(seasonStat)
  const recentOPS = recentStat.ops ?? computeOPS(recentStat)

  if (seasonOPS === 0) return 'neutral'
  if (recentOPS > seasonOPS * 1.15) return 'hot'
  if (recentOPS < seasonOPS * 0.85) return 'cold'
  return 'neutral'
}

export function parseERA(stat) {
  if (!stat) return 0
  return parseFloat(stat.era ?? 0)
}

export function computePitcherERAFromGames(splits) {
  let earnedRuns = 0
  let outs = 0

  for (const split of splits) {
    const s = split.stat ?? {}
    earnedRuns += parseFloat(s.earnedRuns ?? 0)
    const ip = String(s.inningsPitched ?? '0')
    const parts = ip.split('.')
    outs += parseInt(parts[0], 10) * 3 + (parseInt(parts[1], 10) || 0)
  }

  if (outs === 0) return 0
  return (earnedRuns * 27) / outs
}

export function computePitcherTrend(seasonStat, recentSplits) {
  const seasonERA = parseERA(seasonStat)
  const recentERA = computePitcherERAFromGames(recentSplits)

  if (seasonERA === 0) return 'neutral'
  if (recentERA < seasonERA * 0.85) return 'hot'
  if (recentERA > seasonERA * 1.15) return 'cold'
  return 'neutral'
}

export function formatERA(era) {
  return era.toFixed(2)
}

export function formatAvg(avg) {
  if (typeof avg === 'string' && avg.startsWith('.')) return avg
  return avg.toFixed(3).replace(/^0/, '')
}

export function formatWHIP(whip) {
  return parseFloat(whip ?? 0).toFixed(2)
}

export function computeK9(stat) {
  const k = parseFloat(stat.strikeOuts ?? stat.strikeouts ?? 0)
  const ip = parseInnings(stat.inningsPitched)
  if (ip === 0) return '0.0'
  return (k * 9 / ip).toFixed(1)
}

export function parseInnings(ip) {
  if (!ip) return 0
  const str = String(ip)
  const parts = str.split('.')
  return parseInt(parts[0], 10) + (parseInt(parts[1], 10) || 0) / 3
}

export function formatWL(stat) {
  const w = stat.wins ?? 0
  const l = stat.losses ?? 0
  return `${w}-${l}`
}

export function summarizeLastStarts(pitchingSplits, count = 3) {
  const recent = [...pitchingSplits]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count)

  if (recent.length === 0) return 'No recent starts on record'

  const parts = recent.map((split) => {
    const s = split.stat ?? {}
    const er = s.earnedRuns ?? 0
    const ip = s.inningsPitched ?? '0'
    const opp = split.opponent?.name ?? split.team?.name ?? 'opp'
    return `${er} ER in ${ip} IP vs ${opp}`
  })

  return parts.join('; ')
}

export function americanOddsToImpliedProb(odds) {
  if (odds == null) return null
  if (odds > 0) return 100 / (odds + 100)
  return Math.abs(odds) / (Math.abs(odds) + 100)
}

export function formatPct(prob) {
  return `${Math.round(prob * 100)}%`
}
