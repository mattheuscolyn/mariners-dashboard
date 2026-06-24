import { useState, useEffect } from 'react'
import Card from './Card'
import StatBadge from './StatBadge'
import Tooltip from './Tooltip'
import Skeleton from './Skeleton'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { usePlayerProfile } from '../context/PlayerProfileContext'
import {
  formatERA,
  formatWHIP,
  computeK9,
  formatWL,
  formatPct,
} from '../utils/statsUtils'
import './MatchupStrip.css'

function PitcherCardSkeleton() {
  return (
    <Card className="matchup-strip__pitcher">
      <div className="matchup-strip__pitcher-header">
        <Skeleton width="56px" height="56px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="70%" height="1.25rem" />
          <Skeleton width="40%" height="0.875rem" />
        </div>
      </div>
      <div className="matchup-strip__stats">
        <Skeleton width="60px" height="3rem" />
        <Skeleton width="60px" height="3rem" />
        <Skeleton width="60px" height="3rem" />
        <Skeleton width="60px" height="3rem" />
      </div>
    </Card>
  )
}

function PitcherCard({ pitcher, side }) {
  const { openPlayerProfile } = usePlayerProfile()
  const { seasonStats, recentStartsSummary, loading } = usePlayerStats(
    pitcher?.id,
    'pitcher',
  )

  if (!pitcher) {
    return (
      <Card className="matchup-strip__pitcher">
        <p className="matchup-strip__tbd">Starting pitcher TBD</p>
      </Card>
    )
  }

  if (loading) return <PitcherCardSkeleton />

  return (
    <Card className="matchup-strip__pitcher">
      <div className="matchup-strip__pitcher-header">
        <div className="matchup-strip__headshot" aria-hidden="true">
          {pitcher.initials}
        </div>
        <div>
          <button
            type="button"
            className="matchup-strip__pitcher-name-btn"
            onClick={() => openPlayerProfile(pitcher.id)}
          >
            {pitcher.fullName}
          </button>
          <span className="matchup-strip__pitcher-role">SP · {side}</span>
        </div>
      </div>

      {seasonStats ? (
        <>
          <div className="matchup-strip__stats">
            <Tooltip glossaryTerm="ERA">
              <StatBadge label="ERA" value={formatERA(parseFloat(seasonStats.era ?? 0))} />
            </Tooltip>
            <Tooltip glossaryTerm="WHIP">
              <StatBadge label="WHIP" value={formatWHIP(seasonStats.whip)} />
            </Tooltip>
            <Tooltip glossaryTerm="K/9">
              <StatBadge label="K/9" value={computeK9(seasonStats)} />
            </Tooltip>
            <StatBadge label="W-L" value={formatWL(seasonStats)} />
          </div>
          {recentStartsSummary && (
            <p className="matchup-strip__recent">
              Last 3 starts: {recentStartsSummary}
            </p>
          )}
        </>
      ) : (
        <p className="matchup-strip__loading">Stats unavailable</p>
      )}
    </Card>
  )
}

function WinProbabilityBar({ oddsData }) {
  const seaPct = oddsData.impliedWinPct ?? 0.5
  const oppPct = 1 - seaPct
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(frame)
  }, [seaPct])

  return (
    <div className="matchup-strip__odds">
      <p className="matchup-strip__odds-label">
        Implied win probability (
        <Tooltip glossaryTerm="Moneyline">moneyline</Tooltip>
        )
      </p>
      <div className="matchup-strip__bar">
        <span className="matchup-strip__bar-label matchup-strip__bar-label--sea">
          SEA {formatPct(seaPct)}
        </span>
        <div className="matchup-strip__bar-track">
          <div
            className={`matchup-strip__bar-fill ${animated ? 'matchup-strip__bar-fill--animated' : ''}`}
            style={{ width: `${animated ? seaPct * 100 : 50}%` }}
          />
        </div>
        <span className="matchup-strip__bar-label matchup-strip__bar-label--opp">
          {formatPct(oppPct)} OPP
        </span>
      </div>
    </div>
  )
}

function MatchupStrip({ game, oddsData }) {
  const seaPitcher = game.isHome ? game.probablePitchers.home : game.probablePitchers.away
  const oppPitcher = game.isHome ? game.probablePitchers.away : game.probablePitchers.home

  return (
    <section className="matchup-strip">
      <PitcherCard pitcher={seaPitcher} side="SEA" />

      {oddsData ? (
        <WinProbabilityBar oddsData={oddsData} />
      ) : null}

      <PitcherCard pitcher={oppPitcher} side="OPP" />
    </section>
  )
}

export default MatchupStrip
