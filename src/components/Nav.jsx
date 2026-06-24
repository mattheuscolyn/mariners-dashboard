import { Link, NavLink } from 'react-router-dom'
import './Nav.css'

function MarinersLogo() {
  return (
    <svg
      className="nav-logo"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill="var(--color-navy)" stroke="var(--color-teal)" strokeWidth="1.5" />
      <text
        x="16"
        y="17"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-white)"
        fontFamily="var(--font-display)"
        fontSize="18"
        fontWeight="900"
        fontStyle="italic"
      >
        S
      </text>
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 2.3l6 5.4V18h-2v-5H8v5H6v-7.3l6-5.4z"
      />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5z"
      />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"
      />
    </svg>
  )
}

function NavLinkItem({ to, end, label, icon, Icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-link ${isActive ? 'nav-link--active' : ''}`
      }
      aria-label={label}
    >
      <span className="nav-link__text">{label}</span>
      <span className="nav-link__icon">{icon ?? <Icon />}</span>
    </NavLink>
  )
}

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <MarinersLogo />
          <span className="nav-title">Mariners Dashboard</span>
        </Link>
        <div className="nav-links">
          <NavLinkItem to="/" end label="Gameday" Icon={HomeIcon} />
          <NavLinkItem to="/roster" label="Roster" Icon={PersonIcon} />
          <NavLinkItem to="/glossary" label="Glossary" Icon={BookIcon} />
        </div>
      </div>
    </nav>
  )
}

export default Nav
