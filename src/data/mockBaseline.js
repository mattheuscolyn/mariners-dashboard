import { SEA_LINEUP_PLAYERS, PLAYER_IDS } from './mockGame'

function lineupPlayerForPos(pos) {
  return SEA_LINEUP_PLAYERS.find((p) => p.position === pos)
}

const POSITIONS = ['SS', '3B', 'RF', 'LF', 'C', '2B', '1B', 'CF', 'DH']

export const mockBaseline = Object.fromEntries(
  POSITIONS.map((pos) => {
    if (pos === 'RF') {
      return [
        pos,
        {
          playerId: PLAYER_IDS.haniger,
          fullName: 'Mitch Haniger',
          gamesStarted: 48,
        },
      ]
    }
    const player = lineupPlayerForPos(pos)
    return [
      pos,
      {
        playerId: player.id,
        fullName: player.fullName,
        gamesStarted: 72,
      },
    ]
  }),
)

export const mockPlayerPositionStarts = {
  [PLAYER_IDS.rodriguez]: [
    { position: 'CF', gamesStarted: 98 },
    { position: 'DH', gamesStarted: 18 },
    { position: 'RF', gamesStarted: 4 },
  ],
  [PLAYER_IDS.raley]: [
    { position: 'LF', gamesStarted: 34 },
    { position: 'RF', gamesStarted: 22 },
    { position: '1B', gamesStarted: 8 },
  ],
  [PLAYER_IDS.emerson]: [
    { position: '3B', gamesStarted: 52 },
    { position: 'SS', gamesStarted: 14 },
    { position: '2B', gamesStarted: 6 },
  ],
  [PLAYER_IDS.young]: [
    { position: '2B', gamesStarted: 68 },
    { position: 'DH', gamesStarted: 12 },
  ],
  [PLAYER_IDS.naylor]: [
    { position: '1B', gamesStarted: 61 },
    { position: 'DH', gamesStarted: 9 },
  ],
  [PLAYER_IDS.robles]: [
    { position: 'CF', gamesStarted: 28 },
    { position: 'LF', gamesStarted: 11 },
  ],
  [PLAYER_IDS.crawford]: [{ position: 'SS', gamesStarted: 72 }],
  [PLAYER_IDS.arozarena]: [{ position: 'LF', gamesStarted: 72 }],
  [PLAYER_IDS.raleigh]: [{ position: 'C', gamesStarted: 72 }],
}
