import Card from './Card'
import { MARINERS_ID } from '../services/mlbApi'
import { formatGameTimePT, getDayLabel } from '../utils/gameUtils'
import './OffDaySchedule.css'

function getOpponentName(rawGame) {
  const homeId = rawGame.teams?.home?.team?.id
  const isHome = homeId === MARINERS_ID
  const opponent = isHome
    ? rawGame.teams?.away?.team
    : rawGame.teams?.home?.team
  const prefix = isHome ? 'vs' : '@'
  return `${prefix} ${opponent?.locationName ?? ''} ${opponent?.name ?? opponent?.teamName ?? 'TBD'}`.trim()
}

function OffDaySchedule({ upcomingSchedule, offseason }) {
  const nextSeason = new Date().getFullYear() + (new Date().getMonth() >= 10 ? 1 : 0)

  if (offseason) {
    return (
      <Card className="off-day off-day--offseason">
        <h2 className="off-day__title">See you in spring training</h2>
        <p className="off-day__message">
          The Mariners season is on pause. Spring training for the {nextSeason} season
          typically begins in mid-February — check back then for fresh stats and lineups.
        </p>
      </Card>
    )
  }

  return (
    <Card className="off-day">
      <h2 className="off-day__title">The Mariners are off. Here&apos;s what&apos;s coming up.</h2>
      {upcomingSchedule.length === 0 ? (
        <p className="off-day__message">No upcoming games found on the schedule.</p>
      ) : (
        <ul className="off-day__list">
          {upcomingSchedule.map((g) => (
            <li key={g.gamePk} className="off-day__item">
              <span className="off-day__date">{getDayLabel(g.gameDate)}</span>
              <span className="off-day__opponent">{getOpponentName(g)}</span>
              <span className="off-day__time">{formatGameTimePT(g.gameDate)} PT</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default OffDaySchedule
