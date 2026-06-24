import './StatBadge.css'

function StatBadge({ label, value, context }) {
  return (
    <div className="stat-badge">
      <div className="stat-badge__value">{value}</div>
      <div className="stat-badge__label">{label}</div>
      {context && <div className="stat-badge__context">{context}</div>}
    </div>
  )
}

export default StatBadge
