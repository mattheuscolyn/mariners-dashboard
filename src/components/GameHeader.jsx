import { useState, useEffect } from 'react'
import {
  getOpponentTeam,
  getMarinersTeam,
  formatGameTimePT,
  getDayLabel,
} from '../utils/gameUtils'
import './GameHeader.css'

function StatusPill({ children, variant = 'default' }) {
  return <span className={`game-header__pill game-header__pill--${variant}`}>{children}</span>
}

function Countdown({ gameDate, status }) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (status !== 'Scheduled') return undefined

    function update() {
      const now = Date.now()
      const start = new Date(gameDate).getTime()
      const diff = start - now

      if (diff <= 0) {
        setCountdown('Starting soon')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setCountdown(`First pitch in ${hours}h ${minutes}m`)
    }

    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [gameDate, status])

  if (status !== 'Scheduled' || !countdown) return null
  return <p className="game-header__countdown">{countdown}</p>
}

function GameHeader({ game }) {
  const opponent = getOpponentTeam(game)
  const mariners = getMarinersTeam(game)
  const isAway = !game.isHome
  const prefix = isAway ? '@' : 'vs'

  const statusLabel = () => {
    if (game.status === 'In Progress') {
      const inning = game.linescore?.currentInning
      const half = game.linescore?.inningState ?? ''
      return `In Progress — ${inning ? `${inning}${getInningSuffix(inning)} Inning` : half}`
    }
    if (game.status === 'Final') return 'Final'
    return `${getDayLabel(game.gameDate)} · ${formatGameTimePT(game.gameDate)} PT`
  }

  const pillVariant =
    game.status === 'In Progress' ? 'live' : game.status === 'Final' ? 'final' : 'scheduled'

  return (
    <header className="game-header">
      <div className="game-header__top">
        <h1 className="game-header__matchup">
          {prefix} {opponent.city} {opponent.name}{' '}
          <span className="game-header__record">({opponent.record.label})</span>
        </h1>
        <StatusPill variant={pillVariant}>{statusLabel()}</StatusPill>
      </div>

      <p className="game-header__venue">{game.venue}</p>

      {game.status === 'In Progress' && game.linescore && (
        <div className="game-header__scoreboard">
          <span className="game-header__live">
            <span className="game-header__live-dot" aria-hidden="true" />
            LIVE
          </span>
          <div className="game-header__scores">
            <span className="game-header__team-score">
              <span className="game-header__team-abbr">SEA</span>
              <span className="game-header__score">{mariners.score ?? 0}</span>
            </span>
            <span className="game-header__score-divider">—</span>
            <span className="game-header__team-score">
              <span className="game-header__score">{opponent.score ?? 0}</span>
              <span className="game-header__team-abbr">{opponent.abbreviation || 'OPP'}</span>
            </span>
          </div>
        </div>
      )}

      {game.status === 'Final' && (
        <div className="game-header__final">
          <div className="game-header__scores">
            <span>SEA {mariners.score}</span>
            <span>—</span>
            <span>{opponent.abbreviation || 'OPP'} {opponent.score}</span>
          </div>
          <p className="game-header__next-label">Next Game</p>
        </div>
      )}

      <Countdown gameDate={game.gameDate} status={game.status} />
    </header>
  )
}

function getInningSuffix(inning) {
  if (inning === 1) return 'st'
  if (inning === 2) return 'nd'
  if (inning === 3) return 'rd'
  return 'th'
}

export default GameHeader
