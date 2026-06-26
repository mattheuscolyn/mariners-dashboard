export const MIN_ALSO_PLAYS_STARTS = 3

export function buildPositionalDataFromLogs(dates, teamId) {
  const counts = {}

  for (const date of dates ?? []) {
    for (const game of date.games ?? []) {
      const isHome = game.teams?.home?.team?.id === teamId
      const lineupKey = isHome ? 'homePlayers' : 'awayPlayers'
      const players = game.lineups?.[lineupKey] ?? []

      for (const player of players) {
        const pos =
          player.position?.abbreviation ?? player.primaryPosition?.abbreviation
        const id = player.id ?? player.person?.id
        const name = player.fullName ?? player.person?.fullName
        if (!pos || !id || pos === 'P') continue

        if (!counts[pos]) counts[pos] = {}
        if (!counts[pos][id]) counts[pos][id] = { fullName: name, count: 0 }
        counts[pos][id].count++
      }
    }
  }

  const baseline = {}
  const playerPositionStarts = {}

  for (const [pos, players] of Object.entries(counts)) {
    const sorted = Object.entries(players).sort((a, b) => b[1].count - a[1].count)
    const [topId, topData] = sorted[0]
    baseline[pos] = {
      playerId: Number(topId),
      fullName: topData.fullName,
      gamesStarted: topData.count,
    }

    for (const [id, data] of Object.entries(players)) {
      const playerId = Number(id)
      if (!playerPositionStarts[playerId]) playerPositionStarts[playerId] = []
      playerPositionStarts[playerId].push({
        position: pos,
        gamesStarted: data.count,
      })
    }
  }

  for (const starts of Object.values(playerPositionStarts)) {
    starts.sort((a, b) => b.gamesStarted - a.gamesStarted)
  }

  return { baseline, playerPositionStarts }
}

export function getAlternatePositions(
  playerId,
  todayPosition,
  playerPositionStarts,
  minStarts = MIN_ALSO_PLAYS_STARTS,
) {
  if (!playerId || !todayPosition) return []

  const starts = playerPositionStarts?.[playerId] ?? []
  return starts
    .filter(
      ({ position, gamesStarted }) =>
        position !== todayPosition && gamesStarted >= minStarts,
    )
    .sort((a, b) => b.gamesStarted - a.gamesStarted)
    .slice(0, 3)
}
