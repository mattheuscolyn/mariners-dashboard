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
  getExpectedLineupTime,
} from '../utils/gameUtils'
import { getExplainerText, isOnInjuredList } from '../utils/lineupUtils'
import './LineupView.css'

function LineupPlayerRow({
  player,
  index,
  injuredList,
  jerseyMap,
  baseline,
  isMariners,
}) {
  const { openPlayerProfile } = usePlayerProfile()
  const delay = index * 200
  const { trend, loading: statsLoading } = usePlayerStats(
    player.id,
    'hitter',
    delay,
  )

  const explainer = isMariners
    ? getExplainerText(player, baseline, injuredList)
    : null

  const onIL = isOnInjuredList(player.id, injuredList)
  const playerId = player.person?.id ?? player.id
  const jersey = jerseyMap?.[playerId]
  const jerseyDisplay =
    jersey != null && jersey !== '' && jersey !== '—' ? `#${jersey}` : '—'

  return (
    <li className="lineup-view__player">
      <div className="lineup-view__player-row">
        <span className="lineup-view__order">{player.batOrder ?? index + 1}</span>
        <span className="lineup-view__jersey">{jerseyDisplay}</span>
        <button
          type="button"
          className="lineup-view__name-btn"
          onClick={() => player.id && openPlayerProfile(player.id)}
        >
          {player.fullName}
        </button>
        <Tooltip positionCode={player.position}>
          <span className="lineup-view__position">{player.position}</span>
        </Tooltip>
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
            isMariners={isMariners}
          />
        ))}
      </ol>
    </div>
  )
}

function LineupView({ game, roster, injuredList, jerseyMap }) {
  const [activeTab, setActiveTab] = useState('sea')
  const { baseline } = usePositionalBaseline()
  const seaLineup = getMarinersLineup(game)
  const oppLineup = getOpponentLineup(game)
  const opponent = getOpponentTeam(game)
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
          isMariners={false}
        />
      </div>
    </section>
  )
}

export default LineupView
