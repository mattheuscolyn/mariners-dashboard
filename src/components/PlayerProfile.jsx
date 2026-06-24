import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import HotColdBadge from './HotColdBadge'
import StatBadge from './StatBadge'
import Tooltip from './Tooltip'
import Skeleton from './Skeleton'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { usePlayerOrigin } from '../hooks/usePlayerOrigin'
import { useInView } from '../hooks/useInView'
import { getPlayerInfo, getPlayerCareerHittingStats, getPlayerCareerPitchingStats } from '../services/mlbApi'
import { isPitcher } from '../data/positions'
import { buildOriginStories } from '../utils/lineupUtils'
import { LEAGUE_AVG_HITTER, LEAGUE_AVG_PITCHER } from '../data/statGlossary'
import {
  formatAvg,
  formatERA,
  formatWHIP,
  computeK9,
  computeOPS,
  parseHittingStat,
  parsePitchingStat,
  summarizeLastStarts,
} from '../utils/statsUtils'
import './PlayerProfile.css'

function PlayerHeadshot({ playerId, fullName }) {
  const [failed, setFailed] = useState(false)
  const initials = fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (failed) {
    return (
      <div className="player-profile__headshot player-profile__headshot--fallback">
        {initials}
      </div>
    )
  }

  return (
    <img
      className="player-profile__headshot"
      src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_auto/v1/people/${playerId}/headshot/67/current`}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}

function RecentSparkline({ splits }) {
  if (!splits?.length) return null

  const maxOps = Math.max(...splits.map((s) => computeOPS(s.stat)), 0.5)

  return (
    <div className="player-profile__sparkline" aria-hidden="true">
      {splits.map((split, i) => {
        const stat = split.stat ?? {}
        const hits = parseInt(stat.hits ?? 0, 10)
        const ops = computeOPS(stat)
        const height = Math.max((ops / maxOps) * 100, 8)
        const isToday =
          new Date(split.date).toDateString() === new Date().toDateString()

        return (
          <div
            key={split.date ?? i}
            className={`player-profile__spark-bar ${hits > 0 ? 'player-profile__spark-bar--hit' : 'player-profile__spark-bar--out'} ${isToday ? 'player-profile__spark-bar--today' : ''}`}
            style={{ height: `${height}%` }}
            title={`${split.date}: ${hits} H`}
          />
        )
      })}
    </div>
  )
}

function CareerSummary({ playerId, isPitcherPlayer }) {
  const [careerRef, inView] = useInView()
  const [career, setCareer] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!inView || !playerId) return undefined
    const controller = new AbortController()
    setLoading(true)

    async function load() {
      try {
        const data = isPitcherPlayer
          ? await getPlayerCareerPitchingStats(playerId, controller.signal)
          : await getPlayerCareerHittingStats(playerId, controller.signal)
        const stat = isPitcherPlayer
          ? parsePitchingStat(data)
          : parseHittingStat(data)
        setCareer(stat)
      } catch {
        setCareer(null)
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [inView, playerId, isPitcherPlayer])

  return (
    <section ref={careerRef} className="player-profile__section">
      <h3 className="player-profile__section-label">Career</h3>
      {loading && <p className="player-profile__muted">Loading career stats…</p>}
      {!loading && career && (
        <p className="player-profile__career-line">
          {isPitcherPlayer
            ? `${career.wins ?? 0}-${career.losses ?? 0} · ${formatERA(parseFloat(career.era ?? 0))} ERA career`
            : `${career.gamesPlayed ?? career.games ?? '—'} career games · ${formatAvg(parseFloat(career.avg ?? 0))} career average`}
        </p>
      )}
    </section>
  )
}

function PlayerProfile({ playerId, onClose }) {
  const [player, setPlayer] = useState(null)
  const [infoLoading, setInfoLoading] = useState(true)

  const position = player?.position ?? '—'
  const pitcher = isPitcher(position)
  const playerType = pitcher ? 'pitcher' : 'hitter'

  const { seasonStats, recentStats, recentGameSplits, trend, recentStartsSummary, loading: statsLoading } =
    usePlayerStats(playerId, playerType)
  const { transactions, loading: originLoading } = usePlayerOrigin(playerId)

  const originStories = buildOriginStories(transactions, 2)

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  useEffect(() => {
    const controller = new AbortController()
    setInfoLoading(true)

    async function load() {
      try {
        const info = await getPlayerInfo(playerId, controller.signal)
        if (info) {
          setPlayer({
            id: info.id,
            fullName: info.fullName,
            jerseyNumber: info.primaryNumber ?? '—',
            position: info.primaryPosition?.abbreviation ?? '—',
            debutDate: info.mlbDebutDate,
          })
        }
      } catch {
        setPlayer({ id: playerId, fullName: 'Unknown Player', jerseyNumber: '—', position: '—' })
      } finally {
        setInfoLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [playerId])

  const recentSummary = () => {
    if (pitcher) {
      return recentStartsSummary || 'No recent starts on record.'
    }
    if (!recentStats) return ''
    const avg = formatAvg(recentStats.avg ?? 0)
    const hr = recentStats.homeRuns ?? 0
    const hits = recentStats.hits ?? 0
    const ab = recentStats.atBats ?? 0
    return `Went ${hits}-for-${ab} with ${hr} HR in this stretch. Batting ${avg} over last 7 games.`
  }

  const trendSentence = () => {
    const name = player?.fullName?.split(' ').pop() ?? 'Player'
    if (trend === 'hot') return `🔥 ${name} is swinging a hot bat right now.`
    if (trend === 'cold') return `❄️ ${name} has been struggling at the plate recently.`
    return `${player?.fullName ?? 'Player'} is performing close to their season average.`
  }

  return (
    <div className="player-profile" role="dialog" aria-modal="true" aria-label="Player profile">
      <button
        type="button"
        className="player-profile__overlay"
        onClick={onClose}
        aria-label="Close player profile"
      />
      <div className="player-profile__drawer">
        <button
          type="button"
          className="player-profile__close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {infoLoading ? (
          <div className="player-profile__hero">
            <Skeleton width="90px" height="90px" borderRadius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="80%" height="2.5rem" />
              <Skeleton width="40%" height="1rem" />
            </div>
          </div>
        ) : (
          <div className="player-profile__content">
            <section className="player-profile__hero">
              <PlayerHeadshot playerId={playerId} fullName={player.fullName} />
              <div className="player-profile__hero-text">
                <h2 className="player-profile__name">{player.fullName}</h2>
                <p className="player-profile__meta">
                  #{player.jerseyNumber} · {player.position}
                </p>
                {!statsLoading && trend !== 'neutral' && (
                  <HotColdBadge
                    trend={trend}
                    label={trend === 'hot' ? 'Hot' : 'Cold'}
                  />
                )}
              </div>
            </section>

            <section className="player-profile__section">
              <h3 className="player-profile__section-label">How they got here</h3>
              {originLoading ? (
                <span className="player-profile__shimmer">· · ·</span>
              ) : (
                <>
                  {originStories.map((story, i) => (
                    <p key={i} className="player-profile__origin">{story}</p>
                  ))}
                  {player.debutDate && (
                    <p className="player-profile__muted">
                      MLB debut: {new Date(player.debutDate).getFullYear()}
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="player-profile__section">
              <h3 className="player-profile__section-label">Season stats</h3>
              {statsLoading ? (
                <div className="player-profile__stats">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} width="64px" height="3.5rem" />
                  ))}
                </div>
              ) : seasonStats ? (
                <>
                  <div className="player-profile__stats">
                    {pitcher ? (
                      <>
                        <Tooltip glossaryTerm="ERA"><StatBadge label="ERA" value={formatERA(parseFloat(seasonStats.era ?? 0))} /></Tooltip>
                        <Tooltip glossaryTerm="WHIP"><StatBadge label="WHIP" value={formatWHIP(seasonStats.whip)} /></Tooltip>
                        <Tooltip glossaryTerm="K/9"><StatBadge label="K/9" value={computeK9(seasonStats)} /></Tooltip>
                        <Tooltip glossaryTerm="BB/9"><StatBadge label="BB/9" value={((parseFloat(seasonStats.baseOnBalls ?? 0) / Math.max(parseFloat(seasonStats.inningsPitched ?? 1), 1)) * 9).toFixed(1)} /></Tooltip>
                        <StatBadge label="W" value={seasonStats.wins ?? 0} />
                        <StatBadge label="L" value={seasonStats.losses ?? 0} />
                        {(seasonStats.saves > 0 || player.position === 'CL') && (
                          <StatBadge label="SV" value={seasonStats.saves ?? 0} />
                        )}
                      </>
                    ) : (
                      <>
                        <Tooltip glossaryTerm="AVG"><StatBadge label="AVG" value={formatAvg(parseFloat(seasonStats.avg ?? 0))} /></Tooltip>
                        <Tooltip glossaryTerm="OBP"><StatBadge label="OBP" value={formatAvg(parseFloat(seasonStats.obp ?? 0))} /></Tooltip>
                        <Tooltip glossaryTerm="SLG"><StatBadge label="SLG" value={formatAvg(parseFloat(seasonStats.slg ?? 0))} /></Tooltip>
                        <Tooltip glossaryTerm="OPS"><StatBadge label="OPS" value={parseFloat(seasonStats.ops ?? computeOPS(seasonStats)).toFixed(3)} /></Tooltip>
                        <Tooltip glossaryTerm="HR"><StatBadge label="HR" value={seasonStats.homeRuns ?? 0} /></Tooltip>
                        <Tooltip glossaryTerm="RBI"><StatBadge label="RBI" value={seasonStats.rbi ?? 0} /></Tooltip>
                        <Tooltip glossaryTerm="SB"><StatBadge label="SB" value={seasonStats.stolenBases ?? 0} /></Tooltip>
                      </>
                    )}
                  </div>
                  <p className="player-profile__league-avg">
                    League avg: {pitcher ? LEAGUE_AVG_PITCHER : LEAGUE_AVG_HITTER}
                  </p>
                </>
              ) : (
                <p className="player-profile__muted">Stats unavailable</p>
              )}
            </section>

            <section className="player-profile__section">
              <h3 className="player-profile__section-label">Last 7 games</h3>
              {!pitcher && recentGameSplits.length > 0 && (
                <RecentSparkline splits={recentGameSplits} />
              )}
              <p className="player-profile__recent-summary">{recentSummary()}</p>
              {!pitcher && <p className="player-profile__trend">{trendSentence()}</p>}
              {pitcher && !statsLoading && (
                <p className="player-profile__trend">
                  {trend === 'hot' && '🔥 Pitching well above season form recently.'}
                  {trend === 'cold' && '❄️ Recent starts have been a struggle.'}
                  {trend === 'neutral' && 'Performing close to season average over recent starts.'}
                </p>
              )}
            </section>

            <CareerSummary playerId={playerId} isPitcherPlayer={pitcher} />

            {player.debutDate && (
              <p className="player-profile__debut">
                Joined MLB: {new Date(player.debutDate).getFullYear()}
              </p>
            )}

            <Link to="/glossary" className="player-profile__glossary" onClick={onClose}>
              New to baseball stats? See the glossary →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerProfile
