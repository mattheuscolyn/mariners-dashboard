export const HITTER_STATS = {
  AVG: {
    term: 'AVG',
    definition: 'Batting Average — hits divided by at-bats. League average is typically around .248.',
  },
  OBP: {
    term: 'OBP',
    definition: 'On-Base Percentage — how often a batter reaches base (hits, walks, hit-by-pitch).',
  },
  SLG: {
    term: 'SLG',
    definition: 'Slugging Percentage — measures power by weighting extra-base hits.',
  },
  OPS: {
    term: 'OPS',
    definition: 'On-Base Plus Slugging — combines OBP and SLG into one number. .721 is league average.',
  },
  HR: {
    term: 'HR',
    definition: 'Home Runs — hits that clear the outfield fence.',
  },
  RBI: {
    term: 'RBI',
    definition: 'Runs Batted In — runs scored as a result of a batter\'s plate appearance.',
  },
  SB: {
    term: 'SB',
    definition: 'Stolen Bases — successfully advancing to the next base while the pitcher delivers.',
  },
}

export const PITCHER_STATS = {
  ERA: {
    term: 'ERA',
    definition: 'Earned Run Average — earned runs allowed per 9 innings. 4.20 is league average.',
  },
  WHIP: {
    term: 'WHIP',
    definition: 'Walks + Hits per Inning Pitched — measures baserunners allowed. 1.31 is league average.',
  },
  'K/9': {
    term: 'K/9',
    definition: 'Strikeouts per 9 innings — measures strikeout rate.',
  },
  'BB/9': {
    term: 'BB/9',
    definition: 'Walks per 9 innings — measures control.',
  },
  W: {
    term: 'W',
    definition: 'Wins — games where the pitcher was the pitcher of record when the team took the lead.',
  },
  L: {
    term: 'L',
    definition: 'Losses — games where the pitcher was responsible for the opposing lead.',
  },
  SV: {
    term: 'SV',
    definition: 'Saves — finishing a close game that the team is winning.',
  },
}

export const LEAGUE_AVG_HITTER = '.248 AVG · .316 OBP · .405 SLG · .721 OPS'
export const LEAGUE_AVG_PITCHER = '4.20 ERA · 1.31 WHIP'
