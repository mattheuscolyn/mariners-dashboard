const BASE = 'https://statsapi.mlb.com/api/v1'
const MARINERS_ID = 136

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText} (${url})`)
  }

  return response.json()
}

export async function getSchedule(date, signal) {
  const dateStr = formatDate(date ?? new Date())
  const url = `${BASE}/schedule?sportId=1&date=${dateStr}&teamId=${MARINERS_ID}&hydrate=lineups,linescore,probablePitcher,team`
  const data = await fetchJson(url, signal)
  return data.dates ?? []
}

export async function getScheduleRange(startDate, endDate, signal) {
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  const url = `${BASE}/schedule?sportId=1&teamId=${MARINERS_ID}&startDate=${start}&endDate=${end}&hydrate=team,probablePitcher`
  const data = await fetchJson(url, signal)
  return data.dates ?? []
}

export async function getUpcomingSchedule(days = 7, signal) {
  const today = new Date()
  const end = addDays(today, days - 1)
  const dates = await getScheduleRange(today, end, signal)
  return dates.flatMap((d) => d.games ?? [])
}

export async function getNextGame(signal) {
  const today = new Date()
  const todaySchedule = await getSchedule(today, signal)
  const todayGames = todaySchedule[0]?.games ?? []

  if (todayGames.length > 0 && todayGames[0].status?.abstractGameState !== 'Final') {
    return todayGames[0]
  }

  const tomorrowSchedule = await getSchedule(addDays(today, 1), signal)
  const tomorrowGames = tomorrowSchedule[0]?.games ?? []

  if (tomorrowGames.length > 0) {
    return tomorrowGames[0]
  }

  return todayGames[0] ?? null
}

export async function getRoster(signal) {
  const url = `${BASE}/teams/${MARINERS_ID}/roster?rosterType=40Man&hydrate=person`
  const data = await fetchJson(url, signal)
  return data.roster ?? []
}

export async function getInjuries(signal) {
  const url = `${BASE}/teams/${MARINERS_ID}/roster?rosterType=40Man&hydrate=person`
  const data = await fetchJson(url, signal)
  const injured = (data.roster ?? []).filter(
    (p) =>
      p.status?.code === 'IL10' ||
      p.status?.code === 'IL60' ||
      p.status?.code === 'IL7' ||
      p.status?.description?.toLowerCase().includes('injured'),
  )
  return injured
}

export async function getPlayerStats(playerId, signal) {
  const url = `${BASE}/people/${playerId}/stats?stats=season&group=hitting&season=2025`
  const data = await fetchJson(url, signal)
  return data.stats ?? []
}

export async function getPlayerPitchingStats(playerId, signal) {
  const url = `${BASE}/people/${playerId}/stats?stats=season&group=pitching&season=2025`
  const data = await fetchJson(url, signal)
  return data.stats ?? []
}

export async function getPlayerGameLog(playerId, signal) {
  const url = `${BASE}/people/${playerId}/stats?stats=gameLog&group=hitting&season=2025`
  const data = await fetchJson(url, signal)
  return data.stats ?? []
}

export async function getPlayerInfo(playerId, signal) {
  const url = `${BASE}/people/${playerId}?hydrate=currentTeam,transactions`
  const data = await fetchJson(url, signal)
  return data.people?.[0] ?? null
}

export async function getTransactions(playerId, signal) {
  const url = `${BASE}/transactions?playerId=${playerId}&sportId=1`
  const data = await fetchJson(url, signal)
  return data.transactions ?? []
}

export async function getStandings(signal) {
  const url = `${BASE}/standings?leagueId=103&season=2025&hydrate=team`
  const data = await fetchJson(url, signal)
  return data.records ?? []
}

export async function getTeamRoster(teamId, signal) {
  const url = `${BASE}/teams/${teamId}/roster?rosterType=active&hydrate=person`
  const data = await fetchJson(url, signal)
  return data.roster ?? []
}

export async function getTeamInjuries(teamId, signal) {
  const url = `${BASE}/teams/${teamId}/roster?rosterType=injured_list&hydrate=person`
  const data = await fetchJson(url, signal)
  return data.roster ?? []
}

export async function getPlayerPitchingGameLog(playerId, signal) {
  const url = `${BASE}/people/${playerId}/stats?stats=gameLog&group=pitching&season=2025`
  const data = await fetchJson(url, signal)
  return data.stats ?? []
}

export async function getSeasonSchedule(signal) {
  const url = `${BASE}/schedule?sportId=1&season=2025&teamId=${MARINERS_ID}&hydrate=team,linescore`
  const data = await fetchJson(url, signal)
  return data.dates?.flatMap((d) => d.games ?? []) ?? []
}

export async function getSeasonGameLogs(teamId = MARINERS_ID, signal) {
  const year = new Date().getFullYear()
  const url = `${BASE}/schedule?sportId=1&teamId=${teamId}&season=${year}&gameType=R&hydrate=lineups`
  const data = await fetchJson(url, signal)
  return data.dates ?? []
}

export async function getPlayerCareerHittingStats(playerId, signal) {
  const url = `${BASE}/people/${playerId}/stats?stats=career&group=hitting`
  const data = await fetchJson(url, signal)
  return data.stats ?? []
}

export async function getPlayerCareerPitchingStats(playerId, signal) {
  const url = `${BASE}/people/${playerId}/stats?stats=career&group=pitching`
  const data = await fetchJson(url, signal)
  return data.stats ?? []
}

export { MARINERS_ID }
