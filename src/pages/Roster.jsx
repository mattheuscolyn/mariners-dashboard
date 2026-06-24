import { useState, useMemo } from 'react'
import { useRoster } from '../hooks/useRoster'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import RosterFilterBar from '../components/RosterFilterBar'
import RosterTable from '../components/RosterTable'
import { filterRoster, sortRoster } from '../utils/rosterUtils'
import './Roster.css'

const CURRENT_SEASON = new Date().getFullYear()

function Roster() {
  const { roster, injuredList, loading, error } = useRoster()
  const [positionFilters, setPositionFilters] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const [ilOpen, setIlOpen] = useState(true)

  const injuredIds = useMemo(
    () => new Set(injuredList.map((p) => p.id)),
    [injuredList],
  )

  const activeRoster = useMemo(
    () => roster.filter((p) => !injuredIds.has(p.id)),
    [roster, injuredIds],
  )

  const filteredPlayers = useMemo(() => {
    if (statusFilter === 'IL') {
      return sortRoster(injuredList, sortBy)
    }

    const filtered = filterRoster(activeRoster, {
      positions: positionFilters,
      statusFilter,
      injuredIds,
    })
    return sortRoster(filtered, sortBy)
  }, [activeRoster, injuredList, positionFilters, statusFilter, sortBy, injuredIds])

  const sortedInjured = useMemo(
    () => sortRoster(injuredList, sortBy),
    [injuredList, sortBy],
  )

  function handlePositionToggle(pos) {
    if (pos === 'All') {
      setPositionFilters([])
      return
    }
    setPositionFilters((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    )
  }

  if (loading) {
    return (
      <div className="roster roster--loading">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="roster">
      <header className="roster__header">
        <h1 className="roster__title">40-Man Roster</h1>
        <p className="roster__subtitle">
          Seattle Mariners · {CURRENT_SEASON}
        </p>
      </header>

      <RosterFilterBar
        positionFilters={positionFilters}
        onPositionToggle={handlePositionToggle}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <RosterTable
        players={filteredPlayers}
        showInjury={statusFilter === 'IL'}
      />

      <section className="roster__il">
        <button
          type="button"
          className="roster__il-toggle"
          onClick={() => setIlOpen((o) => !o)}
          aria-expanded={ilOpen}
        >
          <span>Injured List ({injuredList.length})</span>
          <span className={`roster__chevron ${ilOpen ? 'roster__chevron--open' : ''}`}>
            ›
          </span>
        </button>
        {ilOpen && (
          <div className="roster__il-content">
            <RosterTable players={sortedInjured} showInjury />
          </div>
        )}
      </section>
    </div>
  )
}

export default Roster
