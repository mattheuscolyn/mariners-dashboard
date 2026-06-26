import { useState, useEffect } from 'react'
import {
  getPlayerCareerHittingStats,
  getPlayerYearByYearHittingStats,
} from '../services/mlbApi'

function firstSeasonWithTeam(splits, teamId) {
  const seasons = splits
    .filter((s) => s.team?.id === teamId && s.season)
    .map((s) => parseInt(s.season, 10))
    .filter((y) => !Number.isNaN(y))
  return seasons.length > 0 ? Math.min(...seasons) : null
}

export function usePlayerPopoverTenure(playerId, teamId, rosterSince, isOpen) {
  const [sinceYear, setSinceYear] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !playerId || !teamId) {
      return undefined
    }

    if (rosterSince) {
      const year = new Date(rosterSince).getFullYear()
      if (!Number.isNaN(year)) {
        setSinceYear(year)
        return undefined
      }
    }

    const controller = new AbortController()
    setLoading(true)

    async function load() {
      try {
        const [careerData, yearByYearData] = await Promise.all([
          getPlayerCareerHittingStats(playerId, controller.signal),
          getPlayerYearByYearHittingStats(playerId, controller.signal),
        ])

        const careerSplits = careerData?.[0]?.splits ?? []
        const onTeam = careerSplits.some((s) => s.team?.id === teamId)

        if (!onTeam) {
          setSinceYear(null)
          return
        }

        const yearSplits = yearByYearData?.[0]?.splits ?? []
        setSinceYear(firstSeasonWithTeam(yearSplits, teamId))
      } catch {
        setSinceYear(null)
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [isOpen, playerId, teamId, rosterSince])

  return { sinceYear, loading }
}
