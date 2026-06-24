import './RosterFilterBar.css'

const POSITION_OPTIONS = ['All', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP']
const STATUS_OPTIONS = ['All', 'Active', 'IL', 'Options']
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'jersey', label: 'Jersey #' },
  { value: 'position', label: 'Position' },
  { value: 'status', label: 'Status' },
]

function RosterFilterBar({
  positionFilters,
  onPositionToggle,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="roster-filter-bar">
      <div className="roster-filter-bar__group">
        {POSITION_OPTIONS.map((pos) => {
          const isActive = pos === 'All'
            ? positionFilters.length === 0
            : positionFilters.includes(pos)

          return (
            <button
              key={pos}
              type="button"
              className={`roster-filter-bar__pill ${isActive ? 'roster-filter-bar__pill--active' : ''}`}
              onClick={() => onPositionToggle(pos)}
            >
              {pos}
            </button>
          )
        })}
      </div>

      <div className="roster-filter-bar__group roster-filter-bar__status">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            className={`roster-filter-bar__pill ${statusFilter === status ? 'roster-filter-bar__pill--active' : ''}`}
            onClick={() => onStatusChange(status)}
          >
            {status === 'Options' ? 'Options' : status}
          </button>
        ))}
      </div>

      <div className="roster-filter-bar__sort">
        <label htmlFor="roster-sort" className="roster-filter-bar__sort-label">
          Sort by:
        </label>
        <select
          id="roster-sort"
          className="roster-filter-bar__select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default RosterFilterBar
