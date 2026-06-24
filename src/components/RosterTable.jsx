import Tooltip from './Tooltip'
import { usePlayerOrigin } from '../hooks/usePlayerOrigin'
import { useInView } from '../hooks/useInView'
import { usePlayerProfile } from '../context/PlayerProfileContext'
import { getStatusBadgeLabel, formatSinceDate } from '../utils/gameUtils'
import './RosterTable.css'

function StatusBadge({ category }) {
  const label = getStatusBadgeLabel(category)
  const variant =
    category === 'active'
      ? 'active'
      : category.startsWith('il')
        ? 'il'
        : 'optioned'

  return <span className={`roster-status roster-status--${variant}`}>{label}</span>
}

function OriginCell({ playerId, staggerIndex }) {
  const [ref, inView] = useInView()
  const { origin, loading } = usePlayerOrigin(
    inView ? playerId : null,
    staggerIndex * 80,
  )

  return (
    <span ref={ref} className="roster-origin">
      {loading && inView ? (
        <span className="roster-origin__shimmer">· · ·</span>
      ) : (
        origin || '—'
      )}
    </span>
  )
}

function PlayerNameButton({ playerId, name }) {
  const { openPlayerProfile } = usePlayerProfile()

  return (
    <button
      type="button"
      className="roster-name-btn"
      onClick={() => openPlayerProfile(playerId)}
    >
      {name}
    </button>
  )
}

function RosterTableRow({ player, index, showInjury = false }) {
  return (
    <tr className="roster-table__row">
      <td className="roster-table__num">{player.jerseyNumber}</td>
      <td>
        <PlayerNameButton playerId={player.id} name={player.fullName} />
      </td>
      <td>
        <Tooltip positionCode={player.position}>
          <span className="roster-table__pos">{player.position}</span>
        </Tooltip>
      </td>
      <td>
        <StatusBadge category={player.statusCategory} />
      </td>
      <td className="roster-table__since">{formatSinceDate(player.since)}</td>
      <td className="roster-table__origin">
        <OriginCell playerId={player.id} staggerIndex={index} />
      </td>
      {showInjury && (
        <td className="roster-table__injury">{player.injuryDescription ?? '—'}</td>
      )}
    </tr>
  )
}

function RosterCard({ player, index, showInjury = false }) {
  return (
    <div className="roster-card">
      <div className="roster-card__header">
        <span className="roster-table__num">#{player.jerseyNumber}</span>
        <PlayerNameButton playerId={player.id} name={player.fullName} />
        <Tooltip positionCode={player.position}>
          <span className="roster-table__pos">{player.position}</span>
        </Tooltip>
      </div>
      <div className="roster-card__meta">
        <StatusBadge category={player.statusCategory} />
        <span className="roster-table__since">{formatSinceDate(player.since)}</span>
      </div>
      <p className="roster-card__origin">
        <OriginCell playerId={player.id} staggerIndex={index} />
      </p>
      {showInjury && player.injuryDescription && (
        <p className="roster-card__injury">{player.injuryDescription}</p>
      )}
    </div>
  )
}

function RosterTable({ players, showInjury = false }) {
  if (players.length === 0) {
    return <p className="roster-table__empty">No players match the current filters.</p>
  }

  return (
    <>
      <table className="roster-table roster-table--desktop">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>
              <Tooltip term="Pos" definition="Player's primary position on the field.">
                Pos
              </Tooltip>
            </th>
            <th>
              <Tooltip glossaryTerm="IL" term="Status" definition="Current roster status — Active, Injured List, or Optioned to minors.">
                Status
              </Tooltip>
            </th>
            <th>Since</th>
            <th>Origin</th>
            {showInjury && <th>Injury</th>}
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <RosterTableRow
              key={player.id}
              player={player}
              index={index}
              showInjury={showInjury}
            />
          ))}
        </tbody>
      </table>

      <div className="roster-cards roster-cards--mobile">
        {players.map((player, index) => (
          <RosterCard
            key={player.id}
            player={player}
            index={index}
            showInjury={showInjury}
          />
        ))}
      </div>
    </>
  )
}

export default RosterTable
