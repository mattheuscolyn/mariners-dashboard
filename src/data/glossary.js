export const GLOSSARY = [
  {
    term: 'Batting Average',
    abbreviation: 'AVG',
    category: 'Hitting',
    definition:
      'Hits divided by at-bats. The most basic measure of how often a player gets a hit. League average is around .248.',
    leagueAvg: '.248',
  },
  {
    term: 'On-Base Percentage',
    abbreviation: 'OBP',
    category: 'Hitting',
    definition:
      'How often a player reaches base (hits + walks + hit-by-pitch). A better measure of offensive value than AVG.',
    leagueAvg: '.316',
  },
  {
    term: 'Slugging Percentage',
    abbreviation: 'SLG',
    category: 'Hitting',
    definition:
      'Total bases divided by at-bats. Rewards extra-base hits (doubles, triples, home runs) more than singles.',
    leagueAvg: '.405',
  },
  {
    term: 'On-Base Plus Slugging',
    abbreviation: 'OPS',
    category: 'Hitting',
    definition:
      'OBP + SLG combined. The single best quick measure of a hitter\'s total offensive value. Above .800 is good; above .900 is excellent.',
    leagueAvg: '.721',
    example: 'A player with a .350 OBP and .500 SLG has a .850 OPS.',
  },
  {
    term: 'Weighted Runs Created Plus',
    abbreviation: 'wRC+',
    category: 'Hitting',
    definition:
      'Measures overall offensive value, adjusted for ballpark and era. 100 is exactly league average. 120 means 20% better than average.',
  },
  {
    term: 'Batting Average on Balls In Play',
    abbreviation: 'BABIP',
    category: 'Hitting',
    definition:
      'AVG on balls that are hit into the field of play. High BABIP can indicate luck; very low can indicate bad luck. League average is around .300.',
    leagueAvg: '.300',
  },
  {
    term: 'Isolated Power',
    abbreviation: 'ISO',
    category: 'Hitting',
    definition:
      'SLG minus AVG — measures raw power. Above .200 is above average power.',
    example: 'A .500 SLG and .280 AVG gives an ISO of .220 — solid power.',
  },
  {
    term: 'Runs Batted In',
    abbreviation: 'RBI',
    category: 'Hitting',
    definition:
      'Runs scored because of a batter\'s hit, walk, or sacrifice — credit for driving in teammates.',
  },
  {
    term: 'Stolen Base',
    abbreviation: 'SB',
    category: 'Hitting',
    definition:
      'A base stolen by a basrunner during a pitch. Success rate above 75% is considered efficient.',
  },
  {
    term: 'Earned Run Average',
    abbreviation: 'ERA',
    category: 'Pitching',
    definition:
      'Earned runs allowed per 9 innings. The most common measure of a pitcher\'s effectiveness. Below 3.50 is excellent; above 5.00 is poor. League average is around 4.20.',
    leagueAvg: '4.20',
  },
  {
    term: 'Walks + Hits per Inning Pitched',
    abbreviation: 'WHIP',
    category: 'Pitching',
    definition:
      'How many baserunners a pitcher allows per inning. Below 1.10 is elite; above 1.40 is concerning.',
    leagueAvg: '1.31',
  },
  {
    term: 'Strikeouts per 9 Innings',
    abbreviation: 'K/9',
    category: 'Pitching',
    definition:
      'How many batters a pitcher strikes out per 9 innings. Above 9.0 is excellent.',
  },
  {
    term: 'Walks per 9 Innings',
    abbreviation: 'BB/9',
    category: 'Pitching',
    definition:
      'How many batters a pitcher walks per 9 innings. Lower is better — walks are free passes. Below 2.5 is great.',
  },
  {
    term: 'Fielding Independent Pitching',
    abbreviation: 'FIP',
    category: 'Pitching',
    definition:
      'Like ERA, but only counts strikeouts, walks, and home runs — things the pitcher fully controls. A better predictor of future ERA than ERA itself.',
  },
  {
    term: 'Innings Pitched',
    abbreviation: 'IP',
    category: 'Pitching',
    definition:
      'Total innings pitched. A starter typically goes 5–7 innings in a modern game.',
  },
  {
    term: 'Injured List',
    abbreviation: 'IL',
    category: 'General',
    definition:
      'The roster designation for injured players. The 10-Day IL requires a player to miss at least 10 days; the 60-Day IL is for longer injuries. Players on the IL don\'t count against the active 25-man roster.',
  },
  {
    term: 'Designated for Assignment',
    abbreviation: 'DFA',
    category: 'General',
    definition:
      'When a team removes a player from their 40-man roster. The player has 7 days to be traded, released, or claimed by another team.',
  },
  {
    term: 'Moneyline',
    abbreviation: 'Moneyline',
    category: 'General',
    definition:
      'A betting term for the straight-up odds on which team will win, used here to calculate implied win probability. A -150 line means a team is a ~60% favorite.',
    example: 'SEA -140 implies roughly a 58% chance to win.',
  },
  {
    term: 'Pythagorean Win-Loss',
    abbreviation: 'Pythagorean W-L',
    category: 'General',
    definition:
      'A formula that estimates a team\'s expected record based on runs scored vs. runs allowed. Teams often outperform or underperform their Pythagorean record over short stretches.',
  },
]

const CATEGORY_ORDER = ['Hitting', 'Pitching', 'Fielding', 'General']

export function getGlossaryEntry(key) {
  if (!key) return null
  const normalized = key.toLowerCase()
  return (
    GLOSSARY.find(
      (e) =>
        e.abbreviation.toLowerCase() === normalized ||
        e.term.toLowerCase() === normalized,
    ) ?? null
  )
}

export function getGlossaryByCategory(entries = GLOSSARY) {
  return CATEGORY_ORDER.map((category) => ({
    category,
    entries: entries.filter((e) => e.category === category),
  })).filter((g) => g.entries.length > 0)
}

export function getGlossaryLetters(entries = GLOSSARY) {
  const letters = new Set(
    entries.map((e) => e.term.charAt(0).toUpperCase()),
  )
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((l) => letters.has(l))
}

export function filterGlossary(query) {
  const q = query.trim().toLowerCase()
  if (!q) return GLOSSARY
  return GLOSSARY.filter(
    (e) =>
      e.term.toLowerCase().includes(q) ||
      e.abbreviation.toLowerCase().includes(q) ||
      e.definition.toLowerCase().includes(q),
  )
}
