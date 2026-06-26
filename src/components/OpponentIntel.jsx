import { useState, useEffect, useMemo } from 'react'
import Card from './Card'
import StatBadge from './StatBadge'
import LoadingSpinner from './LoadingSpinner'
import { usePlayerProfile } from '../context/PlayerProfileContext'
import {
  getTeamRoster,
  getTeamInjuries,
  getSeasonSchedule,
  getPlayerStats,
  MARINERS_ID,
} from '../services/mlbApi'
import { getOpponentTeam, getOpponentLineup, normalizeRosterEntry } from '../utils/gameUtils'
import { parseHittingStat, computeOPS, formatAvg } from '../utils/statsUtils'
import './OpponentIntel.css'

async function fetchHitterStats(roster, signal) {
  const hitters = roster.filter((p) => p.position !== 'P').slice(0, 15)
  const statsPromises = hitters.map(async (player) => {
    try {
      const data = await getPlayerStats(player.id, signal)
      const stat = parseHittingStat(data)
      return { ...player, stat, ops: computeOPS(stat) }
    } catch {
      return null
    }
  })

  const results = (await Promise.all(statsPromises)).filter(Boolean)
  return results.sort((a, b) => b.ops - a.ops)
}

function buildFullLineup(game, allHitters) {
  const statsById = Object.fromEntries(allHitters.map((h) => [h.id, h]))
  const oppLineup = getOpponentLineup(game).filter((p) => p.position !== 'P')

  if (oppLineup.length > 0) {
    return oppLineup.slice(0, 9).map((player) => {
      const withStats = statsById[player.id]
      return {
        id: player.id,
        fullName: player.fullName,
        position: player.position,
        stat: withStats?.stat ?? null,
        batOrder: player.batOrder,
      }
    })
  }

  return allHitters.slice(0, 9).map((h) => ({
    id: h.id,
    fullName: h.fullName,
    position: h.position,
    stat: h.stat,
  }))
}

function formatRate(stat, field) {
  if (!stat || stat[field] == null) return '—'
  return formatAvg(parseFloat(stat[field]))
}

function computeHeadToHead(games, opponentId) {
  let wins = 0
  let losses = 0

  for (const g of games) {
    const homeId = g.teams?.home?.team?.id
    const awayId = g.teams?.away?.team?.id
    if (homeId !== opponentId && awayId !== opponentId) continue
    if (g.status?.abstractGameState !== 'Final') continue

    const marinersHome = homeId === MARINERS_ID
    const marinersScore = marinersHome
      ? g.teams?.home?.score
      : g.teams?.away?.score
    const oppScore = marinersHome
      ? g.teams?.away?.score
      : g.teams?.home?.score

    if (marinersScore == null || oppScore == null) continue
    if (marinersScore > oppScore) wins++
    else losses++
  }

  return { wins, losses, label: `${wins}–${losses}` }
}

function HitterNameButton({ playerId, name }) {
  const { openPlayerProfile } = usePlayerProfile()
  return (
    <button
      type="button"
      className="opponent-intel__hitter-btn"
      onClick={() => openPlayerProfile(playerId)}
    >
      {name}
    </button>
  )
}

function OpponentIntel({ game }) {
  const opponent = getOpponentTeam(game)
  const [allHitters, setAllHitters] = useState([])
  const [injuredList, setInjuredList] = useState([])
  const [headToHead, setHeadToHead] = useState(null)
  const [lineupExpanded, setLineupExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const topHitters = useMemo(() => allHitters.slice(0, 3), [allHitters])
  const fullLineup = useMemo(
    () => buildFullLineup(game, allHitters),
    [game, allHitters],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const [rosterData, injuryData, seasonGames] = await Promise.all([
          getTeamRoster(opponent.id, controller.signal),
          getTeamInjuries(opponent.id, controller.signal),
          getSeasonSchedule(controller.signal),
        ])

        const roster = rosterData.map(normalizeRosterEntry)
        setInjuredList(injuryData.map(normalizeRosterEntry))
        setHeadToHead(computeHeadToHead(seasonGames, opponent.id))

        const hitters = await fetchHitterStats(roster, controller.signal)
        setAllHitters(hitters)
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Failed to load opponent intel')
        }
      } finally {
        setLoading(false)
      }
    }

    if (opponent.id) load()
    return () => controller.abort()
  }, [opponent.id])

  if (loading) return <LoadingSpinner />
  if (error) {
    return (
      <Card className="opponent-intel">
        <p className="opponent-intel__error">{error}</p>
      </Card>
    )
  }

  return (
    <Card className="opponent-intel">
      <h2 className="opponent-intel__title">
        {opponent.city} {opponent.name}{' '}
        <span className="opponent-intel__record">({opponent.record.label})</span>
      </h2>

      <section className="opponent-intel__section">
        <h3 className="opponent-intel__subtitle">Key bats</h3>
        {topHitters.length > 0 ? (
          <div className="opponent-intel__hitters">
            {topHitters.map((h) => (
              <div key={h.id} className="opponent-intel__hitter">
                <HitterNameButton playerId={h.id} name={h.fullName} />
                <div className="opponent-intel__hitter-stats">
                  <StatBadge label="AVG" value={formatAvg(parseFloat(h.stat.avg ?? 0))} />
                  <StatBadge label="HR" value={h.stat.homeRuns ?? 0} />
                  <StatBadge label="OPS" value={h.ops.toFixed(3)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="opponent-intel__empty">Stats unavailable</p>
        )}

        {fullLineup.length > 0 && (
          <div className="opponent-intel__full-lineup">
            <button
              type="button"
              className="opponent-intel__lineup-toggle"
              onClick={() => setLineupExpanded((open) => !open)}
              aria-expanded={lineupExpanded}
            >
              {lineupExpanded ? 'Hide ↑' : 'Show full lineup ↓'}
            </button>
            {lineupExpanded && (
              <ol className="opponent-intel__lineup">
                {fullLineup.map((player, index) => (
                  <li key={player.id ?? index} className="opponent-intel__lineup-row">
                    <div className="opponent-intel__lineup-player">
                      {player.id ? (
                        <HitterNameButton playerId={player.id} name={player.fullName} />
                      ) : (
                        <span className="opponent-intel__lineup-name">{player.fullName}</span>
                      )}
                      <span className="opponent-intel__lineup-pos">{player.position}</span>
                    </div>
                    <div className="opponent-intel__lineup-stats">
                      <StatBadge label="AVG" value={formatRate(player.stat, 'avg')} />
                      <StatBadge label="OBP" value={formatRate(player.stat, 'obp')} />
                      <StatBadge label="SLG" value={formatRate(player.stat, 'slg')} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </section>

      <section className="opponent-intel__section">
        <h3 className="opponent-intel__subtitle">Injury report</h3>
        {injuredList.length > 0 ? (
          <ul className="opponent-intel__injuries">
            {injuredList.map((p) => (
              <li key={p.id}>
                {p.fullName} — {p.position}
              </li>
            ))}
          </ul>
        ) : (
          <p className="opponent-intel__empty">No significant IL entries.</p>
        )}
      </section>

      {headToHead && (
        <section className="opponent-intel__section">
          <h3 className="opponent-intel__subtitle">Head-to-head vs SEA (2025)</h3>
          <p className="opponent-intel__h2h">
            Mariners {headToHead.wins}–{headToHead.losses} vs {opponent.name}
          </p>
        </section>
      )}
    </Card>
  )
}

export default OpponentIntel
