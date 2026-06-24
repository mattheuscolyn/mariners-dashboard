import { useState, useEffect } from 'react'
import {
  getPlayerStats,
  getPlayerPitchingStats,
  getPlayerGameLog,
  getPlayerPitchingGameLog,
} from '../services/mlbApi'
import {
  parseHittingStat,
  parsePitchingStat,
  parseGameLogSplits,
  aggregateHittingStats,
  summarizeLastStarts,
} from '../utils/statsUtils'

function computeTrend(recentValue, seasonValue) {
  if (
    recentValue === null ||
    seasonValue === null ||
    seasonValue === 0 ||
    Number.isNaN(recentValue) ||
    Number.isNaN(seasonValue)
  ) {
    return 'neutral'
  }
  if (recentValue > seasonValue * 1.15) return 'hot'
  if (recentValue < seasonValue * 0.85) return 'cold'
  return 'neutral'
}

function computePitcherTrend(recentERA, seasonERA) {
  if (
    recentERA === null ||
    seasonERA === null ||
    seasonERA === 0 ||
    Number.isNaN(recentERA) ||
    Number.isNaN(seasonERA)
  ) {
    return 'neutral'
  }
  if (recentERA < seasonERA * 0.85) return 'hot'
  if (recentERA > seasonERA * 1.15) return 'cold'
  return 'neutral'
}

export function usePlayerStats(playerId, position, delay = 0) {
  const [seasonStats, setSeasonStats] = useState(null)
  const [recentStats, setRecentStats] = useState(null)
  const [trend, setTrend] = useState('neutral')
  const [recentStartsSummary, setRecentStartsSummary] = useState('')
  const [recentGameSplits, setRecentGameSplits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!playerId) {
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    let timeoutId

    async function load() {
      try {
        if (position === 'pitcher') {
          const [seasonData, gameLogData] = await Promise.all([
            getPlayerPitchingStats(playerId, controller.signal),
            getPlayerPitchingGameLog(playerId, controller.signal),
          ])
          const seasonStat = parsePitchingStat(seasonData)
          const splits = parseGameLogSplits(gameLogData)
          const recentStarts = splits.slice(-2)

          const recentERA =
            recentStarts.length > 0
              ? recentStarts.reduce((sum, s) => {
                  const era = parseFloat(s.stat?.era)
                  return sum + (Number.isNaN(era) ? 0 : era)
                }, 0) / recentStarts.length
              : null

          const seasonERA = parseFloat(seasonData?.[0]?.splits?.[0]?.stat?.era) ?? null

          setSeasonStats(seasonStat)
          setRecentStats(recentStarts)
          setRecentGameSplits([])
          setTrend(computePitcherTrend(recentERA, seasonERA))
          setRecentStartsSummary(summarizeLastStarts(splits, 3))
        } else {
          const [seasonData, gameLogData] = await Promise.all([
            getPlayerStats(playerId, controller.signal),
            getPlayerGameLog(playerId, controller.signal),
          ])
          const seasonStat = parseHittingStat(seasonData)
          const splits = parseGameLogSplits(gameLogData)
          const recentSplits = gameLogData?.[0]?.splits?.slice(-7) ?? []

          const recentOPS =
            recentSplits.length > 0
              ? recentSplits.reduce((sum, s) => {
                  const ops = parseFloat(s.stat?.ops)
                  return sum + (Number.isNaN(ops) ? 0 : ops)
                }, 0) / recentSplits.length
              : null

          const seasonOPS =
            parseFloat(seasonData?.[0]?.splits?.[0]?.stat?.ops) ?? null

          const recentAgg = aggregateHittingStats(recentSplits)
          const lastSeven = [...splits]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7)
            .reverse()

          setSeasonStats(seasonStat)
          setRecentStats(recentAgg)
          setRecentGameSplits(lastSeven)
          setTrend(computeTrend(recentOPS, seasonOPS))
          setRecentStartsSummary('')
        }
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Failed to load player stats')
        }
      } finally {
        setLoading(false)
      }
    }

    if (delay > 0) {
      timeoutId = setTimeout(load, delay)
    } else {
      load()
    }

    return () => {
      controller.abort()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [playerId, position, delay])

  return {
    seasonStats,
    recentStats,
    recentGameSplits,
    trend,
    recentStartsSummary,
    loading,
    error,
  }
}
