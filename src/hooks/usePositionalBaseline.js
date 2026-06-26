import { useState, useEffect } from 'react'
import { getSeasonGameLogs, MARINERS_ID } from '../services/mlbApi'
import { useMockBaselineContext } from './useMockData'
import { buildPositionalDataFromLogs } from '../utils/positionalBaselineUtils'

let sessionCache = null
let sessionPromise = null

async function fetchPositionalBaseline() {
  const dates = await getSeasonGameLogs(MARINERS_ID)
  return buildPositionalDataFromLogs(dates, MARINERS_ID)
}

export function usePositionalBaseline() {
  const mockData = useMockBaselineContext()
  const [baseline, setBaseline] = useState(
    mockData?.baseline ?? sessionCache?.baseline ?? {},
  )
  const [playerPositionStarts, setPlayerPositionStarts] = useState(
    mockData?.playerPositionStarts ?? sessionCache?.playerPositionStarts ?? {},
  )
  const [loading, setLoading] = useState(mockData ? false : !sessionCache)

  useEffect(() => {
    if (mockData) {
      setBaseline(mockData.baseline ?? {})
      setPlayerPositionStarts(mockData.playerPositionStarts ?? {})
      setLoading(false)
      return undefined
    }

    if (sessionCache) {
      setBaseline(sessionCache.baseline)
      setPlayerPositionStarts(sessionCache.playerPositionStarts)
      setLoading(false)
      return undefined
    }

    if (!sessionPromise) {
      sessionPromise = fetchPositionalBaseline()
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
        setBaseline(data.baseline)
        setPlayerPositionStarts(data.playerPositionStarts)
      })
      .catch((e) => {
        if (!active) return
        console.error('usePositionalBaseline error:', e)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [mockData])

  return { baseline, playerPositionStarts, loading }
}
