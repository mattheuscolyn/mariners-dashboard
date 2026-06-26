import { PLAYER_IDS, SEA_LINEUP_PLAYERS } from './mockGame'

function rosterEntry(id, fullName, position, jerseyNumber, status = { code: 'A', description: 'Active' }) {
  return {
    person: { id, fullName, primaryNumber: String(jerseyNumber) },
    position: { abbreviation: position },
    jerseyNumber: String(jerseyNumber),
    status,
  }
}

function ilEntry(id, fullName, position, jerseyNumber, code, description, notes) {
  return {
    person: { id, fullName, primaryNumber: String(jerseyNumber) },
    position: { abbreviation: position },
    jerseyNumber: String(jerseyNumber),
    status: { code, description },
    notes,
  }
}

export const mockRoster = [
  ...SEA_LINEUP_PLAYERS.map((p) => {
    const rosterPos = p.id === PLAYER_IDS.rodriguez ? 'CF' : p.position
    return rosterEntry(p.id, p.fullName, rosterPos, p.jerseyNumber)
  }),
  ilEntry(
    PLAYER_IDS.white,
    'Evan White',
    '1B',
    '12',
    'D60',
    'Injured 60-Day',
    'right ACL',
  ),
  ilEntry(
    PLAYER_IDS.kelenic,
    'Jarred Kelenic',
    'LF',
    '25',
    'D10',
    'Injured 10-Day',
    'oblique strain',
  ),
]

export const mockInjuredList = [
  ilEntry(
    PLAYER_IDS.raleigh,
    'Cal Raleigh',
    'C',
    '29',
    'D10',
    'Injured 10-Day',
    'left hand contusion',
  ),
  ilEntry(
    PLAYER_IDS.haniger,
    'Mitch Haniger',
    'RF',
    '17',
    'D10',
    'Injured 10-Day',
    'back strain',
  ),
  ilEntry(
    PLAYER_IDS.white,
    'Evan White',
    '1B',
    '12',
    'D60',
    'Injured 60-Day',
    'right ACL',
  ),
  ilEntry(
    PLAYER_IDS.kelenic,
    'Jarred Kelenic',
    'LF',
    '25',
    'D10',
    'Injured 10-Day',
    'oblique strain',
  ),
]
