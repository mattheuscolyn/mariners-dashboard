import { Suspense, lazy, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNextGame } from '../hooks/useNextGame'
import { useRoster } from '../hooks/useRoster'
import { useOdds } from '../hooks/useOdds'
import { useMockData, MockBaselineContext } from '../hooks/useMockData'
import ErrorMessage from '../components/ErrorMessage'
import OffDaySchedule from '../components/OffDaySchedule'
import Skeleton from '../components/Skeleton'
import './Dashboard.css'

const GameHeader = lazy(() => import('../components/GameHeader'))
const MatchupStrip = lazy(() => import('../components/MatchupStrip'))
const LineupView = lazy(() => import('../components/LineupView'))
const WatchFor = lazy(() => import('../components/WatchFor'))
const OpponentIntel = lazy(() => import('../components/OpponentIntel'))

const MOCK_STATES = [
  'pregame_announced',
  'pregame_unannounced',
  'live',
  'final',
  'offday',
]

function SectionFallback({ tall = false }) {
  return (
    <div className={`dashboard__skeleton ${tall ? 'dashboard__skeleton--tall' : ''}`}>
      <Skeleton height="2rem" width="60%" />
      <Skeleton height="1rem" width="40%" />
      <Skeleton height="8rem" />
    </div>
  )
}

function LastUpdated({ pollActive = false }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const intervalMs = pollActive ? 5 * 60 * 1000 : 60_000
    const interval = setInterval(() => setTime(new Date()), intervalMs)
    return () => clearInterval(interval)
  }, [pollActive])

  return (
    <p className="dashboard__updated">
      Data last updated:{' '}
      {time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      })}{' '}
      PT
      {pollActive && ' · live refresh every 5 min'}
    </p>
  )
}

function DevMockBanner({ mockState, setSearchParams }) {
  function switchState(state) {
    setSearchParams({ mock: state })
  }

  return (
    <div className="dev-mock-banner" role="status" aria-live="polite">
      <p className="dev-mock-banner__label">DEV MODE — Mock state: {mockState}</p>
      <div className="dev-mock-banner__pills">
        {MOCK_STATES.map((state) => (
          <button
            key={state}
            type="button"
            className={`dev-mock-banner__pill ${state === mockState ? 'dev-mock-banner__pill--active' : ''}`}
            onClick={() => switchState(state)}
          >
            {state}
          </button>
        ))}
      </div>
    </div>
  )
}

function DashboardContent({
  game,
  upcomingSchedule,
  offDay,
  offseason,
  roster,
  injuredList,
  jerseyMap,
  odds,
  oddsError,
  rosterError,
  livePoll = false,
}) {
  if (!game && (offDay || offseason)) {
    return (
      <div className="dashboard">
        <OffDaySchedule upcomingSchedule={upcomingSchedule} offseason={offseason} />
        <LastUpdated pollActive={livePoll} />
      </div>
    )
  }

  if (!game) {
    return <ErrorMessage message="No upcoming Mariners game found." />
  }

  return (
    <div className="dashboard">
      <Suspense fallback={<SectionFallback />}>
        <section className="dashboard__section dashboard__section--full">
          <GameHeader game={game} />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section className="dashboard__section dashboard__section--full">
          {oddsError ? (
            <ErrorMessage message={oddsError} />
          ) : (
            <MatchupStrip game={game} oddsData={odds} />
          )}
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback tall />}>
        <section className="dashboard__section dashboard__section--lineup">
          {rosterError ? (
            <ErrorMessage message={rosterError} />
          ) : (
            <LineupView game={game} roster={roster} injuredList={injuredList} jerseyMap={jerseyMap} />
          )}
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section className="dashboard__section dashboard__section--watch">
          <WatchFor game={game} roster={roster} injuredList={injuredList} />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section className="dashboard__section dashboard__section--intel">
          <OpponentIntel game={game} />
        </section>
      </Suspense>

      <LastUpdated pollActive={livePoll} />
    </div>
  )
}

function DashboardLive() {
  const { game, upcomingSchedule, offDay, offseason, loading, error } = useNextGame()
  const { roster, injuredList, jerseyMap, error: rosterError } = useRoster()
  const { odds, error: oddsError } = useOdds()

  if (loading) {
    return (
      <div className="dashboard dashboard--loading">
        <SectionFallback tall />
        <SectionFallback />
        <SectionFallback tall />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  const livePoll = game?.status === 'In Progress'

  return (
    <DashboardContent
      game={game}
      upcomingSchedule={upcomingSchedule}
      offDay={offDay}
      offseason={offseason}
      roster={roster}
      injuredList={injuredList}
      jerseyMap={jerseyMap}
      odds={odds}
      oddsError={oddsError}
      rosterError={rosterError}
      livePoll={livePoll}
    />
  )
}

function DashboardMock({ mockState }) {
  const [, setSearchParams] = useSearchParams()
  const data = useMockData(mockState)
  const livePoll = mockState === 'live'

  return (
    <MockBaselineContext.Provider value={data.baseline}>
      <div className="dashboard-mock-wrap">
        <DashboardContent
        game={data.game}
        upcomingSchedule={data.upcomingSchedule}
        offDay={data.offDay}
        offseason={data.offseason}
        roster={data.roster}
        injuredList={data.injuredList}
        jerseyMap={data.jerseyMap}
        odds={data.odds}
        oddsError={null}
        rosterError={null}
        livePoll={livePoll}
      />
      <DevMockBanner mockState={mockState} setSearchParams={setSearchParams} />
      </div>
    </MockBaselineContext.Provider>
  )
}

function Dashboard() {
  const [searchParams] = useSearchParams()
  const mockState = searchParams.get('mock')

  if (mockState) {
    return <DashboardMock mockState={mockState} />
  }

  return <DashboardLive />
}

export default Dashboard
