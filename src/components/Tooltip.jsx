import { useId } from 'react'
import { getPositionInfo } from '../data/positions'
import { getGlossaryEntry } from '../data/glossary'
import './Tooltip.css'

function Tooltip({ term, definition, positionCode, glossaryTerm, children }) {
  const tooltipId = useId()

  let displayTerm = term
  let displayDefinition = definition

  if (glossaryTerm) {
    const entry = getGlossaryEntry(glossaryTerm)
    if (entry) {
      displayTerm = `${entry.term} (${entry.abbreviation})`
      displayDefinition = entry.definition
    }
  } else if (positionCode) {
    const info = getPositionInfo(positionCode)
    displayTerm = info.name
    displayDefinition = info.desc
  }

  return (
    <span className="tooltip">
      <span
        className="tooltip__trigger"
        tabIndex={0}
        aria-describedby={tooltipId}
      >
        {children}
      </span>
      <span id={tooltipId} role="tooltip" className="tooltip__content">
        <span className="tooltip__term">{displayTerm}</span>
        <span className="tooltip__definition">{displayDefinition}</span>
      </span>
    </span>
  )
}

export default Tooltip
