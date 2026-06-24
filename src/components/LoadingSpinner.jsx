import './LoadingSpinner.css'

function LoadingSpinner() {
  return (
    <div className="loading-spinner" role="status" aria-label="Loading">
      <div className="loading-spinner__ring" />
    </div>
  )
}

export default LoadingSpinner
