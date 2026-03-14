import { useState } from 'react'
import './NetflixWindow.css'

const ROWS = [
  { id: 'trending', title: 'Trending Now', count: 6 },
  { id: 'mylist', title: 'My List', count: 6 },
  { id: 'continue', title: 'Continue Watching', count: 5 },
  { id: 'popular', title: 'Popular on Netflix', count: 6 },
]

export default function NetflixWindow() {
  const [selectedCard, setSelectedCard] = useState(null)

  return (
    <div className="netflix-window">
      <div className="netflix-window__hero" />
      <main className="netflix-window__content">
        {ROWS.map((row) => (
          <section key={row.id} className="netflix-window__row">
            <h2 className="netflix-window__row-title">{row.title}</h2>
            <div className="netflix-window__cards">
              {Array.from({ length: row.count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="netflix-window__card"
                  onClick={() => setSelectedCard({ row: row.id, index: i })}
                >
                  <div className="netflix-window__card-poster" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>
      {selectedCard && (
        <div
          className="netflix-window__modal"
          role="dialog"
          aria-label="Title details"
          onClick={() => setSelectedCard(null)}
        >
          <div className="netflix-window__modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="netflix-window__modal-close"
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="netflix-window__modal-placeholder">
              <p>Summary placeholder — add movies/TV via data array; wire Apify API when ready.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
