import { useState, useEffect, useMemo } from 'react'
import { getTransactions } from '../services/mlbApi'
import { buildOriginString } from '../utils/lineupUtils'

export function usePlayerOrigin(playerId, delay = 0) {
  const [origin, setOrigin] = useState('')
  const [transactions, setTransactions] = useState([])
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
        const txs = await getTransactions(playerId, controller.signal)
        setTransactions(txs)
        setOrigin(buildOriginString(txs))
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Failed to load player origin')
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
  }, [playerId, delay])

  return { origin, transactions, loading, error }
}
