import Tooltip from './Tooltip'
import {
  barPosition,
  computePercentile,
  getContextCaptionWithOrdinal,
  getContextTier,
} from '../utils/leagueContextUtils'
import './StatContextBar.css'

function StatContextBar({
  label,
  value,
  displayValue,
  distribution,
  higherIsBetter = true,
  glossaryTerm,
}) {
  if (value == null || !distribution) return null

  const dotPos = barPosition(value, distribution.min, distribution.max)
  const avgPos = barPosition(distribution.mean, distribution.min, distribution.max)
  const percentile = computePercentile(value, distribution, higherIsBetter)
  const tier = getContextTier(percentile)
  const caption = getContextCaptionWithOrdinal(percentile)

  const labelEl = glossaryTerm ? (
    <Tooltip glossaryTerm={glossaryTerm}>
      <span className="stat-context__label">{label}</span>
    </Tooltip>
  ) : (
    <span className="stat-context__label">{label}</span>
  )

  return (
    <div className="stat-context">
      <div className="stat-context__header">
        {labelEl}
        <span className="stat-context__value">{displayValue}</span>
      </div>
      <div
        className="stat-context__bar-track"
        role="img"
        aria-label={`${label} ${displayValue}, ${caption}`}
      >
        <div className="stat-context__bar-fill" />
        <div
          className="stat-context__bar-avg"
          style={{ left: `${avgPos}%` }}
          aria-hidden="true"
        />
        <div
          className={`stat-context__bar-dot stat-context__bar-dot--${tier}`}
          style={{ left: `${dotPos}%` }}
          aria-hidden="true"
        />
      </div>
      <p className={`stat-context__caption stat-context__caption--${tier}`}>{caption}</p>
    </div>
  )
}

export default StatContextBar
