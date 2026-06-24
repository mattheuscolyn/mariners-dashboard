import { MARINERS_ID } from '../services/mlbApi'

export function normalizeStatus(rawGame) {
  const abstract = rawGame.status?.abstractGameState ?? ''
  const detailed = rawGame.status?.detailedState ?? ''

  if (abstract === 'Live' || detailed === 'In Progress') return 'In Progress'
  if (abstract === 'Final') return 'Final'
  if (abstract === 'Preview') return 'Scheduled'
  return detailed || abstract || 'Scheduled'
}

function parseRecord(team) {
  const wins = team?.leagueRecord?.wins ?? team?.record?.wins ?? 0
  const losses = team?.leagueRecord?.losses ?? team?.record?.losses ?? 0
  return { wins, losses, label: `${wins}–${losses}` }
}

function normalizePitcher(pitcher) {
  if (!pitcher?.id) return null
  return {
    id: pitcher.id,
    fullName: pitcher.fullName,
    initials: pitcher.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
}

function normalizeLineupPlayer(entry, order) {
  const person = entry.person ?? entry.batter ?? entry
  const position = entry.position?.abbreviation ?? entry.pos?.abbreviation ?? entry.position ?? '—'
  return {
    id: person?.id ?? entry.id,
    fullName: person?.fullName ?? entry.fullName ?? 'TBD',
    jerseyNumber: entry.jerseyNumber ?? person?.primaryNumber ?? '—',
    position,
    batOrder: entry.battingOrder ?? entry.batOrder ?? order,
  }
}

function parseLineups(rawGame) {
  const homeId = rawGame.teams?.home?.team?.id
  const awayId = rawGame.teams?.away?.team?.id
  const empty = { home: [], away: [] }

  if (!rawGame.lineups) return empty

  if (Array.isArray(rawGame.lineups)) {
    const homeLineup = rawGame.lineups.find((l) => l.teamId === homeId || l.id === homeId)
    const awayLineup = rawGame.lineups.find((l) => l.teamId === awayId || l.id === awayId)

    const mapPlayers = (lineup) => {
      const players = lineup?.battingOrder ?? lineup?.players ?? []
      return players.map((p, i) => normalizeLineupPlayer(p, i + 1))
    }

    return {
      home: mapPlayers(homeLineup),
      away: mapPlayers(awayLineup),
    }
  }

  const homePlayers = rawGame.lineups.homePlayers ?? rawGame.lineups.home?.players ?? []
  const awayPlayers = rawGame.lineups.awayPlayers ?? rawGame.lineups.away?.players ?? []

  return {
    home: homePlayers.map((p, i) => normalizeLineupPlayer(p, i + 1)),
    away: awayPlayers.map((p, i) => normalizeLineupPlayer(p, i + 1)),
  }
}

function parseLinescore(rawGame) {
  const ls = rawGame.linescore
  if (!ls) return null

  return {
    currentInning: ls.currentInning ?? ls.inning,
    inningState: ls.inningState ?? ls.inningHalf,
    home: {
      runs: ls.teams?.home?.runs ?? rawGame.teams?.home?.score ?? 0,
      hits: ls.teams?.home?.hits ?? 0,
      errors: ls.teams?.home?.errors ?? 0,
    },
    away: {
      runs: ls.teams?.away?.runs ?? rawGame.teams?.away?.score ?? 0,
      hits: ls.teams?.away?.hits ?? 0,
      errors: ls.teams?.away?.errors ?? 0,
    },
  }
}

function normalizeTeam(side, rawGame) {
  const team = rawGame.teams?.[side]?.team ?? {}
  return {
    id: team.id,
    name: team.name ?? team.teamName ?? '',
    city: team.locationName ?? team.franchiseName ?? '',
    abbreviation: team.abbreviation ?? '',
    record: parseRecord(rawGame.teams?.[side]),
    isMariners: team.id === MARINERS_ID,
    score: rawGame.teams?.[side]?.score ?? 0,
  }
}

export function normalizeGame(rawGame) {
  if (!rawGame) return null

  const probable = rawGame.probablePitchers ?? {}

  return {
    gameId: rawGame.gamePk,
    status: normalizeStatus(rawGame),
    rawStatus: rawGame.status,
    gameDate: rawGame.gameDate,
    venue: rawGame.venue?.name ?? 'TBD',
    homeTeam: normalizeTeam('home', rawGame),
    awayTeam: normalizeTeam('away', rawGame),
    probablePitchers: {
      home: normalizePitcher(probable.home ?? rawGame.teams?.home?.probablePitcher),
      away: normalizePitcher(probable.away ?? rawGame.teams?.away?.probablePitcher),
    },
    lineups: parseLineups(rawGame),
    linescore: parseLinescore(rawGame),
    isHome: rawGame.teams?.home?.team?.id === MARINERS_ID,
  }
}

export function getMarinersTeam(game) {
  return game.homeTeam.isMariners ? game.homeTeam : game.awayTeam
}

export function getOpponentTeam(game) {
  return game.homeTeam.isMariners ? game.awayTeam : game.homeTeam
}

export function getMarinersLineup(game) {
  return game.isHome ? game.lineups.home : game.lineups.away
}

export function getOpponentLineup(game) {
  return game.isHome ? game.lineups.away : game.lineups.home
}

export function getMarinersPitcher(game) {
  return game.isHome ? game.probablePitchers.home : game.probablePitchers.away
}

export function getOpponentPitcher(game) {
  return game.isHome ? game.probablePitchers.away : game.probablePitchers.home
}

export function formatGameTimePT(isoDate) {
  const date = new Date(isoDate)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    hour12: true,
  })
}

