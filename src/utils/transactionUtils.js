import { MARINERS_ID } from '../services/mlbApi'

const ONCE_PER_CAREER_LABELS = new Set(['Joined organization', 'Contract selected'])

function normalizeDesc(tx) {
  return (tx.description ?? '').toLowerCase()
}

function toMariners(tx) {
  return tx.toTeam?.id === MARINERS_ID
}

function fromMariners(tx) {
  return tx.fromTeam?.id === MARINERS_ID
}

function involvesMariners(tx) {
  return (
    tx.fromTeam?.id === MARINERS_ID ||
    tx.toTeam?.id === MARINERS_ID ||
    tx.fromOrg?.id === MARINERS_ID ||
    tx.toOrg?.id === MARINERS_ID
  )
}

export function txFromTeam(tx) {
  return tx.fromTeam?.name ?? tx.fromOrg?.name ?? null
}

function formatMonthYear(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function formatTransactionDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isRecallTransaction(tx) {
  const code = tx.typeCode ?? ''
  const desc = normalizeDesc(tx)
  return code === 'CU' || code === 'RC' || desc.includes('recalled')
}

export function isTradeTransaction(tx) {
  const code = tx.typeCode ?? ''
  const desc = normalizeDesc(tx)
  return code === 'TR' || desc.includes('trade')
}

export function isTransactionNoise(tx) {
  const code = tx.typeCode ?? ''
  const desc = normalizeDesc(tx)

  if (code === 'NUM') return true

  if (code === 'ASG') {
    if (desc.includes('spring training')) return true
    if (desc.includes('all-star')) return true
    if (
      tx.toTeam?.id &&
      tx.toTeam.id !== MARINERS_ID &&
      tx.fromTeam?.id !== MARINERS_ID
    ) {
      return true
    }
    if (!involvesMariners(tx)) return true
  }

  if (code === 'SC' && desc.includes('roster status changed')) return true

  return false
}

/**
 * Interpret an MLB transaction for display. Returns null when the event
 * should not surface in origin stories or the Mariners timeline.
 */
export function classifyTransaction(tx) {
  if (isTransactionNoise(tx)) return null

  const code = tx.typeCode ?? ''
  const desc = normalizeDesc(tx)
  const fromTeam = txFromTeam(tx)
  const toSea = toMariners(tx)
  const fromSea = fromMariners(tx)

  if (desc.includes('designated for assignment')) {
    return {
      timelineLabel: "DFA'd",
      isOriginEvent: false,
    }
  }

  switch (code) {
    case 'TR':
      if (toSea) {
        return {
          timelineLabel: 'Traded to SEA',
          originStory: `Acquired via trade from ${fromTeam ?? 'another team'}`,
          isOriginEvent: true,
        }
      }
      if (fromSea) {
        return { timelineLabel: 'Traded from SEA', isOriginEvent: false }
      }
      break

    case 'SGN':
      if (toSea) {
        const drafted = desc.includes('draft')
        return {
          timelineLabel: drafted ? 'Drafted' : 'Signed',
          originStory: drafted
            ? 'Drafted by the Mariners'
            : 'Signed with the Mariners',
          isOriginEvent: true,
        }
      }
      break

    case 'FA':
    case 'SFA':
      if (toSea) {
        return {
          timelineLabel: 'Signed',
          originStory: 'Signed as a free agent',
          isOriginEvent: true,
        }
      }
      break

    case 'ASG':
      if (toSea && !fromSea && desc.includes('assigned to seattle mariners')) {
        return {
          timelineLabel: 'Joined organization',
          originStory: 'Joined the Mariners organization',
          isOriginEvent: true,
        }
      }
      if (fromSea && desc.includes('rehab assignment')) {
        return { timelineLabel: 'Rehab assignment', isOriginEvent: false }
      }
      break

    case 'SE':
      if (toSea) {
        return {
          timelineLabel: 'Contract selected',
          originStory: fromTeam
            ? `Selected to the majors from ${fromTeam}`
            : 'Selected to the major league roster',
          isOriginEvent: false,
        }
      }
      break

    case 'CU':
    case 'RC':
      if (toSea) {
        return {
          timelineLabel: fromTeam ? `Recalled from ${fromTeam}` : 'Recalled',
          isOriginEvent: false,
        }
      }
      break

    case 'OPT':
      if (fromSea) {
        return { timelineLabel: 'Optioned', isOriginEvent: false }
      }
      break

    case 'REL':
      if (fromSea || desc.includes('mariners')) {
        return { timelineLabel: 'Released', isOriginEvent: false }
      }
      break

    case 'WA':
      if (fromSea || toSea) {
        return { timelineLabel: 'Waived', isOriginEvent: false }
      }
      break

    case 'SC':
      if (
        desc.includes('injured list') ||
        desc.includes('placed on the') ||
        desc.includes('placed on il')
      ) {
        return { timelineLabel: 'Placed on IL', isOriginEvent: false }
      }
      if (desc.includes('activated') || desc.includes('reinstated')) {
        return { timelineLabel: 'Activated from IL', isOriginEvent: false }
      }
      if (fromTeam && toSea) {
        return {
          timelineLabel: 'Selected',
          originStory: `Selected from ${fromTeam}`,
          isOriginEvent: true,
        }
      }
      break

    default:
      break
  }

  return null
}

export function buildOriginStories(transactions, limit = 2) {
  if (!transactions?.length) {
    return ['Joined the Mariners organization']
  }

  const originEvents = []

  for (const tx of transactions) {
    const classification = classifyTransaction(tx)
    if (!classification?.isOriginEvent || !classification.originStory) continue
    originEvents.push({ tx, classification })
  }

  originEvents.sort((a, b) => new Date(a.tx.date) - new Date(b.tx.date))

  const seenStories = new Set()
  const unique = []

  for (const event of originEvents) {
    const key = event.classification.originStory
    if (seenStories.has(key)) continue
    seenStories.add(key)
    unique.push(event)
  }

  if (unique.length === 0) {
    return ['Joined the Mariners organization']
  }

  return unique.slice(0, limit).map(({ tx, classification }) => {
    const when = formatMonthYear(tx.date)
    return `${classification.originStory}, ${when}.`
  })
}

export function buildOriginString(transactions) {
  const stories = buildOriginStories(transactions, 1)
  return stories[0] ?? 'Joined the Mariners organization'
}

export function buildMarinersHistoryTimeline(transactions) {
  if (!transactions?.length) return []

  const seen = new Set()
  const seenOnceLabels = new Set()
  const events = []

  for (const tx of transactions) {
    if (!involvesMariners(tx)) continue

    const classification = classifyTransaction(tx)
    if (!classification?.timelineLabel) continue

    const { timelineLabel } = classification

    if (ONCE_PER_CAREER_LABELS.has(timelineLabel)) {
      if (seenOnceLabels.has(timelineLabel)) continue
      seenOnceLabels.add(timelineLabel)
    }

    const dedupeKey = `${tx.date}|${timelineLabel}|${tx.description ?? ''}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    events.push({
      id: tx.id ?? dedupeKey,
      date: tx.date,
      label: timelineLabel,
      description: tx.description ?? timelineLabel,
    })
  }

  return events.sort((a, b) => new Date(a.date) - new Date(b.date))
}
