import { useState, useEffect } from 'react'
import { getSeasonGameLogs, MARINERS_ID } from '../services/mlbApi'
import { useMockBaselineContext } from './useMockData'

export function usePositionalBaseline() {
  const mockBaseline = useMockBaselineContext()
  const [baseline, setBaseline] = useState(mockBaseline ?? {})
  const [loading, setLoading] = useState(!mockBaseline)

  useEffect(() => {
    if (mockBaseline) {
      setBaseline(mockBaseline)
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()

    async function build() {
      try {
        const dates = await getSeasonGameLogs(MARINERS_ID, controller.signal)
        const counts = {}

        for (const date of dates) {
          for (const game of date.games ?? []) {
            const isHome = game.teams?.home?.team?.id === MARINERS_ID
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

        const result = {}
        for (const [pos, players] of Object.entries(counts)) {
          const [topId, topData] = Object.entries(players).sort(
            (a, b) => b[1].count - a[1].count,
          )[0]
          result[pos] = {
            playerId: Number(topId),
            fullName: topData.fullName,
            gamesStarted: topData.count,
          }
        }

        setBaseline(result)
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('usePositionalBaseline error:', e)
        }
      } finally {
        setLoading(false)
      }
    }

    build()
    return () => controller.abort()
  }, [mockBaseline])

  return { baseline, loading }
}
