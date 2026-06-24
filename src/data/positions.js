export const POSITIONS = {
  C: {
    name: 'Catcher',
    desc: 'Crouches behind home plate, calls pitches, throws out baserunners.',
  },
  '1B': {
    name: 'First Base',
    desc: 'Covers first base, often a power hitter.',
  },
  '2B': {
    name: 'Second Base',
    desc: 'Middle infielder, covers the bag between first and second.',
  },
  '3B': {
    name: 'Third Base',
    desc: 'The "hot corner" — fields hard-hit balls down the line.',
  },
  SS: {
    name: 'Shortstop',
    desc: 'The most active infielder, covers the gap between second and third.',
  },
  LF: {
    name: 'Left Field',
    desc: 'Outfielder covering the left side of the outfield.',
  },
  CF: {
    name: 'Center Field',
    desc: 'Outfielder covering center — typically the fastest on the team.',
  },
  RF: {
    name: 'Right Field',
    desc: 'Outfielder covering the right side, often has the strongest arm.',
  },
  DH: {
    name: 'Designated Hitter',
    desc: 'Bats in place of the pitcher. Does not play defense.',
  },
  SP: {
    name: 'Starting Pitcher',
    desc: 'Takes the mound at the start of the game, usually pitches 5–7 innings.',
  },
  RP: {
    name: 'Relief Pitcher',
    desc: 'Comes in to replace the starter later in the game.',
  },
  CL: {
    name: 'Closer',
    desc: 'Relief pitcher who typically finishes games when the team is winning.',
  },
  P: {
    name: 'Pitcher',
    desc: 'Throws pitches to batters from the mound.',
  },
  OF: {
    name: 'Outfield',
    desc: 'Covers the outfield grass beyond the infield.',
  },
}

export function getPositionInfo(code) {
  return POSITIONS[code] ?? { name: code, desc: '' }
}

export function isPitcher(code) {
  return ['P', 'SP', 'RP', 'CL'].includes(code)
}
