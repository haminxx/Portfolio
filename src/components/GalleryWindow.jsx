import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Grid3X3, LayoutGrid, Heart, ChevronLeft, Images, PanelLeft } from 'lucide-react'
import {
  GALLERY_SIZE,
  getImagePath,
  getGalleryPhoto,
  getGalleryAlbums,
} from '../lib/gallery'
import { ADD_PHOTO_WIDGET_EVENT } from '../lib/photoWidgetRegistry'
import './GalleryWindow.css'

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
  } catch {
    // ignore
  }
}

function GalleryImage({ index, src, isFavorite, onToggleFavorite, onClick }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <div className="gallery-window__cell-placeholder" />
  }

  return (
    <div
      className="gallery-window__cell-wrap"
      onClick={() => onClick?.(index)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(index)}
    >
      <img
        src={src}
        alt=""
        className="gallery-window__cell-img"
        onError={() => setHasError(true)}
      />
      <button
        type="button"
        className={`gallery-window__heart ${isFavorite ? 'gallery-window__heart--active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(index)
        }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
      </button>
    </div>
  )
}

export default function GalleryWindow() {
  const albums = useMemo(() => getGalleryAlbums(), [])
  const [activeSection, setActiveSection] = useState('albums')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  /** 'root' = album tiles; 'detail' = photos inside one album */
  const [albumBrowse, setAlbumBrowse] = useState('root')
  const [activeAlbumId, setActiveAlbumId] = useState(null)
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

  const toggleFavorite = useCallback(
    (index) => {
      setFavorites((prev) => {
        const next = new Set(prev)
        if (next.has(index)) next.delete(index)
        else next.add(index)
        return next
      })
    },
    [setFavorites],
  )

  const goAlbumRoot = useCallback(() => {
    setAlbumBrowse('root')
    setActiveAlbumId(null)
  }, [])

  const openAlbumFromSidebar = useCallback((albumId) => {
    setActiveSection('albums')
    setAlbumBrowse('detail')
    setActiveAlbumId(albumId)
    setSidebarOpen(false)
  }, [])

  const openAlbumFromGrid = useCallback((albumId) => {
    setAlbumBrowse('detail')
    setActiveAlbumId(albumId)
    setSidebarOpen(false)
  }, [])

  const indices = useMemo(() => {
    if (activeSection === 'favorites') {
      return [...favorites].sort((a, b) => a - b)
    }
    if (activeSection === 'albums' && albumBrowse === 'detail' && activeAlbumId) {
      const al = albums.find((a) => a.id === activeAlbumId)
      return al?.photoIndexes?.length ? [...al.photoIndexes] : []
    }
    if (activeSection === 'recents') {
      return Array.from({ length: GALLERY_SIZE }, (_, i) => i).slice(0, 18)
    }
    return Array.from({ length: GALLERY_SIZE }, (_, i) => i)
  }, [
    activeSection,
    albumBrowse,
    activeAlbumId,
    favorites,
    albums,
  ])

  let filteredIndices = searchQuery.trim()
    ? indices.filter((i) => {
        const meta = getGalleryPhoto(i)
        const name = meta?.title ?? `photo-${i + 1}`
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `photo-${i + 1}`.includes(searchQuery.toLowerCase())
        )
      })
    : [...indices]

  filteredIndices = [...filteredIndices].sort((a, b) => {
    const metaA = getGalleryPhoto(a)
    const metaB = getGalleryPhoto(b)
    if (sortBy === 'name') {
      return (metaA?.title ?? '').localeCompare(metaB?.title ?? '')
    }
    return (metaB?.date ?? '').localeCompare(metaA?.date ?? '')
  })

  const showAlbumPicker =
    activeSection === 'albums' && albumBrowse === 'root' && !searchQuery.trim()

  const toolbarTitle = (() => {
    if (activeSection === 'all') return 'Library'
    if (activeSection === 'recents') return 'Recents'
    if (activeSection === 'favorites') return 'Favorites'
    if (activeSection === 'albums' && albumBrowse === 'root') return 'Albums'
    if (activeSection === 'albums' && activeAlbumId) {
      return albums.find((a) => a.id === activeAlbumId)?.title ?? 'Album'
    }
    return 'Photos'
  })()

  return (
    <div
      className={`gallery-window${sidebarOpen ? ' gallery-window--sidebar-open' : ''}`}
    >
      <button
        type="button"
        className="gallery-window__sidebar-toggle"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        onClick={() => setSidebarOpen((o) => !o)}
      >
        <PanelLeft size={20} strokeWidth={2} />
      </button>
      <div
        className="gallery-window__sidebar-scrim"
        aria-hidden
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="gallery-window__sidebar">
        <div className="gallery-window__sidebar-brand">
          <Images size={20} strokeWidth={1.75} aria-hidden />
          <span>Photos</span>
        </div>
        <p className="gallery-window__sidebar-heading">Library</p>
        <nav className="gallery-window__nav">
          <button
            type="button"
            className={`gallery-window__nav-item ${activeSection === 'all' ? 'gallery-window__nav-item--active' : ''}`}
            onClick={() => {
              setActiveSection('all')
              goAlbumRoot()
              setSidebarOpen(false)
            }}
          >
            All Photos
          </button>
          <button
            type="button"
            className={`gallery-window__nav-item ${activeSection === 'recents' ? 'gallery-window__nav-item--active' : ''}`}
            onClick={() => {
              setActiveSection('recents')
              goAlbumRoot()
              setSidebarOpen(false)
            }}
          >
            Recents
          </button>
          <button
            type="button"
            className={`gallery-window__nav-item ${activeSection === 'favorites' ? 'gallery-window__nav-item--active' : ''}`}
            onClick={() => {
              setActiveSection('favorites')
              goAlbumRoot()
              setSidebarOpen(false)
            }}
          >
            Favorites
          </button>
        </nav>
        <p className="gallery-window__sidebar-heading gallery-window__sidebar-heading--albums">
          My Albums
        </p>
        <button
          type="button"
          className={`gallery-window__nav-item gallery-window__nav-item--albums-top ${activeSection === 'albums' && albumBrowse === 'root' ? 'gallery-window__nav-item--active' : ''}`}
          onClick={() => {
            setActiveSection('albums')
            goAlbumRoot()
            setSidebarOpen(false)
          }}
        >
          Albums
        </button>
        <ul className="gallery-window__album-list">
          {albums.map((album) => (
            <li key={album.id}>
              <button
                type="button"
                className={`gallery-window__album-item ${activeSection === 'albums' && activeAlbumId === album.id ? 'gallery-window__album-item--active' : ''}`}
                onClick={() => openAlbumFromSidebar(album.id)}
              >
                <span className="gallery-window__album-item-title">{album.title}</span>
                <span className="gallery-window__album-item-count">
                  {album.photoIndexes?.length ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="gallery-window__main">
        <header className="gallery-window__toolbar">
          <div className="gallery-window__toolbar-left">
            {activeSection === 'albums' && albumBrowse === 'detail' && (
              <button
                type="button"
                className="gallery-window__back"
                onClick={goAlbumRoot}
                aria-label="Back to albums"
              >
                <ChevronLeft size={20} strokeWidth={2} />
                <span>Albums</span>
              </button>
            )}
            <h1 className="gallery-window__toolbar-title">{toolbarTitle}</h1>
          </div>
          <div className="gallery-window__search-wrap">
            <Search size={16} className="gallery-window__search-icon" />
            <input
              type="search"
              placeholder="Search your library…"
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

        <div className="gallery-window__stage">
          <AnimatePresence mode="wait">
            {showAlbumPicker ? (
              <motion.div
                key="albums-root"
                className="gallery-window__album-picker"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="gallery-window__picker-subtitle">Browse by album</p>
                <div className="gallery-window__album-picker-grid">
                  {albums.map((album) => {
                    const first = album.photoIndexes?.[0]
                    const cover = first != null ? getImagePath(first) : null
                    return (
                      <motion.button
                        key={album.id}
                        type="button"
                        className="gallery-window__album-tile"
                        onClick={() => openAlbumFromGrid(album.id)}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.22 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="gallery-window__album-tile-cover">
                          {cover ? (
                            <img src={cover} alt="" className="gallery-window__album-tile-img" />
                          ) : (
                            <div className="gallery-window__album-tile-empty" />
                          )}
                        </div>
                        <span className="gallery-window__album-tile-title">{album.title}</span>
                        <span className="gallery-window__album-tile-sub">
                          {album.photoIndexes?.length ?? 0} items
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`grid-${activeSection}-${activeAlbumId ?? 'x'}`}
                className={`gallery-window__grid ${viewMode === 'list' ? 'gallery-window__grid--list' : ''}${activeSection === 'all' && !searchQuery.trim() ? ' gallery-window__grid--all-photos' : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeSection === 'recents' && !searchQuery && (
                  <p className="gallery-window__section-hint">Recently added</p>
                )}
                {activeSection === 'favorites' && !searchQuery && (
                  <p className="gallery-window__section-hint">
                    Tap the heart on any photo to add it here
                  </p>
                )}
                {activeSection === 'albums' && albumBrowse === 'detail' && activeAlbumId && !searchQuery && (
                  <p className="gallery-window__section-hint">
                    {albums.find((a) => a.id === activeAlbumId)?.title}
                  </p>
                )}
                {searchQuery && (
                  <p className="gallery-window__section-hint">
                    {filteredIndices.length} result{filteredIndices.length !== 1 ? 's' : ''}
                  </p>
                )}
                {filteredIndices.map((i) => (
                  <motion.div
                    key={i}
                    className="gallery-window__cell"
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GalleryImage
                      index={i}
                      src={getImagePath(i)}
                      isFavorite={favorites.has(i)}
                      onToggleFavorite={toggleFavorite}
                      onClick={setSelectedPhotoIndex}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      {selectedPhotoIndex != null && (
        <div
          className="gallery-window__lightbox"
          onClick={() => setSelectedPhotoIndex(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedPhotoIndex(null)}
          role="button"
          tabIndex={0}
          aria-label="Close"
        >
          <motion.div
            className="gallery-window__lightbox-inner"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="gallery-window__lightbox-toolbar">
              <button
                type="button"
                className="gallery-window__lightbox-add-desktop"
                onClick={(e) => {
                  e.stopPropagation()
                  window.dispatchEvent(
                    new CustomEvent(ADD_PHOTO_WIDGET_EVENT, {
                      detail: { galleryIndex: selectedPhotoIndex },
                    }),
                  )
                }}
                aria-label="Add photo to desktop"
                title="Add to desktop"
              >
                <LayoutGrid size={20} strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                className="gallery-window__lightbox-close"
                onClick={() => setSelectedPhotoIndex(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <img
              src={getImagePath(selectedPhotoIndex)}
              alt={getGalleryPhoto(selectedPhotoIndex)?.title ?? `Photo ${selectedPhotoIndex + 1}`}
              className="gallery-window__lightbox-img"
            />
          </motion.div>
        </div>
      )}
    </div>
  )
}
