import './Skeleton.css'

function Skeleton({ width = '100%', height = '1rem', borderRadius = 'var(--radius-md)' }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
