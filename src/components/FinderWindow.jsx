import { useState, useMemo } from 'react'
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
  Globe,
  Images,
  Video,
  ShoppingBag,
  Settings,
  Map,
  Gamepad2,
} from 'lucide-react'
import { APPS } from '../config/apps'
import './FinderWindow.css'

const SIDEBAR_ITEMS = [
  { id: 'favorites', label: 'Favorites', icon: null, items: [
    { id: 'desktop', label: 'Desktop', icon: Home },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'downloads', label: 'Downloads', icon: Folder },
    { id: 'pictures', label: 'Pictures', icon: Image },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'applications', label: 'Applications', icon: Folder },
  ]},
]

const FOLDER_ITEMS = [
  { id: 'applications', name: 'Applications', type: 'folder', keywords: ['apps', 'applications'] },
  { id: 'desktop', name: 'Desktop', type: 'folder', keywords: ['desktop'] },
  { id: 'documents', name: 'Documents', type: 'folder', keywords: ['docs', 'documents', 'files'] },
  { id: 'downloads', name: 'Downloads', type: 'folder', keywords: ['downloads', 'downloaded'] },
  { id: 'pictures', name: 'Pictures', type: 'folder', keywords: ['pictures', 'photos', 'images'] },
  { id: 'music', name: 'Music', type: 'folder', keywords: ['music', 'audio'] },
  { id: 'movies', name: 'Movies', type: 'folder', keywords: ['movies', 'videos', 'films'] },
]

const APP_ICONS = {
  chrome: Globe,
  instagram: Image,
  netflix: Film,
  photos: Images,
  facetime: Video,
  appStore: ShoppingBag,
  settings: Settings,
  map: Map,
  youtubeMusic: Film,
  doom: Gamepad2,
  dadnme: Gamepad2,
  finder: Folder,
}

export default function FinderWindow({ onOpenApp }) {
  const [activeLocation, setActiveLocation] = useState('desktop')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  const searchableItems = useMemo(() => {
    const apps = Object.entries(APPS).map(([key, app]) => ({
      id: key,
      name: app.label,
      type: 'app',
      appKey: key,
      keywords: [app.label.toLowerCase(), key, app.domain?.toLowerCase()].filter(Boolean),
    }))
    return [...FOLDER_ITEMS, ...apps]
  }, [])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      if (activeLocation === 'desktop') {
        const folders = FOLDER_ITEMS.filter((f) => f.id !== 'applications')
        const apps = Object.entries(APPS).filter(([k]) => k !== 'finder').map(([key, app]) => ({ id: key, name: app.label, type: 'app', appKey: key }))
        return [...folders, ...apps]
      }
      if (activeLocation === 'applications') {
        return Object.entries(APPS).filter(([k]) => k !== 'finder').map(([key, app]) => ({ id: key, name: app.label, type: 'app', appKey: key }))
      }
      const locFolder = FOLDER_ITEMS.find((f) => f.id === activeLocation)
      return locFolder ? [locFolder, FOLDER_ITEMS.find((f) => f.id === 'applications')].filter(Boolean) : FOLDER_ITEMS
    }
    return searchableItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(q)
      const keywordMatch = item.keywords?.some((kw) => kw.includes(q))
      return nameMatch || keywordMatch
    })
  }, [searchQuery, activeLocation, searchableItems])

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
          {filteredItems.length === 0 ? (
            <p className="finder-window__empty">No results for &quot;{searchQuery}&quot;</p>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="finder-window__item"
                onDoubleClick={() => {
                  if (item.type === 'app' && item.appKey && onOpenApp) {
                    onOpenApp(item.appKey)
                  } else if (item.type === 'folder') {
                    setActiveLocation(item.id)
                  }
                }}
              >
                <span className="finder-window__item-icon">
                  {item.type === 'folder' ? (
                    <Folder size={48} strokeWidth={1.5} />
                  ) : (
                    (() => {
                      const Icon = APP_ICONS[item.appKey] ?? FileText
                      return <Icon size={48} strokeWidth={1.5} />
                    })()
                  )}
                </span>
                <span className="finder-window__item-label">{item.name}</span>
              </button>
            ))
          )}
        </main>
      </div>
    </div>
  )
}
