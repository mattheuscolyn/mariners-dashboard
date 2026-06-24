import './Card.css'

function Card({ children, className = '', glowTeal = false }) {
  const classes = [
    'card',
    glowTeal ? 'card--glow-teal' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}

export default Card
