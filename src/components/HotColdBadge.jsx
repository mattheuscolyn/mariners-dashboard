import './HotColdBadge.css'

const TREND_CONFIG = {
  hot: { emoji: '🔥', className: 'hot-cold-badge--hot' },
  cold: { emoji: '❄️', className: 'hot-cold-badge--cold' },
  neutral: { emoji: null, className: 'hot-cold-badge--neutral' },
}

function HotColdBadge({ trend = 'neutral', label }) {
  const config = TREND_CONFIG[trend] ?? TREND_CONFIG.neutral

  return (
    <span className={`hot-cold-badge ${config.className}`}>
      {config.emoji && (
        <span className="hot-cold-badge__emoji" aria-hidden="true">
          {config.emoji}
        </span>
      )}
      <span>{label}</span>
    </span>
  )
}

export default HotColdBadge
