import { MARINERS_ID } from '../services/mlbApi'

export const PLAYER_IDS = {
  crawford: 641487,
  emerson: 806068,
  raley: 670042,
  arozarena: 668227,
  raleigh: 663728,
  young: 702284,
  naylor: 647304,
  robles: 645302,
  rodriguez: 677594,
  kirby: 669923,
  keller: 656605,
  haniger: 571745,
  white: 657108,
  kelenic: 672284,
}

export const SEA_LINEUP_PLAYERS = [
  { id: PLAYER_IDS.crawford, fullName: 'J.P. Crawford', jerseyNumber: '3', position: 'SS', batOrder: 1 },
  { id: PLAYER_IDS.emerson, fullName: 'Colt Emerson', jerseyNumber: '10', position: '3B', batOrder: 2 },
  { id: PLAYER_IDS.raley, fullName: 'Luke Raley', jerseyNumber: '9', position: 'RF', batOrder: 3 },
  { id: PLAYER_IDS.arozarena, fullName: 'Randy Arozarena', jerseyNumber: '56', position: 'LF', batOrder: 4 },
  { id: PLAYER_IDS.raleigh, fullName: 'Cal Raleigh', jerseyNumber: '29', position: 'C', batOrder: 5 },
  { id: PLAYER_IDS.young, fullName: 'Cole Young', jerseyNumber: '11', position: '2B', batOrder: 6 },
  { id: PLAYER_IDS.naylor, fullName: 'Josh Naylor', jerseyNumber: '14', position: '1B', batOrder: 7 },
  { id: PLAYER_IDS.robles, fullName: 'Victor Robles', jerseyNumber: '14', position: 'CF', batOrder: 8 },
  { id: PLAYER_IDS.rodriguez, fullName: 'Julio Rodríguez', jerseyNumber: '44', position: 'DH', batOrder: 9 },
]

const PIT_LINEUP_PLAYERS = [
  { id: 663698, fullName: 'Oneil Cruz', jerseyNumber: '16', position: 'SS', batOrder: 1 },
  { id: 668804, fullName: 'Bryan Reynolds', jerseyNumber: '10', position: 'RF', batOrder: 2 },
  { id: 457705, fullName: 'Andrew McCutchen', jerseyNumber: '22', position: 'DH', batOrder: 3 },
  { id: 663647, fullName: 'Ke\'Bryan Hayes', jerseyNumber: '13', position: '3B', batOrder: 4 },
  { id: 665833, fullName: 'Nick Gonzales', jerseyNumber: '39', position: '2B', batOrder: 5 },
  { id: 671739, fullName: 'Jack Suwinski', jerseyNumber: '19', position: 'LF', batOrder: 6 },
  { id: 680779, fullName: 'Henry Davis', jerseyNumber: '32', position: 'C', batOrder: 7 },
  { id: 687462, fullName: 'Jared Triolo', jerseyNumber: '19', position: '1B', batOrder: 8 },
  { id: 680776, fullName: 'Joshua Palacios', jerseyNumber: '41', position: 'CF', batOrder: 9 },
]

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function tomorrowEveningPT() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(16, 10, 0, 0)
  return d.toISOString()
}

function baseTeams({ seaScore = 0, pitScore = 0 } = {}) {
  return {
    homeTeam: {
      id: 134,
      name: 'Pirates',
      city: 'Pittsburgh',
      abbreviation: 'PIT',
      record: { wins: 42, losses: 38, label: '42–38' },
      isMariners: false,
      score: pitScore,
    },
    awayTeam: {
      id: MARINERS_ID,
      name: 'Mariners',
      city: 'Seattle',
      abbreviation: 'SEA',
      record: { wins: 45, losses: 35, label: '45–35' },
      isMariners: true,
      score: seaScore,
    },
    isHome: false,
    venue: 'PNC Park',
    probablePitchers: {
      home: { id: PLAYER_IDS.keller, fullName: 'Mitch Keller', initials: 'MK' },
      away: { id: PLAYER_IDS.kirby, fullName: 'George Kirby', initials: 'GK' },
    },
  }
}

function withLineups(seaLineup, pitLineup = PIT_LINEUP_PLAYERS) {
  return {
    home: pitLineup,
    away: seaLineup,
  }
}

function buildGame({
  status,
  gameDate,
  lineups,
  linescore = null,
  seaScore = 0,
  pitScore = 0,
  gameId = 777001,
}) {
  const teams = baseTeams({ seaScore, pitScore })
  return {
    gameId,
    status,
    rawStatus: {
      abstractGameState:
        status === 'In Progress' ? 'Live' : status === 'Final' ? 'Final' : 'Preview',
      detailedState:
        status === 'In Progress' ? 'In Progress' : status === 'Final' ? 'Final' : 'Scheduled',
    },
    gameDate,
    ...teams,
    lineups,
    linescore,
  }
}

export const mockGameStates = {
  pregame_announced: buildGame({
    status: 'Scheduled',
    gameDate: hoursFromNow(2),
    lineups: withLineups(SEA_LINEUP_PLAYERS),
  }),

  pregame_unannounced: buildGame({
    status: 'Scheduled',
    gameDate: hoursFromNow(4),
    lineups: { home: [], away: [] },
  }),

  live: buildGame({
    status: 'In Progress',
    gameDate: hoursFromNow(-1.5),
    lineups: withLineups(SEA_LINEUP_PLAYERS),
    seaScore: 3,
    pitScore: 2,
    linescore: {
      currentInning: 5,
      inningState: 'Top',
      home: { runs: 2, hits: 6, errors: 0 },
      away: { runs: 3, hits: 7, errors: 1 },
    },
  }),

  final: buildGame({
    status: 'Final',
    gameDate: hoursFromNow(-4),
    lineups: withLineups(SEA_LINEUP_PLAYERS),
    seaScore: 3,
    pitScore: 2,
    linescore: {
      currentInning: 9,
      inningState: 'End',
      home: { runs: 2, hits: 8, errors: 1 },
      away: { runs: 3, hits: 9, errors: 0 },
    },
  }),

  offday: null,
}

export const mockUpcomingSchedule = [
  {
    gamePk: 777002,
    gameDate: tomorrowEveningPT(),
    teams: {
      home: {
        team: {
          id: 134,
          name: 'Pirates',
          locationName: 'Pittsburgh',
          teamName: 'Pirates',
          abbreviation: 'PIT',
        },
      },
      away: {
        team: {
          id: MARINERS_ID,
          name: 'Mariners',
          locationName: 'Seattle',
          teamName: 'Mariners',
          abbreviation: 'SEA',
        },
      },
    },
    status: { abstractGameState: 'Preview', detailedState: 'Scheduled' },
  },
  {
    gamePk: 777003,
    gameDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    teams: {
      home: {
        team: {
          id: 134,
          name: 'Pirates',
          locationName: 'Pittsburgh',
          teamName: 'Pirates',
          abbreviation: 'PIT',
        },
      },
      away: {
        team: {
          id: MARINERS_ID,
          name: 'Mariners',
          locationName: 'Seattle',
          teamName: 'Mariners',
          abbreviation: 'SEA',
        },
      },
    },
    status: { abstractGameState: 'Preview', detailedState: 'Scheduled' },
  },
]

export const mockOdds = {
  homeOdds: -130,
  awayOdds: 110,
  seattleOdds: 110,
  oppOdds: -130,
  impliedWinPct: 0.476,
  seattleIsHome: false,
}
