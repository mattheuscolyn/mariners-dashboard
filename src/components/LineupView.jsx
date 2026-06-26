import { useState } from 'react'
import Card from './Card'
import Tooltip from './Tooltip'
import HotColdBadge from './HotColdBadge'
import Skeleton from './Skeleton'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { usePositionalBaseline } from '../hooks/usePositionalBaseline'
import { usePlayerProfile } from '../context/PlayerProfileContext'
import {
  getMarinersLineup,
  getOpponentLineup,
  getOpponentTeam,
  getMarinersTeam,
  getExpectedLineupTime,
} from '../utils/gameUtils'
import { getExplainerText, isOnInjuredList } from '../utils/lineupUtils'
import { getAlternatePositions } from '../utils/positionalBaselineUtils'
import PlayerLineupPopover from './PlayerLineupPopover'
import './LineupView.css'

function findRosterPlayer(roster, playerId) {
  return roster?.find((p) => p.id === playerId) ?? null
}

function LineupPlayerRow({
  player,
  index,
  injuredList,
  jerseyMap,
  baseline,
  playerPositionStarts,
  roster,
  teamId,
  teamAbbr,
  isMariners,
}) {
  const { openPlayerProfile } = usePlayerProfile()
  const delay = index * 200
  const { seasonStats, recentStats, trend, loading: statsLoading } = usePlayerStats(
    player.id,
    'hitter',
    delay,
  )

  const explainer = isMariners
    ? getExplainerText(player, baseline, injuredList)
    : null

  const playerId = player.person?.id ?? player.id
  const onIL = isOnInjuredList(playerId, injuredList)
  const jersey = jerseyMap?.[playerId]
  const jerseyDisplay =
    jersey != null && jersey !== '' && jersey !== '—' ? `#${jersey}` : '—'
  const rosterPlayer = findRosterPlayer(roster, playerId)
  const todayPosition = player.position
  const alternatePositions = getAlternatePositions(
    playerId,
    todayPosition,
    playerPositionStarts,
  )
  const rosterPosition =
    isMariners && rosterPlayer?.position && rosterPlayer.position !== '—'
      ? rosterPlayer.position
      : null
  const showRosterLabel =
    rosterPosition && rosterPosition !== todayPosition

  return (
    <li className="lineup-view__player">
      <div className="lineup-view__player-row">
        <span className="lineup-view__order">{player.batOrder ?? index + 1}</span>
        <span className="lineup-view__jersey">{jerseyDisplay}</span>
        <div className="lineup-view__player-identity">
          <div className="lineup-view__name-line">
            <PlayerLineupPopover
              player={player}
              rosterPlayer={rosterPlayer}
              jerseyDisplay={jerseyDisplay}
              teamAbbr={teamAbbr}
              teamId={teamId}
              seasonStats={seasonStats}
              recentStats={recentStats}
              trend={trend}
              statsLoading={statsLoading}
              onProfileClick={() => player.id && openPlayerProfile(player.id)}
            >
              <span className="lineup-view__name-btn">{player.fullName}</span>
            </PlayerLineupPopover>
            <Tooltip positionCode={todayPosition}>
              <span className="lineup-view__position">{todayPosition}</span>
            </Tooltip>
          </div>
          {showRosterLabel && (
            <span className="lineup-view__roster-pos">
              40-man: {rosterPosition}
            </span>
          )}
          {alternatePositions.length > 0 && (
            <div className="lineup-view__also-plays">
              <span className="lineup-view__also-plays-label">Also plays</span>
              {alternatePositions.map(({ position, gamesStarted }) => (
                <Tooltip key={position} positionCode={position}>
                  <span className="lineup-view__pos-pill">
                    {position} · {gamesStarted}
                  </span>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
        {statsLoading ? (
          <Skeleton width="48px" height="1.25rem" borderRadius="var(--radius-pill)" />
        ) : (
          trend !== 'neutral' && (
            <HotColdBadge trend={trend} label={trend === 'hot' ? 'Hot' : 'Cold'} />
          )
        )}
        {onIL && (
          <Tooltip glossaryTerm="IL">
            <span className="lineup-view__il-badge">IL</span>
          </Tooltip>
        )}
      </div>
      {explainer && <p className="lineup-view__explainer">{explainer}</p>}
    </li>
  )
}

function LineupColumn({
  title,
  lineup,
  injuredList,
  jerseyMap,
  baseline,
  playerPositionStarts,
  roster,
  teamId,
  teamAbbr,
  isMariners,
}) {
  return (
    <div className="lineup-view__column">
      <h3 className="lineup-view__column-title">{title}</h3>
      <ol className="lineup-view__list">
        {lineup.map((player, index) => (
          <LineupPlayerRow
            key={player.id ?? index}
            player={player}
            index={index}
            injuredList={injuredList}
            jerseyMap={jerseyMap}
            baseline={baseline}
            playerPositionStarts={playerPositionStarts}
            roster={roster}
            teamId={teamId}
            teamAbbr={teamAbbr}
            isMariners={isMariners}
          />
        ))}
      </ol>
    </div>
  )
}

function LineupView({ game, roster, injuredList, jerseyMap }) {
  const [activeTab, setActiveTab] = useState('sea')
  const { baseline, playerPositionStarts } = usePositionalBaseline()
  const seaLineup = getMarinersLineup(game)
  const oppLineup = getOpponentLineup(game)
  const opponent = getOpponentTeam(game)
  const mariners = getMarinersTeam(game)
  const hasLineups = seaLineup.length > 0 || oppLineup.length > 0

  if (!hasLineups) {
    return (
      <Card className="lineup-view lineup-view--empty">
        <p className="lineup-view__placeholder">
          Lineup not yet announced — check back closer to first pitch.
        </p>
        <p className="lineup-view__expected">
          Expected around {getExpectedLineupTime(game.gameDate)} PT
        </p>
      </Card>
    )
  }

  return (
    <section className="lineup-view">
      <div className="lineup-view__tabs">
        <button
          type="button"
          className={`lineup-view__tab ${activeTab === 'sea' ? 'lineup-view__tab--active' : ''}`}
          onClick={() => setActiveTab('sea')}
        >
          SEA
        </button>
        <button
          type="button"
          className={`lineup-view__tab ${activeTab === 'opp' ? 'lineup-view__tab--active' : ''}`}
          onClick={() => setActiveTab('opp')}
        >
          {opponent.abbreviation || 'OPP'}
        </button>
      </div>

      <div className={`lineup-view__panel lineup-view__panel--sea ${activeTab === 'sea' ? 'lineup-view__panel--active' : ''}`}>
        <LineupColumn
          title="Seattle Mariners"
          lineup={seaLineup}
          injuredList={injuredList}
            jerseyMap={jerseyMap}
            baseline={baseline}
            playerPositionStarts={playerPositionStarts}
            roster={roster}
            teamId={mariners.id}
          teamAbbr="SEA"
          isMariners
        />
      </div>

      <div className={`lineup-view__panel lineup-view__panel--opp ${activeTab === 'opp' ? 'lineup-view__panel--active' : ''}`}>
        <LineupColumn
          title={`${opponent.city} ${opponent.name}`}
          lineup={oppLineup}
          injuredList={[]}
          jerseyMap={jerseyMap}
          baseline={{}}
          playerPositionStarts={{}}
          roster={[]}
          teamId={opponent.id}
          teamAbbr={opponent.abbreviation || 'OPP'}
          isMariners={false}
        />
      </div>
    </section>
  )
}

export default LineupView
