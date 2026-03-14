import { useState } from 'react'
import { Search } from 'lucide-react'
import './AppStoreWindow.css'

const SECTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'games', label: 'Games' },
  { id: 'apps', label: 'Apps' },
  { id: 'arcade', label: 'Arcade' },
]

export default function AppStoreWindow() {
  const [activeSection, setActiveSection] = useState('today')
  const [selectedCard, setSelectedCard] = useState(null)

  return (
    <div className="app-store-window">
      <nav className="app-store-window__nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`app-store-window__nav-item ${activeSection === s.id ? 'app-store-window__nav-item--active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          className="app-store-window__search-wrap"
          onClick={() => {}}
        >
          <Search size={16} />
          <span className="app-store-window__search-label">Search</span>
        </button>
      </nav>
      <main className="app-store-window__main">
        <section className="app-store-window__banner">
          <div className="app-store-window__banner-inner" />
        </section>
        <section className="app-store-window__row">
          <h2 className="app-store-window__row-title">{SECTIONS.find((s) => s.id === activeSection)?.label ?? 'Today'}</h2>
          <div className="app-store-window__row-scroll">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className="app-store-window__card app-store-window__card--large"
                onClick={() => setSelectedCard({ section: activeSection, index: i })}
              />
            ))}
          </div>
        </section>
        <section className="app-store-window__row">
          <h2 className="app-store-window__row-title">Featured</h2>
          <div className="app-store-window__row-scroll">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <button
                key={i}
                type="button"
                className="app-store-window__card"
                onClick={() => setSelectedCard({ section: 'featured', index: i })}
              />
            ))}
          </div>
        </section>
      </main>
      {selectedCard && (
        <div
          className="app-store-window__modal"
          role="dialog"
          aria-label="App details"
          onClick={() => setSelectedCard(null)}
        >
          <div className="app-store-window__modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="app-store-window__modal-close"
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="app-store-window__modal-placeholder">App details — add your apps here.</p>
          </div>
        </div>
      )}
    </div>
  )
}
