# Mariners Gameday Dashboard

🌐 **Live:** https://mattheuscolyn.github.io/mariners-dashboard/

A single-page gameday dashboard for the Seattle Mariners — today's game, lineups, matchup intel, roster explorer, and a stat glossary. Built with React + Vite, powered by the MLB Stats API.

## Local setup

```bash
git clone https://github.com/mattheuscolyn/mariners-dashboard.git
cd mariners-dashboard
npm install
cp .env.example .env   # optional: add Odds API key
npm run dev
```

Open http://localhost:5173/mariners-dashboard/

### Dev mock mode

Append `?mock=<state>` to preview the dashboard without a live game:

- `pregame_announced` · `pregame_unannounced` · `live` · `final` · `offday`

Example: http://localhost:5173/mariners-dashboard/?mock=pregame_announced

## Deploy

```bash
npm run deploy
```

This rebuilds `docs/`, commits the output, and pushes to `main`. GitHub Pages serves from the `/docs` folder — changes are live within ~60 seconds.

## Data sources

- **MLB Stats API** — schedules, rosters, lineups, player stats (free, no API key)
- **The Odds API** — moneyline implied win probability (optional; requires `VITE_ODDS_API_KEY` in `.env`)

## Disclaimer

This is an unofficial fan project. Not affiliated with MLB or the Seattle Mariners.
