import { Search } from 'lucide-react'
import './AppStoreWindow.css'

export default function AppStoreWindow() {
  return (
    <div className="app-store-window">
      <nav className="app-store-window__nav">
        <button type="button" className="app-store-window__nav-item app-store-window__nav-item--active">
          Today
        </button>
        <button type="button" className="app-store-window__nav-item">
          Games
        </button>
        <button type="button" className="app-store-window__nav-item">
          Apps
        </button>
        <button type="button" className="app-store-window__nav-item">
          Arcade
        </button>
        <div className="app-store-window__search-wrap">
          <Search size={16} />
          <span className="app-store-window__search-label">Search</span>
        </div>
      </nav>
      <main className="app-store-window__main">
        <section className="app-store-window__banner">
          <div className="app-store-window__banner-inner" />
        </section>
        <section className="app-store-window__row">
          <h2 className="app-store-window__row-title">Today</h2>
          <div className="app-store-window__row-scroll">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="app-store-window__card app-store-window__card--large" />
            ))}
          </div>
        </section>
        <section className="app-store-window__row">
          <h2 className="app-store-window__row-title">Games</h2>
          <div className="app-store-window__row-scroll">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="app-store-window__card" />
            ))}
          </div>
        </section>
        <section className="app-store-window__row">
          <h2 className="app-store-window__row-title">Apps</h2>
          <div className="app-store-window__row-scroll">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="app-store-window__card" />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
