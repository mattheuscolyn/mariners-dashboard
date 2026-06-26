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

function formatLinescoreStat(value) {
  return value ?? '—'
}

function getTeamLinescoreStats(game, side, teamScore) {
  const stats = game.linescore?.[side]
  return {
    runs: formatLinescoreStat(stats?.runs ?? teamScore),
    hits: formatLinescoreStat(stats?.hits),
    errors: formatLinescoreStat(stats?.errors),
  }
}

function LinescoreBoard({ game, mariners, opponent, showLive = false }) {
  const marinersSide = game.isHome ? 'home' : 'away'
  const opponentSide = game.isHome ? 'away' : 'home'
  const marinersStats = getTeamLinescoreStats(game, marinersSide, mariners.score)
  const opponentStats = getTeamLinescoreStats(game, opponentSide, opponent.score)

  return (
    <div className="game-header__scoreboard">
      {showLive && (
        <span className="game-header__live">
          <span className="game-header__live-dot" aria-hidden="true" />
          LIVE
        </span>
      )}
      <div
        className="game-header__linescore"
        role="table"
        aria-label="Runs, hits, and errors"
      >
        <div className="game-header__linescore-row game-header__linescore-row--header" role="row">
          <span className="game-header__linescore-team" role="columnheader" aria-hidden="true" />
          <span className="game-header__linescore-label" role="columnheader">R</span>
          <span className="game-header__linescore-label" role="columnheader">H</span>
          <span className="game-header__linescore-label" role="columnheader">E</span>
        </div>
        <div className="game-header__linescore-row" role="row">
          <span className="game-header__linescore-team game-header__team-abbr" role="rowheader">SEA</span>
          <span className="game-header__linescore-stat" role="cell">{marinersStats.runs}</span>
          <span className="game-header__linescore-stat" role="cell">{marinersStats.hits}</span>
          <span className="game-header__linescore-stat" role="cell">{marinersStats.errors}</span>
        </div>
        <div className="game-header__linescore-row" role="row">
          <span className="game-header__linescore-team game-header__team-abbr" role="rowheader">
            {opponent.abbreviation || 'OPP'}
          </span>
          <span className="game-header__linescore-stat" role="cell">{opponentStats.runs}</span>
          <span className="game-header__linescore-stat" role="cell">{opponentStats.hits}</span>
          <span className="game-header__linescore-stat" role="cell">{opponentStats.errors}</span>
        </div>
      </div>
    </div>
  )
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

      {game.status === 'In Progress' && (
        <LinescoreBoard
          game={game}
          mariners={mariners}
          opponent={opponent}
          showLive
        />
      )}

      {game.status === 'Final' && (
        <div className="game-header__final">
          <LinescoreBoard game={game} mariners={mariners} opponent={opponent} />
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
