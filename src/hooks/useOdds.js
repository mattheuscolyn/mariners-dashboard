import { useState, useEffect } from 'react'
import { getMLBOdds } from '../services/oddsApi'
import { americanOddsToImpliedProb } from '../utils/statsUtils'

function extractSeattleOdds(gameData) {
  const h2hMarket = gameData.bookmakers?.[0]?.markets?.find((m) => m.key === 'h2h')
  if (!h2hMarket) return null

  const outcomes = h2hMarket.outcomes ?? []
  const homeOutcome = outcomes.find((o) => o.name === gameData.home_team)
  const awayOutcome = outcomes.find((o) => o.name === gameData.away_team)

  const seattleIsHome = gameData.home_team?.includes('Seattle')
  const seattleOutcome = seattleIsHome ? homeOutcome : awayOutcome
  const oppOutcome = seattleIsHome ? awayOutcome : homeOutcome

  if (!seattleOutcome) return null

  return {
    homeOdds: homeOutcome?.price ?? null,
    awayOdds: awayOutcome?.price ?? null,
    seattleOdds: seattleOutcome.price,
    oppOdds: oppOutcome?.price ?? null,
    impliedWinPct: americanOddsToImpliedProb(seattleOutcome.price),
    seattleIsHome,
  }
}

export function useOdds() {
  const apiKey = import.meta.env.VITE_ODDS_API_KEY
  const [odds, setOdds] = useState(null)
  const [loading, setLoading] = useState(!!apiKey)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!apiKey) {
      setOdds(null)
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()

    async function load() {
      try {
        const data = await getMLBOdds(apiKey, controller.signal)
        const seattleGame = data?.find(
          (g) =>
            g.home_team?.includes('Seattle') || g.away_team?.includes('Seattle'),
        )
        setOdds(seattleGame ? extractSeattleOdds(seattleGame) : null)
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Failed to load odds')
        }
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [apiKey])

  if (!apiKey) {
    return { odds: null, homeOdds: null, awayOdds: null, impliedWinPct: null, loading: false, error: null }
  }

  return {
    odds,
    homeOdds: odds?.homeOdds ?? null,
    awayOdds: odds?.awayOdds ?? null,
    impliedWinPct: odds?.impliedWinPct ?? null,
    seattleIsHome: odds?.seattleIsHome ?? true,
    loading,
    error,
  }
}
