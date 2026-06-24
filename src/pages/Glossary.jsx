import { useState, useMemo } from 'react'
import {
  filterGlossary,
  getGlossaryByCategory,
  getGlossaryLetters,
} from '../data/glossary'
import './Glossary.css'

function GlossaryEntry({ entry }) {
  return (
    <article
      className="glossary-entry"
      id={`glossary-${entry.term.charAt(0).toUpperCase()}-${entry.abbreviation}`}
    >
      <h3 className="glossary-entry__term">
        {entry.term}{' '}
        <span className="glossary-entry__abbr">({entry.abbreviation})</span>
      </h3>
      <p className="glossary-entry__definition">{entry.definition}</p>
      {entry.leagueAvg && (
        <p className="glossary-entry__avg">MLB avg: {entry.leagueAvg}</p>
      )}
      {entry.example && (
        <p className="glossary-entry__example">{entry.example}</p>
      )}
    </article>
  )
}

function Glossary() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => filterGlossary(search), [search])
  const grouped = useMemo(() => getGlossaryByCategory(filtered), [filtered])
  const letters = useMemo(() => getGlossaryLetters(filtered), [filtered])

  const letterAnchors = useMemo(() => {
    const map = {}
    for (const entry of filtered) {
      const letter = entry.term.charAt(0).toUpperCase()
      if (!map[letter]) {
        map[letter] = `glossary-${letter}-${entry.abbreviation}`
      }
    }
    return map
  }, [filtered])

  return (
    <div className="glossary-page">
      <header className="glossary-page__header">
        <h1 className="glossary-page__title">Baseball Glossary</h1>
        <p className="glossary-page__subtitle">
          Plain-English explanations for every stat and term on this dashboard.
        </p>
      </header>

      <div className="glossary-page__search-wrap">
        <input
          type="search"
          className="glossary-page__search"
          placeholder="Search terms and definitions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search glossary"
        />
      </div>

      {!search && (
        <nav className="glossary-page__az" aria-label="Jump to letter">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#${letterAnchors[letter]}`}
              className="glossary-page__az-link"
            >
              {letter}
            </a>
          ))}
        </nav>
      )}

      {filtered.length === 0 ? (
        <p className="glossary-page__empty">No terms match your search.</p>
      ) : (
        grouped.map(({ category, entries }) => (
          <section key={category} className="glossary-page__category">
            <h2 className="glossary-page__category-title">{category}</h2>
            <div className="glossary-page__entries">
              {entries.map((entry) => (
                <GlossaryEntry key={entry.abbreviation} entry={entry} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

export default Glossary
