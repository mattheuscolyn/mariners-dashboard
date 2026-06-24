import { isPitcher } from '../data/positions'

const POSITION_FILTERS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP']

export function matchesPositionFilter(playerPosition, filter) {
  if (filter === 'All') return true
  if (filter === 'OF') {
    return ['LF', 'CF', 'RF', 'OF'].includes(playerPosition)
  }
  if (filter === 'SP') {
    return ['SP', 'P'].includes(playerPosition)
  }
  if (filter === 'RP') {
    return ['RP', 'CL'].includes(playerPosition)
  }
  return playerPosition === filter
}

export function matchesStatusFilter(player, filter, injuredIds) {
  if (filter === 'All') return true
  if (filter === 'Active') {
    return player.statusCategory === 'active' && !injuredIds.has(player.id)
  }
  if (filter === 'IL') {
    return injuredIds.has(player.id) || player.statusCategory.startsWith('il')
  }
  if (filter === 'Options') {
    return player.statusCategory === 'optioned'
  }
  return true
}

export function filterRoster(players, { positions, statusFilter, injuredIds }) {
  return players.filter((player) => {
    const posMatch =
      positions.length === 0 ||
      positions.some((f) => matchesPositionFilter(player.position, f))
    const statusMatch = matchesStatusFilter(player, statusFilter, injuredIds)
    return posMatch && statusMatch
  })
}

export function sortRoster(players, sortBy) {
  const sorted = [...players]

  switch (sortBy) {
    case 'jersey':
      return sorted.sort(
        (a, b) =>
          parseInt(a.jerseyNumber, 10) - parseInt(b.jerseyNumber, 10),
      )
    case 'position':
      return sorted.sort((a, b) => a.position.localeCompare(b.position))
    case 'status':
      return sorted.sort((a, b) => a.status.localeCompare(b.status))
    case 'name':
    default:
      return sorted.sort((a, b) => a.fullName.localeCompare(b.fullName))
  }
}

export function getPlayerType(position) {
  return isPitcher(position) ? 'pitcher' : 'hitter'
}

export { POSITION_FILTERS }
