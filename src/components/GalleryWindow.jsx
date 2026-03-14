import { useState, useCallback } from 'react'
import { Search, Grid3X3, LayoutGrid, Heart } from 'lucide-react'
import './GalleryWindow.css'

const GALLERY_SIZE = 24
const getImagePath = (i) => `/gallery/photo-${i + 1}.png`

const PHOTO_METADATA = Object.fromEntries(
  Array.from({ length: GALLERY_SIZE }, (_, i) => [
    i,
    { name: `Photo ${i + 1}`, dateTaken: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}` },
  ])
)

const ALBUMS = ['Vacation', 'Screenshots', 'Portraits']
const ALBUM_ASSIGNMENTS = {
  Vacation: [0, 1, 2, 3, 4, 5, 6, 7],
  Screenshots: [8, 9, 10, 11, 12, 13, 14],
  Portraits: [15, 16, 17, 18, 19, 20, 21, 22, 23],
}

const FAVORITES_KEY = 'gallery-favorites'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveFavorites(set) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]))
  } catch {}
}

function GalleryImage({ index, src, isFavorite, onToggleFavorite }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <div className="gallery-window__cell-placeholder" />
  }

  return (
    <div className="gallery-window__cell-wrap">
      <img
        src={src}
        alt=""
        className="gallery-window__cell-img"
        onError={() => setHasError(true)}
      />
      <button
        type="button"
        className={`gallery-window__heart ${isFavorite ? 'gallery-window__heart--active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(index) }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
      </button>
    </div>
  )
}

export default function GalleryWindow() {
  const [activeSection, setActiveSection] = useState('recents')
  const [activeAlbum, setActiveAlbum] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [favorites, setFavoritesState] = useState(loadFavorites)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)

  const setFavorites = useCallback((fn) => {
    setFavoritesState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      saveFavorites(next)
      return next
    })
  }, [])

  const toggleFavorite = useCallback((index) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [setFavorites])

  const handleAlbumClick = (album) => {
    setActiveSection('albums')
    setActiveAlbum(album)
  }

  const indices = (() => {
    if (activeSection === 'favorites') {
      return [...favorites].sort((a, b) => a - b)
    }
    if (activeSection === 'albums' && activeAlbum && ALBUM_ASSIGNMENTS[activeAlbum]) {
      return ALBUM_ASSIGNMENTS[activeAlbum]
    }
    return Array.from({ length: GALLERY_SIZE }, (_, i) => i)
  })()

  let filteredIndices = searchQuery.trim()
    ? indices.filter((i) => {
        const meta = PHOTO_METADATA[i]
        const name = meta?.name ?? `photo-${i + 1}`
        return name.toLowerCase().includes(searchQuery.toLowerCase()) || `photo-${i + 1}`.includes(searchQuery)
      })
    : [...indices]

  filteredIndices = [...filteredIndices].sort((a, b) => {
    const metaA = PHOTO_METADATA[a]
    const metaB = PHOTO_METADATA[b]
    if (sortBy === 'name') {
      return (metaA?.name ?? '').localeCompare(metaB?.name ?? '')
    }
    return (metaB?.dateTaken ?? '').localeCompare(metaA?.dateTaken ?? '')
  })

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="gallery-window__view-options">
            <select
              className="gallery-window__sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort by"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
            </select>
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
          {activeSection === 'recents' && !searchQuery && (
            <p className="gallery-window__section-hint">Showing recent photos</p>
          )}
          {activeSection === 'favorites' && !searchQuery && (
            <p className="gallery-window__section-hint">Favorites — tap heart on photos to add</p>
          )}
          {activeSection === 'albums' && activeAlbum && !searchQuery && (
            <p className="gallery-window__section-hint">Album: {activeAlbum}</p>
          )}
          {searchQuery && (
            <p className="gallery-window__section-hint">
              {filteredIndices.length} result{filteredIndices.length !== 1 ? 's' : ''}
            </p>
          )}
          {filteredIndices.map((i) => (
            <div key={i} className="gallery-window__cell">
              <GalleryImage
                index={i}
                src={getImagePath(i)}
                isFavorite={favorites.has(i)}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
