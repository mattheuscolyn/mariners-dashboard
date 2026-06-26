import { useState, useEffect } from 'react'
import { getLeagueSeasonStats } from '../services/mlbApi'
import { buildLeagueDistributions } from '../utils/leagueContextUtils'

let sessionCache = null
let sessionPromise = null

async function fetchLeagueAverages() {
  const [hittingSplits, pitchingSplits] = await Promise.all([
    getLeagueSeasonStats('hitting'),
    getLeagueSeasonStats('pitching'),
  ])
  return buildLeagueDistributions(hittingSplits, pitchingSplits)
}

export function useLeagueAverages() {
  const [averages, setAverages] = useState(sessionCache)
  const [loading, setLoading] = useState(!sessionCache)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (sessionCache) {
      setAverages(sessionCache)
      setLoading(false)
      return undefined
    }

    if (!sessionPromise) {
      sessionPromise = fetchLeagueAverages()
        .then((data) => {
          sessionCache = data
          return data
        })
        .catch((err) => {
          sessionPromise = null
          throw err
        })
    }

    let active = true

    sessionPromise
      .then((data) => {
        if (!active) return
        setAverages(data)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message ?? 'Failed to load league averages')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { averages, loading, error }
}
