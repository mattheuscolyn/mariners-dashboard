import { useState, useEffect, useCallback } from 'react'
import { getNextGame, getUpcomingSchedule } from '../services/mlbApi'
import { normalizeGame, isSameCalendarDay } from '../utils/gameUtils'

const POLL_INTERVAL_MS = 5 * 60 * 1000
const OFFSEASON_THRESHOLD_DAYS = 14

function daysUntil(isoDate) {
  return (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
}

export function useNextGame() {
  const [game, setGame] = useState(null)
  const [upcomingSchedule, setUpcomingSchedule] = useState([])
  const [offDay, setOffDay] = useState(false)
  const [offseason, setOffseason] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGame = useCallback(async (signal) => {
    try {
      const raw = await getNextGame(signal)

      if (raw) {
        setGame(normalizeGame(raw))
        setOffDay(false)
        setOffseason(false)
        setUpcomingSchedule([])
      } else {
        setGame(null)
        const upcoming = await getUpcomingSchedule(7, signal)
        const futureGames = upcoming.filter(
          (g) => g.status?.abstractGameState !== 'Final',
        )
        setUpcomingSchedule(futureGames)

        const nextGame = futureGames[0]
        if (!nextGame) {
          setOffseason(true)
          setOffDay(false)
        } else {
          const days = daysUntil(nextGame.gameDate)
          setOffseason(days > OFFSEASON_THRESHOLD_DAYS)
          setOffDay(days <= OFFSEASON_THRESHOLD_DAYS)
        }
      }
      setError(null)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Failed to load game data')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchGame(controller.signal)
    return () => controller.abort()
  }, [fetchGame])

  useEffect(() => {
    if (!game || game.status !== 'In Progress') return
    if (!isSameCalendarDay(game.gameDate)) return

    const interval = setInterval(() => {
      const controller = new AbortController()
      fetchGame(controller.signal)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [game?.gameId, game?.status, game?.gameDate, fetchGame])

  return { game, upcomingSchedule, offDay, offseason, loading, error }
}
