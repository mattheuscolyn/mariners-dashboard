import { getPositionInfo } from '../data/positions'
import {
  isRecallTransaction,
  isTradeTransaction,
  txFromTeam,
} from './transactionUtils'

export { buildOriginStories, buildOriginString } from './transactionUtils'

export function getPositionName(abbr) {
  return getPositionInfo(abbr).name
}

function formatShortDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysSince(dateStr) {
  const then = new Date(dateStr)
  const now = new Date()
  return (now - then) / (1000 * 60 * 60 * 24)
}

function findRosterPlayer(roster, playerId) {
  return roster?.find((p) => p.id === playerId)
}

function shortName(fullName) {
  const parts = (fullName ?? '').trim().split(/\s+/)
  return parts[parts.length - 1] || fullName || '—'
}

export function buildLineupChangeChips(lineup, baseline, injuredList) {
  if (!lineup?.length || !baseline || Object.keys(baseline).length === 0) {
    return []
  }

  const starterIds = new Set(
    lineup.map((p) => p.person?.id ?? p.id).filter(Boolean),
  )
  const changes = []

  for (const player of lineup) {
    const pos = player.position?.abbreviation ?? player.position
    const playerId = player.person?.id ?? player.id

    if (!pos || pos === 'P' || pos === '—' || !playerId) continue

    const usualStarter = baseline[pos]
    if (!usualStarter || usualStarter.playerId === playerId) continue

    const starterName = shortName(
      player.fullName ?? player.person?.fullName ?? '',
    )
    const usualName = shortName(usualStarter.fullName)
    const isInjured = injuredList?.some(
      (p) => (p.person?.id ?? p.id) === usualStarter.playerId,
    )
    const usualInLineup = starterIds.has(usualStarter.playerId)

    let suffix = ''
    if (isInjured) {
      suffix = ` (for ${usualName} — IL)`
    } else if (!usualInLineup) {
      suffix = ' (rest day)'
    }

    changes.push({
      id: `${pos}-${playerId}`,
      pos,
      text: `${pos}: ${starterName}${suffix}`,
      isIl: isInjured,
    })
  }

  changes.sort((a, b) => {
    if (a.isIl !== b.isIl) return a.isIl ? -1 : 1
    return a.pos.localeCompare(b.pos)
  })

  return changes
}

export function isTypicalLineup(lineup, baseline, injuredList) {
  return buildLineupChangeChips(lineup, baseline, injuredList).length === 0
}

export function getExplainerText(lineupPlayer, baseline, injuredList) {
  const playerId = lineupPlayer.person?.id ?? lineupPlayer.id
  const playerName =
    lineupPlayer.fullName ?? lineupPlayer.person?.fullName ?? ''
  const pos =
    lineupPlayer.position?.abbreviation ?? lineupPlayer.position

  if (!pos || pos === 'P' || pos === '—') return null

  const usualStarter = baseline?.[pos]

  if (!usualStarter || usualStarter.playerId === playerId) return null

  const usualName = usualStarter.fullName
  const isInjured = injuredList?.some(
    (p) => (p.person?.id ?? p.id) === usualStarter.playerId,
  )

  if (isInjured) {
    return `${usualName} is on the IL — ${playerName} filling in at ${pos}`
  }

  return `${playerName} filling in at ${pos} (${usualName} typically starts here)`
}

export function buildLineupExplainer({
  player,
  roster,
  injuredList,
  transactions = [],
  baseline = {},
}) {
  const baselineExplainer = getExplainerText(player, baseline, injuredList)
  if (baselineExplainer) return baselineExplainer

  const rosterPlayer = findRosterPlayer(roster, player.id)
  const naturalPosition = rosterPlayer?.position

  if (naturalPosition && player.position !== naturalPosition) {
    return `${player.fullName} filling in at ${player.position} today`
  }

  const recall = transactions.find(
    (tx) => isRecallTransaction(tx) && daysSince(tx.date) <= 14,
  )
  if (recall) {
    const from = txFromTeam(recall) ?? 'the minors'
    return `Called up from ${from} on ${formatShortDate(recall.date)}`
  }

  const trade = transactions.find(
    (tx) => isTradeTransaction(tx) && daysSince(tx.date) <= 60,
  )
  if (trade) {
    const fromTeam = txFromTeam(trade) ?? 'another team'
    return `Acquired from ${fromTeam} on ${formatShortDate(trade.date)}`
  }

  return null
}

export function isOnInjuredList(playerId, injuredList) {
  if (!playerId || !injuredList?.length) return false
  return injuredList.some(
    (il) => il.id === playerId || il.person?.id === playerId,
  )
}
