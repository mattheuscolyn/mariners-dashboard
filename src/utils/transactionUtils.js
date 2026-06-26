import { MARINERS_ID } from '../services/mlbApi'

export function formatTransactionDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function involvesMariners(tx) {
  return (
    tx.fromTeam?.id === MARINERS_ID ||
    tx.toTeam?.id === MARINERS_ID ||
    tx.fromOrg?.id === MARINERS_ID ||
    tx.toOrg?.id === MARINERS_ID
  )
}

function classifyMarinersEvent(tx) {
  const desc = (tx.description ?? '').toLowerCase()
  const toSea = tx.toTeam?.id === MARINERS_ID
  const fromSea = tx.fromTeam?.id === MARINERS_ID
  const code = tx.typeCode ?? ''

  if (desc.includes('designated for assignment')) {
    return "DFA'd"
  }

  switch (code) {
    case 'TR':
      if (toSea) return 'Traded to SEA'
      if (fromSea) return 'Traded from SEA'
      break
    case 'SGN':
      if (toSea) return desc.includes('draft') ? 'Drafted' : 'Signed'
      break
    case 'FA':
    case 'SFA':
      if (toSea) return 'Signed'
      break
    case 'CU':
    case 'RC':
      if (toSea) return 'Called up'
      break
    case 'SE':
      if (toSea) return 'Called up'
      break
    case 'OPT':
      if (fromSea) return 'Optioned'
      break
    case 'REL':
      if (fromSea || desc.includes('mariners')) return 'Released'
      break
    case 'WA':
      if (fromSea || toSea) return 'Waived'
      break
    default:
      break
  }

  return null
}

export function buildMarinersHistoryTimeline(transactions) {
  if (!transactions?.length) return []

  const seen = new Set()
  const events = []

  for (const tx of transactions) {
    if (!involvesMariners(tx)) continue

    const label = classifyMarinersEvent(tx)
    if (!label) continue

    const dedupeKey = `${tx.date}|${label}|${tx.description ?? ''}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    events.push({
      id: tx.id ?? dedupeKey,
      date: tx.date,
      label,
      description: tx.description ?? label,
    })
  }

  return events.sort((a, b) => new Date(a.date) - new Date(b.date))
}
