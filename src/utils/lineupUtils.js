import { getPositionInfo } from '../data/positions'

export function getPositionName(abbr) {
  return getPositionInfo(abbr).name
}

function formatMonthYear(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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
    (tx) =>
      (tx.typeCode === 'RC' || tx.typeDesc?.toLowerCase().includes('recall')) &&
      daysSince(tx.date) <= 14,
  )
  if (recall) {
    return `Called up from Tacoma on ${formatShortDate(recall.date)}`
  }

  const trade = transactions.find(
    (tx) =>
      (tx.typeCode === 'TR' || tx.typeDesc?.toLowerCase().includes('trade')) &&
      daysSince(tx.date) <= 60,
  )
  if (trade) {
    const fromTeam = txFromTeam(trade)
    return `Acquired from ${fromTeam} on ${formatShortDate(trade.date)}`
  }

  return null
}

function txFromTeam(tx) {
  return tx.fromTeam?.name ?? tx.fromOrg?.name ?? 'another team'
}

export function buildOriginString(transactions) {
  const stories = buildOriginStories(transactions, 1)
  return stories[0] ?? 'Joined the Mariners organization'
}

export function buildOriginStories(transactions, limit = 2) {
  const relevant = transactions.filter((tx) => {
    if (tx.typeCode === 'REL') return false
    return ['TR', 'SFA', 'FA', 'SC', 'RC'].includes(tx.typeCode)
  })

  if (relevant.length === 0) {
    return ['Joined the Mariners organization']
  }

  return relevant.slice(0, limit).map((tx) => {
    const when = formatMonthYear(tx.date)
    const fromTeam = txFromTeam(tx)

    switch (tx.typeCode) {
      case 'TR':
        return `Acquired via trade from ${fromTeam}, ${when}.`
      case 'SFA':
      case 'FA':
        return `Signed as a free agent, ${when}.`
      case 'SC':
        return `Selected from ${fromTeam}, ${when}.`
      case 'RC':
        return `Recalled from ${fromTeam}, ${when}.`
      default:
        return 'Joined the Mariners organization.'
    }
  })
}

export function isOnInjuredList(playerId, injuredList) {
  return injuredList?.some((p) => p.id === playerId) ?? false
}
