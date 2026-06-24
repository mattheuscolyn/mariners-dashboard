const BASE = 'https://api.the-odds-api.com/v4'

export async function getMLBOdds(apiKey, signal) {
  if (!apiKey) {
    return null
  }

  const url = `${BASE}/sports/baseball_mlb/odds?regions=us&markets=h2h&apiKey=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
