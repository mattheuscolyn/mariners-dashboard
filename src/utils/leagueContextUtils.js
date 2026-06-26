import { parseInnings } from './statsUtils'

const MIN_PLATE_APPEARANCES = 100
const MIN_INNINGS_PITCHED = 20

function parseRate(val) {
  if (val == null || val === '') return null
  const n = typeof val === 'string' ? parseFloat(val) : val
  return Number.isNaN(n) ? null : n
}

function buildDistribution(values) {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 0) return null

  const sum = sorted.reduce((acc, v) => acc + v, 0)
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    values: sorted,
  }
}

function k9FromStat(stat) {
  const k = parseFloat(stat.strikeOuts ?? stat.strikeouts ?? 0)
  const ip = parseInnings(stat.inningsPitched)
  if (ip === 0) return null
  return (k * 9) / ip
}

export function buildLeagueDistributions(hittingSplits, pitchingSplits) {
  const qualifiedHitters = (hittingSplits ?? []).filter(
    (s) => (s.stat?.plateAppearances ?? 0) >= MIN_PLATE_APPEARANCES,
  )
  const qualifiedPitchers = (pitchingSplits ?? []).filter((s) => {
    const ip = parseInnings(s.stat?.inningsPitched)
    return ip >= MIN_INNINGS_PITCHED
  })

  const hitting = {
    avg: buildDistribution(
      qualifiedHitters.map((s) => parseRate(s.stat?.avg)).filter((v) => v != null),
    ),
    obp: buildDistribution(
      qualifiedHitters.map((s) => parseRate(s.stat?.obp)).filter((v) => v != null),
    ),
    slg: buildDistribution(
      qualifiedHitters.map((s) => parseRate(s.stat?.slg)).filter((v) => v != null),
    ),
    wrcPlus: null,
  }

  const pitching = {
    era: buildDistribution(
      qualifiedPitchers.map((s) => parseRate(s.stat?.era)).filter((v) => v != null),
    ),
    whip: buildDistribution(
      qualifiedPitchers.map((s) => parseRate(s.stat?.whip)).filter((v) => v != null),
    ),
    k9: buildDistribution(
      qualifiedPitchers.map((s) => k9FromStat(s.stat)).filter((v) => v != null),
    ),
  }

  return { hitting, pitching }
}

export function barPosition(value, min, max) {
  if (value == null || min == null || max == null) return 50
  if (max === min) return 50
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

export function computePercentile(value, distribution, higherIsBetter = true) {
  if (value == null || !distribution?.values?.length) return null

  const { values } = distribution
  if (higherIsBetter) {
    const below = values.filter((v) => v < value).length
    return Math.round((below / values.length) * 100)
  }

  const above = values.filter((v) => v > value).length
  return Math.round((above / values.length) * 100)
}

export function getContextTier(percentile) {
  if (percentile == null) return 'avg'
  if (percentile >= 60) return 'above'
  if (percentile <= 40) return 'below'
  return 'avg'
}

export function getContextCaption(percentile) {
  if (percentile == null) return 'League avg'
  const tier = getContextTier(percentile)

  if (tier === 'avg') return 'League avg'

  const suffix = percentile != null ? ` · ${percentile}th pct` : ''
  return tier === 'above' ? `Above avg${suffix}` : `Below avg${suffix}`
}

function ordinal(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n}st`
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`
  return `${n}th`
}

export function getContextCaptionWithOrdinal(percentile) {
  if (percentile == null) return 'League avg'
  const tier = getContextTier(percentile)

  if (tier === 'avg') return 'League avg'

  const pctLabel = `${ordinal(percentile)} pct`
  return tier === 'above' ? `Above avg · ${pctLabel}` : `Below avg · ${pctLabel}`
}
