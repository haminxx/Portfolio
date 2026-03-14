import { useState } from 'react'
import { Search, Grid3X3, LayoutGrid } from 'lucide-react'
import './GalleryWindow.css'

// Supports mixed formats: place your 24 images in public/gallery/ as photo-1.png, photo-2.jpg, etc.
const getImagePaths = (i) => [`/gallery/photo-${i + 1}.png`, `/gallery/photo-${i + 1}.jpg`, `/gallery/photo-${i + 1}.jpeg`]

const ALBUMS = ['Vacation', 'Screenshots', 'Portraits']

function GalleryImage({ paths }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [hasError, setHasError] = useState(false)
  const src = paths[currentIdx]

  const handleError = () => {
    if (currentIdx < paths.length - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      setHasError(true)
    }
  }

  if (hasError) {
    return <div className="gallery-window__cell-placeholder" />
  }

  return (
    <img
      src={src}
      alt=""
      className="gallery-window__cell-img"
      onError={handleError}
    />
  )
}

export default function GalleryWindow() {
  const [activeSection, setActiveSection] = useState('recents')
  const [activeAlbum, setActiveAlbum] = useState(null)
  const [viewMode, setViewMode] = useState('grid')

  const handleAlbumClick = (album) => {
    setActiveSection('albums')
    setActiveAlbum(album)
  }

  return (
    <div className="gallery-window">
      <aside className="gallery-window__sidebar">
        <nav className="gallery-window__nav">
          <button
            type="button"
            className={`gallery-window__nav-item ${activeSection === 'recents' ? 'gallery-window__nav-item--active' : ''}`}
            onClick={() => { setActiveSection('recents'); setActiveAlbum(null) }}
          >
            Recents
          </button>
          <button
            type="button"
            className={`gallery-window__nav-item ${activeSection === 'favorites' ? 'gallery-window__nav-item--active' : ''}`}
            onClick={() => { setActiveSection('favorites'); setActiveAlbum(null) }}
          >
            Favorites
          </button>
          <button
            type="button"
            className={`gallery-window__nav-item ${activeSection === 'albums' ? 'gallery-window__nav-item--active' : ''}`}
            onClick={() => { setActiveSection('albums'); setActiveAlbum(null) }}
          >
            Albums
          </button>
        </nav>
        <div className="gallery-window__albums">
          <h3 className="gallery-window__sidebar-title">My Albums</h3>
          <ul className="gallery-window__album-list">
            {ALBUMS.map((album) => (
              <li
                key={album}
                className={`gallery-window__album-item ${activeAlbum === album ? 'gallery-window__album-item--active' : ''}`}
                onClick={() => handleAlbumClick(album)}
              >
                {album}
              </li>
            ))}
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
            <button
              type="button"
              className={`gallery-window__view-btn ${viewMode === 'grid' ? 'gallery-window__view-btn--active' : ''}`}
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              type="button"
              className={`gallery-window__view-btn ${viewMode === 'list' ? 'gallery-window__view-btn--active' : ''}`}
              aria-label="List view"
              onClick={() => setViewMode('list')}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </header>
        <div className={`gallery-window__grid ${viewMode === 'list' ? 'gallery-window__grid--list' : ''}`}>
          {activeSection === 'recents' && (
            <p className="gallery-window__section-hint">Showing recent photos</p>
          )}
          {activeSection === 'favorites' && (
            <p className="gallery-window__section-hint">Favorites — tap heart on photos to add</p>
          )}
          {activeSection === 'albums' && activeAlbum && (
            <p className="gallery-window__section-hint">Album: {activeAlbum}</p>
          )}
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="gallery-window__cell">
              <GalleryImage paths={getImagePaths(i)} />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
