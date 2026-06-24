import { useMemo } from 'react'
import Card from './Card'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { usePositionalBaseline } from '../hooks/usePositionalBaseline'
import {
  getMarinersLineup,
  getOpponentLineup,
  getMarinersPitcher,
  getWatchForHeader,
} from '../utils/gameUtils'
import { getExplainerText } from '../utils/lineupUtils'
import { formatERA, formatAvg } from '../utils/statsUtils'
import './WatchFor.css'

function isValidLineupNote(note) {
  return note && !note.includes('at —') && !note.includes('undefined')
}

function useHotHitterBullet(lineup) {
  const players = lineup.slice(0, 9)
  const stats0 = usePlayerStats(players[0]?.id, 'hitter', 0)
  const stats1 = usePlayerStats(players[1]?.id, 'hitter', 200)
  const stats2 = usePlayerStats(players[2]?.id, 'hitter', 400)
  const stats3 = usePlayerStats(players[3]?.id, 'hitter', 600)
  const stats4 = usePlayerStats(players[4]?.id, 'hitter', 800)
  const allStats = [stats0, stats1, stats2, stats3, stats4]

  return useMemo(() => {
    for (let i = 0; i < players.length && i < allStats.length; i++) {
      const { trend, recentStats } = allStats[i]
      if (trend === 'hot' && recentStats) {
        const avg = recentStats.avg != null ? formatAvg(recentStats.avg) : '—'
        const hr = recentStats.homeRuns ?? 0
        return `${players[i].fullName} is on a tear — batting ${avg} over the last 7 games with ${hr} home run${hr !== 1 ? 's' : ''}. Keep an eye on their at-bats.`
      }
    }
    return null
  }, [
    players,
    stats0.trend, stats0.recentStats,
    stats1.trend, stats1.recentStats,
    stats2.trend, stats2.recentStats,
    stats3.trend, stats3.recentStats,
    stats4.trend, stats4.recentStats,
  ])
}

function useOpponentThreat(lineup) {
  const players = lineup.slice(0, 3)
  const s0 = usePlayerStats(players[0]?.id, 'hitter', 1000)
  const s1 = usePlayerStats(players[1]?.id, 'hitter', 1200)
  const s2 = usePlayerStats(players[2]?.id, 'hitter', 1400)

  return useMemo(() => {
    const candidates = [
      { player: players[0], stats: s0 },
      { player: players[1], stats: s1 },
      { player: players[2], stats: s2 },
    ].filter((c) => c.player?.id && c.stats.seasonStats)

    if (candidates.length === 0) return null

    const best = candidates.reduce((a, b) => {
      const opsA = parseFloat(a.stats.seasonStats?.ops ?? 0)
      const opsB = parseFloat(b.stats.seasonStats?.ops ?? 0)
      return opsB > opsA ? b : a
    })

    const { player, stats } = best
    const avg = formatAvg(parseFloat(stats.seasonStats.avg ?? 0))
    const hr = stats.seasonStats.homeRuns ?? 0
    const ops = parseFloat(stats.seasonStats.ops ?? 0).toFixed(3)

    return `${player.fullName} is their most dangerous bat, hitting ${avg} with ${hr} home run${hr !== 1 ? 's' : ''} this season (OPS ${ops}). Pitchers have had trouble keeping the ball in the yard.`
  }, [players, s0.seasonStats, s1.seasonStats, s2.seasonStats])
}

function WatchFor({ game, roster, injuredList }) {
  const seaLineup = getMarinersLineup(game)
  const oppLineup = getOpponentLineup(game)
  const seaPitcher = getMarinersPitcher(game)
  const { baseline, loading: baselineLoading } = usePositionalBaseline()

  const { seasonStats: pitcherStats } = usePlayerStats(seaPitcher?.id, 'pitcher')
  const hotHitterBullet = useHotHitterBullet(seaLineup)
  const opponentThreat = useOpponentThreat(oppLineup)

  const lineupNote = useMemo(() => {
    if (baselineLoading || Object.keys(baseline).length === 0) return null

    let restNote = null

    for (const player of seaLineup) {
      const note = getExplainerText(player, baseline, injuredList)
      if (!isValidLineupNote(note)) continue

      const pos = player.position?.abbreviation ?? player.position
      const usualStarter = baseline[pos]
      const isInjured = usualStarter && injuredList.some(
        (p) => (p.person?.id ?? p.id) === usualStarter.playerId,
      )

      if (isInjured) return note
      if (!restNote) restNote = note
    }

    return restNote
  }, [seaLineup, baseline, injuredList, baselineLoading])

  const bullets = useMemo(() => {
    const items = []

    if (hotHitterBullet) items.push(hotHitterBullet)

    if (seaPitcher && pitcherStats && items.length < 3) {
      const era = parseFloat(pitcherStats.era ?? 0)
      const aboveBelow = era < 4.2 ? 'below' : 'above'
      const bonus = era < 3.5 ? ' One of the better arms in the AL right now.' : ''
      items.push(
        `${seaPitcher.fullName} takes the mound. With a ${formatERA(era)} ERA this season, he is ${aboveBelow} the league average of 4.20.${bonus}`,
      )
    }

    if (lineupNote && items.length < 3) items.push(lineupNote)

    if (opponentThreat && items.length < 3) items.push(opponentThreat)

    return items.slice(0, 3)
  }, [hotHitterBullet, seaPitcher, pitcherStats, lineupNote, opponentThreat])

  return (
    <Card className="watch-for">
      <h2 className="watch-for__header">{getWatchForHeader(game.gameDate)}</h2>
      {bullets.length > 0 ? (
        <ul className="watch-for__list">
          {bullets.map((text, i) => (
            <li key={i} className="watch-for__bullet">{text}</li>
          ))}
        </ul>
      ) : (
        <p className="watch-for__empty">Check back closer to game time for storylines.</p>
      )}
    </Card>
  )
}

export default WatchFor
