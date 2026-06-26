import { useState } from 'react'
import { usePositionalBaseline } from '../hooks/usePositionalBaseline'
import { getMarinersLineup } from '../utils/gameUtils'
import { buildLineupChangeChips } from '../utils/lineupUtils'
import './LineupChangesBanner.css'

const MAX_VISIBLE = 4

function LineupChangesBanner({ game, injuredList }) {
  const { baseline, loading } = usePositionalBaseline()
  const [expanded, setExpanded] = useState(false)
  const seaLineup = getMarinersLineup(game)

  if (seaLineup.length === 0) return null
  if (loading || Object.keys(baseline).length === 0) return null

  const changes = buildLineupChangeChips(seaLineup, baseline, injuredList)
  const isTypical = changes.length === 0

  if (isTypical) {
    return (
      <div className="lineup-changes lineup-changes--typical">
        <span className="lineup-changes__typical-pill">typical lineup</span>
      </div>
    )
  }

  const visible = expanded ? changes : changes.slice(0, MAX_VISIBLE)
  const hiddenCount = changes.length - MAX_VISIBLE

  return (
    <div className="lineup-changes">
      <p className="lineup-changes__heading">Lineup changes today</p>
      <div className="lineup-changes__chips">
        {visible.map((chip) => (
          <span
            key={chip.id}
            className={`lineup-changes__chip ${chip.isIl ? 'lineup-changes__chip--il' : ''}`}
          >
            {chip.text}
          </span>
        ))}
        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            className="lineup-changes__more"
            onClick={() => setExpanded(true)}
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  )
}

export default LineupChangesBanner
