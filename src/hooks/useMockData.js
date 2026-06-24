import { createContext, useContext } from 'react'
import { mockGameStates, mockUpcomingSchedule, mockOdds } from '../data/mockGame'
import { mockRoster, mockInjuredList } from '../data/mockRoster'
import { mockBaseline } from '../data/mockBaseline'
import { normalizeRosterEntry } from '../utils/gameUtils'

export const MockBaselineContext = createContext(null)

export function useMockBaselineContext() {
  return useContext(MockBaselineContext)
}

const VALID_STATES = new Set([
  'pregame_announced',
  'pregame_unannounced',
  'live',
  'final',
  'offday',
])

export function useMockData(state = 'pregame_announced') {
  const resolvedState = VALID_STATES.has(state) ? state : 'pregame_announced'
  const isOffDay = resolvedState === 'offday'

  const jerseyMap = Object.fromEntries(
    mockRoster.map((p) => [p.person.id, p.jerseyNumber ?? p.person.primaryNumber]),
  )

  return {
    game: isOffDay ? null : mockGameStates[resolvedState],
    upcomingSchedule: isOffDay ? mockUpcomingSchedule : [],
    offDay: isOffDay,
    offseason: false,
    roster: mockRoster.map((entry) => normalizeRosterEntry(entry)),
    injuredList: mockInjuredList.map((entry) =>
      normalizeRosterEntry(entry, { isInjuryList: true }),
    ),
    jerseyMap,
    baseline: mockBaseline,
    odds: mockOdds,
    loading: false,
    error: null,
  }
}
