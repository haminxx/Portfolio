import { useState } from 'react'
import {
  Home,
  Folder,
  FileText,
  Image,
  Music,
  Film,
  Search,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
} from 'lucide-react'
import './FinderWindow.css'

const SIDEBAR_ITEMS = [
  { id: 'favorites', label: 'Favorites', icon: null, items: [
    { id: 'desktop', label: 'Desktop', icon: Home },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'downloads', label: 'Downloads', icon: Folder },
    { id: 'pictures', label: 'Pictures', icon: Image },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'movies', label: 'Movies', icon: Film },
  ]},
  { id: 'apps', label: 'Applications', icon: 'apps' },
]

const PLACEHOLDER_ITEMS = [
  { name: 'Applications', icon: 'folder', type: 'folder' },
  { name: 'Desktop', icon: 'folder', type: 'folder' },
  { name: 'Documents', icon: 'folder', type: 'folder' },
  { name: 'Downloads', icon: 'folder', type: 'folder' },
  { name: 'Pictures', icon: 'folder', type: 'folder' },
  { name: 'Chrome', icon: 'app', type: 'app' },
  { name: 'Photos', icon: 'app', type: 'app' },
  { name: 'Settings', icon: 'app', type: 'app' },
]

export default function FinderWindow() {
  const [activeLocation, setActiveLocation] = useState('desktop')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  return (
    <div className="finder-window">
      <div className="finder-window__toolbar">
        <div className="finder-window__nav-buttons">
          <button type="button" className="finder-window__nav-btn" aria-label="Back">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="finder-window__nav-btn" aria-label="Forward">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="finder-window__search-wrap">
          <Search size={16} className="finder-window__search-icon" />
          <input
            type="search"
            placeholder="Search files, folders, apps..."
            className="finder-window__search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="finder-window__view-buttons">
          <button
            type="button"
            className={`finder-window__view-btn ${viewMode === 'grid' ? 'finder-window__view-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            type="button"
            className={`finder-window__view-btn ${viewMode === 'list' ? 'finder-window__view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>
      <div className="finder-window__body">
        <aside className="finder-window__sidebar">
          <div className="finder-window__sidebar-section">
            <span className="finder-window__sidebar-label">Favorites</span>
            {SIDEBAR_ITEMS[0].items.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`finder-window__sidebar-item ${activeLocation === item.id ? 'finder-window__sidebar-item--active' : ''}`}
                  onClick={() => setActiveLocation(item.id)}
                >
                  {Icon && <Icon size={18} strokeWidth={1.5} />}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </aside>
        <main className={`finder-window__content finder-window__content--${viewMode}`}>
          {PLACEHOLDER_ITEMS.map((item, i) => (
            <button
              key={`${item.name}-${i}`}
              type="button"
              className="finder-window__item"
              onDoubleClick={() => {}}
            >
              <span className="finder-window__item-icon">
                {item.type === 'folder' ? (
                  <Folder size={48} strokeWidth={1.5} />
                ) : (
                  <FileText size={48} strokeWidth={1.5} />
                )}
              </span>
              <span className="finder-window__item-label">{item.name}</span>
            </button>
          ))}
        </main>
      </div>
    </div>
  )
}
