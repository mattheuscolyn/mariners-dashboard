import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import HotColdBadge from './HotColdBadge'
import StatBadge from './StatBadge'
import Tooltip from './Tooltip'
import Skeleton from './Skeleton'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { usePlayerOrigin } from '../hooks/usePlayerOrigin'
import { useLeagueAverages } from '../hooks/useLeagueAverages'
import { useInView } from '../hooks/useInView'
import StatContextBar from './StatContextBar'
import { getPlayerInfo, getPlayerCareerHittingStats, getPlayerCareerPitchingStats } from '../services/mlbApi'
import { isPitcher } from '../data/positions'
import { buildOriginStories } from '../utils/lineupUtils'
import { buildMarinersHistoryTimeline, formatTransactionDate } from '../utils/transactionUtils'
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

function calculateAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  if (!hadBirthday) age -= 1

  return age >= 0 ? age : null
}

function buildBioLine(info) {
  if (!info) return null

  const segments = []

  const age = calculateAge(info.birthDate)
  const birthplace = [info.birthCity, info.birthCountry].filter(Boolean).join(', ')
  if (age != null && birthplace) segments.push(`${age} · ${birthplace}`)
  else if (age != null) segments.push(String(age))
  else if (birthplace) segments.push(birthplace)

  const batDesc = info.batSide?.description
  const throwDesc = info.pitchHand?.description
  if (batDesc && throwDesc) {
    segments.push(`Bats: ${batDesc} · Throws: ${throwDesc}`)
  } else if (batDesc) {
    segments.push(`Bats: ${batDesc}`)
  } else if (throwDesc) {
    segments.push(`Throws: ${throwDesc}`)
  }

  const heightWeight = [
    info.height || null,
    info.weight != null ? `${info.weight} lbs` : null,
  ].filter(Boolean)
  if (heightWeight.length) segments.push(heightWeight.join(' · '))

  return segments.length ? segments.join(' · ') : null
}

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
  const { averages: leagueAverages, loading: leagueLoading } = useLeagueAverages()

  const originStories = buildOriginStories(transactions, 2)
  const marinersHistory = useMemo(
    () => buildMarinersHistoryTimeline(transactions),
    [transactions],
  )

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
            nickName: info.nickName || null,
            jerseyNumber: info.primaryNumber ?? '—',
            position: info.primaryPosition?.abbreviation ?? '—',
            debutDate: info.mlbDebutDate,
            birthDate: info.birthDate,
            birthCity: info.birthCity,
            birthCountry: info.birthCountry,
            batSide: info.batSide,
            pitchHand: info.pitchHand,
            height: info.height,
            weight: info.weight,
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

  const bioLine = buildBioLine(player)

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
            <div className="player-profile__hero-main">
              <Skeleton width="90px" height="90px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton width="80%" height="2.5rem" />
                <Skeleton width="40%" height="1rem" />
              </div>
            </div>
          </div>
        ) : (
          <div className="player-profile__content">
            <section className="player-profile__hero">
              <div className="player-profile__hero-main">
                <PlayerHeadshot playerId={playerId} fullName={player.fullName} />
                <div className="player-profile__hero-text">
                  <h2 className="player-profile__name">{player.fullName}</h2>
                  {player.nickName && (
                    <p className="player-profile__nickname">&ldquo;{player.nickName}&rdquo;</p>
                  )}
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
              </div>
              {bioLine && <p className="player-profile__bio">{bioLine}</p>}
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
                  {leagueLoading ? (
                    <div className="player-profile__stat-context-list">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} height="3.5rem" width="100%" />
                      ))}
                    </div>
                  ) : (
                    <div className="player-profile__stat-context-list">
                      {pitcher ? (
                        <>
                          <StatContextBar
                            label="ERA"
                            glossaryTerm="ERA"
                            value={parseFloat(seasonStats.era ?? 0)}
                            displayValue={formatERA(parseFloat(seasonStats.era ?? 0))}
                            distribution={leagueAverages?.pitching?.era}
                            higherIsBetter={false}
                          />
                          <StatContextBar
                            label="WHIP"
                            glossaryTerm="WHIP"
                            value={parseFloat(seasonStats.whip ?? 0)}
                            displayValue={formatWHIP(seasonStats.whip)}
                            distribution={leagueAverages?.pitching?.whip}
                            higherIsBetter={false}
                          />
                          <StatContextBar
                            label="K/9"
                            glossaryTerm="K/9"
                            value={parseFloat(computeK9(seasonStats))}
                            displayValue={computeK9(seasonStats)}
                            distribution={leagueAverages?.pitching?.k9}
                          />
                        </>
                      ) : (
                        <>
                          <StatContextBar
                            label="AVG"
                            glossaryTerm="AVG"
                            value={parseFloat(seasonStats.avg ?? 0)}
                            displayValue={formatAvg(parseFloat(seasonStats.avg ?? 0))}
                            distribution={leagueAverages?.hitting?.avg}
                          />
                          <StatContextBar
                            label="OBP"
                            glossaryTerm="OBP"
                            value={parseFloat(seasonStats.obp ?? 0)}
                            displayValue={formatAvg(parseFloat(seasonStats.obp ?? 0))}
                            distribution={leagueAverages?.hitting?.obp}
                          />
                          <StatContextBar
                            label="SLG"
                            glossaryTerm="SLG"
                            value={parseFloat(seasonStats.slg ?? 0)}
                            displayValue={formatAvg(parseFloat(seasonStats.slg ?? 0))}
                            distribution={leagueAverages?.hitting?.slg}
                          />
                          {leagueAverages?.hitting?.wrcPlus && (
                            <StatContextBar
                              label="wRC+"
                              glossaryTerm="wRC+"
                              value={parseFloat(seasonStats.wrcPlus ?? 0)}
                              displayValue={String(Math.round(parseFloat(seasonStats.wrcPlus ?? 0)))}
                              distribution={leagueAverages.hitting.wrcPlus}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                  <div className="player-profile__stats player-profile__stats--secondary">
                    {pitcher ? (
                      <>
                        <Tooltip glossaryTerm="BB/9">
                          <StatBadge
                            label="BB/9"
                            value={(
                              (parseFloat(seasonStats.baseOnBalls ?? 0) /
                                Math.max(parseFloat(seasonStats.inningsPitched ?? 1), 1)) *
                              9
                            ).toFixed(1)}
                          />
                        </Tooltip>
                        <StatBadge label="W" value={seasonStats.wins ?? 0} />
                        <StatBadge label="L" value={seasonStats.losses ?? 0} />
                        {(seasonStats.saves > 0 || player.position === 'CL') && (
                          <StatBadge label="SV" value={seasonStats.saves ?? 0} />
                        )}
                      </>
                    ) : (
                      <>
                        <Tooltip glossaryTerm="OPS">
                          <StatBadge
                            label="OPS"
                            value={parseFloat(
                              seasonStats.ops ?? computeOPS(seasonStats),
                            ).toFixed(3)}
                          />
                        </Tooltip>
                        <Tooltip glossaryTerm="HR">
                          <StatBadge label="HR" value={seasonStats.homeRuns ?? 0} />
                        </Tooltip>
                        <Tooltip glossaryTerm="RBI">
                          <StatBadge label="RBI" value={seasonStats.rbi ?? 0} />
                        </Tooltip>
                        <Tooltip glossaryTerm="SB">
                          <StatBadge label="SB" value={seasonStats.stolenBases ?? 0} />
                        </Tooltip>
                      </>
                    )}
                  </div>
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

            <section className="player-profile__section">
              <h3 className="player-profile__section-label">Mariners history</h3>
              {originLoading ? (
                <span className="player-profile__shimmer">· · ·</span>
              ) : marinersHistory.length === 0 ? (
                <p className="player-profile__muted">No transaction history available.</p>
              ) : (
                <ol className="player-profile__timeline">
                  {marinersHistory.map((event) => (
                    <li key={event.id} className="player-profile__timeline-item">
                      <p className="player-profile__timeline-date">
                        {formatTransactionDate(event.date)}
                      </p>
                      <p className="player-profile__timeline-label">{event.label}</p>
                      <p className="player-profile__timeline-desc">{event.description}</p>
                    </li>
                  ))}
                </ol>
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
