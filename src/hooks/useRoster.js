import { useState, useEffect } from 'react'
import { getRoster, getInjuries } from '../services/mlbApi'
import { normalizeRosterEntry } from '../utils/gameUtils'

export function useRoster() {
  const [roster, setRoster] = useState([])
  const [injuredList, setInjuredList] = useState([])
  const [jerseyMap, setJerseyMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const [rosterData, injuryData] = await Promise.all([
          getRoster(controller.signal),
          getInjuries(controller.signal),
        ])

        const map = {}
        rosterData.forEach((p) => {
          if (p.person?.id) {
            map[p.person.id] = p.jerseyNumber ?? p.person?.primaryNumber ?? null
          }
        })

        setJerseyMap(map)
        setRoster(rosterData.map(normalizeRosterEntry))
        setInjuredList(injuryData.map((e) => normalizeRosterEntry(e, { isInjuryList: true })))
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Failed to load roster')
        }
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return { roster, injuredList, jerseyMap, loading, error }
}
