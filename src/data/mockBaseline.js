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
