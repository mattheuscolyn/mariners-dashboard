import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()
  const hasOddsKey = !!import.meta.env.VITE_ODDS_API_KEY

  return (
    <footer className="footer">
      <p className="footer__text">
        Data provided by MLB Stats API. Not affiliated with or endorsed by
        Major League Baseball or the Seattle Mariners.
      </p>
      {hasOddsKey && (
        <p className="footer__text">Odds data via The Odds API.</p>
      )}
      <p className="footer__text footer__copy">© {year}</p>
    </footer>
  )
}

export default Footer