export function getDayLabel(isoDate) {
  const gameDay = new Date(isoDate)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const gameDayStr = gameDay.toDateString()
  if (gameDayStr === today.toDateString()) return 'Today'
  if (gameDayStr === tomorrow.toDateString()) return 'Tomorrow'

  return gameDay.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  })
}

export function getTimeOfDayLabel(isoDate) {
  const hour = parseInt(
    new Date(isoDate).toLocaleString('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Los_Angeles',
    }),
    10,
  )
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function getWatchForHeader(isoDate) {
  const timeOfDay = getTimeOfDayLabel(isoDate)
  if (timeOfDay === 'morning') return 'What to watch for this morning'
  if (timeOfDay === 'afternoon') return 'What to watch for this afternoon'
  return 'What to watch for tonight'
}

export function isSameCalendarDay(isoDate) {
  return new Date(isoDate).toDateString() === new Date().toDateString()
}

export function getExpectedLineupTime(isoDate) {
  const gameTime = new Date(isoDate)
  const lineupTime = new Date(gameTime.getTime() - 2.5 * 60 * 60 * 1000)
  return lineupTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    hour12: true,
  })
}

export function normalizeRosterEntry(entry, { isInjuryList = false } = {}) {
  const person = entry.person ?? {}
  const statusCode = entry.status?.code ?? ''
  const statusDesc = entry.status?.description ?? 'Active'

  return {
    id: person.id,
    fullName: person.fullName ?? '',
    position: entry.position?.abbreviation ?? person.primaryPosition?.abbreviation ?? '—',
    jerseyNumber: person.primaryNumber ?? entry.jerseyNumber ?? '—',
    status: statusDesc,
    statusCode,
    statusCategory: categorizeRosterStatus(statusCode, statusDesc),
    since: entry.startDate ?? entry.rosterEntryDate ?? null,
    injuryDescription: isInjuryList
      ? (entry.notes ?? entry.description ?? statusDesc)
      : null,
    debutDate: person.mlbDebutDate ?? null,
  }
}

export function categorizeRosterStatus(code, desc) {
  const lower = (desc ?? '').toLowerCase()
  const c = (code ?? '').toUpperCase()

  if (c.includes('10') || lower.includes('10-day')) return 'il10'
  if (c.includes('60') || lower.includes('60-day')) return 'il60'
  if (lower.includes('injured') || c.startsWith('D')) return 'il'
  if (lower.includes('option') || c === 'MIN' || lower.includes('minor')) return 'optioned'
  return 'active'
}

export function getStatusBadgeLabel(category, statusDesc) {
  if (category === 'il10') return '10-Day IL'
  if (category === 'il60') return '60-Day IL'
  if (category === 'il') return statusDesc?.includes('IL') ? statusDesc : 'IL'
  if (category === 'optioned') return 'Optioned'
  return 'Active'
}

export function formatSinceDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}
