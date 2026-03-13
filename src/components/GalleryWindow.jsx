import { Search, Grid3X3, LayoutGrid } from 'lucide-react'
import './GalleryWindow.css'

export default function GalleryWindow() {
  return (
    <div className="gallery-window">
      <aside className="gallery-window__sidebar">
        <nav className="gallery-window__nav">
          <button type="button" className="gallery-window__nav-item gallery-window__nav-item--active">
            Recents
          </button>
          <button type="button" className="gallery-window__nav-item">
            Favorites
          </button>
          <button type="button" className="gallery-window__nav-item">
            Albums
          </button>
        </nav>
        <div className="gallery-window__albums">
          <h3 className="gallery-window__sidebar-title">My Albums</h3>
          <ul className="gallery-window__album-list">
            <li className="gallery-window__album-item">Vacation</li>
            <li className="gallery-window__album-item">Screenshots</li>
            <li className="gallery-window__album-item">Portraits</li>
          </ul>
        </div>
      </aside>
      <main className="gallery-window__main">
        <header className="gallery-window__toolbar">
          <div className="gallery-window__search-wrap">
            <Search size={16} className="gallery-window__search-icon" />
            <input
              type="search"
              placeholder="Search photos..."
              className="gallery-window__search"
              readOnly
            />
          </div>
          <div className="gallery-window__view-options">
            <button type="button" className="gallery-window__view-btn gallery-window__view-btn--active" aria-label="Grid view">
              <Grid3X3 size={18} />
            </button>
            <button type="button" className="gallery-window__view-btn" aria-label="List view">
              <LayoutGrid size={18} />
            </button>
          </div>
        </header>
        <div className="gallery-window__grid">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="gallery-window__cell" />
          ))}
        </div>
      </main>
    </div>
  )
}
