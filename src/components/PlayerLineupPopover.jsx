import { useState, useRef, useEffect, useCallback } from 'react'
import HotColdBadge from './HotColdBadge'
import Skeleton from './Skeleton'
import { usePlayerPopoverTenure } from '../hooks/usePlayerPopoverTenure'
import { formatAvg } from '../utils/statsUtils'
import './PlayerLineupPopover.css'

const LONG_PRESS_MS = 500

function headshotUrl(playerId) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`
}

function parseStatRate(val) {
  if (val == null || val === '') return null
  const n = typeof val === 'string' ? parseFloat(val) : val
  return Number.isNaN(n) ? null : n
}

function formatSlashLine(seasonStats) {
  if (!seasonStats) return '— / — / —'
  const avg = parseStatRate(seasonStats.avg)
  const obp = parseStatRate(seasonStats.obp)
  const slg = parseStatRate(seasonStats.slg)
  const fmt = (n) => (n == null ? '—' : formatAvg(n))
  return `${fmt(avg)} / ${fmt(obp)} / ${fmt(slg)}`
}

function formatRecentContext(recentStats) {
  if (!recentStats) return null
  const hr = recentStats.homeRuns ?? 0
  const avg = recentStats.avg != null ? formatAvg(recentStats.avg) : '—'
  return `${hr} HR, ${avg} AVG last 7`
}

function getPositionsLabel(rosterPlayer, lineupPosition) {
  const positions = new Set()
  if (rosterPlayer?.position && rosterPlayer.position !== '—') {
    positions.add(rosterPlayer.position)
  }
  if (lineupPosition && lineupPosition !== rosterPlayer?.position) {
    positions.add(lineupPosition)
  }
  if (positions.size === 0 && lineupPosition) return lineupPosition
  return [...positions].join(', ') || '—'
}

function PopoverHeadshot({ playerId, fullName, load }) {
  const [failed, setFailed] = useState(false)
  const initials = fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (!load || failed) {
    return (
      <div className="lineup-popover__headshot lineup-popover__headshot--fallback" aria-hidden="true">
        {initials}
      </div>
    )
  }

  return (
    <img
      className="lineup-popover__headshot"
      src={headshotUrl(playerId)}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}

function PlayerLineupPopover({
  player,
  rosterPlayer,
  jerseyDisplay,
  teamAbbr,
  teamId,
  seasonStats,
  recentStats,
  trend,
  statsLoading,
  onProfileClick,
  children,
}) {
  const [open, setOpen] = useState(false)
  const [suppressClick, setSuppressClick] = useState(false)
  const anchorRef = useRef(null)
  const longPressRef = useRef(null)

  const playerId = player.person?.id ?? player.id
  const rosterSince = rosterPlayer?.since ?? null

  const { sinceYear, loading: tenureLoading } = usePlayerPopoverTenure(
    playerId,
    teamId,
    rosterSince,
    open,
  )

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(e) {
      if (e.key === 'Escape') close()
    }

    function onPointerDown(e) {
      if (!anchorRef.current?.contains(e.target)) close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open, close])

  const clearLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  const handleTouchStart = () => {
    clearLongPress()
    longPressRef.current = setTimeout(() => {
      setOpen(true)
      setSuppressClick(true)
    }, LONG_PRESS_MS)
  }

  const handleTouchEnd = () => clearLongPress()

  const handleClick = (e) => {
    if (suppressClick) {
      e.preventDefault()
      setSuppressClick(false)
      return
    }
    onProfileClick?.()
  }

  const tenureLabel = tenureLoading
    ? '…'
    : sinceYear
      ? `With ${teamAbbr} since ${sinceYear}`
      : `With ${teamAbbr}`

  const recentContext = formatRecentContext(recentStats)

  return (
    <span
      ref={anchorRef}
      className="lineup-popover-anchor"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={clearLongPress}
    >
      <span
        className="lineup-popover-anchor__trigger"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick(e)
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {children}
      </span>

      {open && (
        <div
          className="lineup-popover"
          role="dialog"
          aria-label={`${player.fullName} quick stats`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="lineup-popover__header">
            <PopoverHeadshot playerId={playerId} fullName={player.fullName} load />
            <div className="lineup-popover__identity">
              <p className="lineup-popover__name">
                {player.fullName}
                {jerseyDisplay !== '—' && (
                  <span className="lineup-popover__jersey"> {jerseyDisplay}</span>
                )}
              </p>
              <p className="lineup-popover__positions">
                {getPositionsLabel(rosterPlayer, player.position)}
              </p>
              <p className="lineup-popover__tenure">{tenureLabel}</p>
            </div>
          </div>

          {statsLoading ? (
            <Skeleton height="2.5rem" width="100%" />
          ) : (
            <>
              <p className="lineup-popover__slash">{formatSlashLine(seasonStats)}</p>
              {(trend !== 'neutral' || recentContext) && (
                <div className="lineup-popover__trend-row">
                  {trend !== 'neutral' && (
                    <HotColdBadge
                      trend={trend}
                      label={trend === 'hot' ? 'Hot' : 'Cold'}
                    />
                  )}
                  {recentContext && (
                    <span className="lineup-popover__recent">{recentContext}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </span>
  )
}

export default PlayerLineupPopover
