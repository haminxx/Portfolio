import { useState, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
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
  { id: 'favorites', labelKey: 'favorites', icon: null, items: [
    { id: 'desktop', labelKey: 'desktop', icon: Home },
    { id: 'documents', labelKey: 'documents', icon: Folder },
    { id: 'downloads', labelKey: 'downloads', icon: Folder },
    { id: 'pictures', labelKey: 'pictures', icon: Image },
    { id: 'music', labelKey: 'music', icon: Music },
    { id: 'movies', labelKey: 'movies', icon: Film },
    { id: 'applications', labelKey: 'applications', icon: Folder },
  ]},
]

const FOLDER_ITEMS = [
  { id: 'applications', nameKey: 'applications', type: 'folder', keywords: ['apps', 'applications'] },
  { id: 'desktop', nameKey: 'desktop', type: 'folder', keywords: ['desktop'] },
  { id: 'documents', nameKey: 'documents', type: 'folder', keywords: ['docs', 'documents', 'files'] },
  { id: 'downloads', nameKey: 'downloads', type: 'folder', keywords: ['downloads', 'downloaded'] },
  { id: 'pictures', nameKey: 'pictures', type: 'folder', keywords: ['pictures', 'photos', 'images'] },
  { id: 'music', nameKey: 'music', type: 'folder', keywords: ['music', 'audio'] },
  { id: 'movies', nameKey: 'movies', type: 'folder', keywords: ['movies', 'videos', 'films'] },
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
  const { t } = useLanguage()
  const [activeLocation, setActiveLocation] = useState('desktop')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  const searchableItems = useMemo(() => {
    const apps = Object.entries(APPS).map(([key, app]) => ({
      id: key,
      appKey: key,
      type: 'app',
      keywords: [app.label.toLowerCase(), key, app.domain?.toLowerCase()].filter(Boolean),
    }))
    return [...FOLDER_ITEMS, ...apps]
  }, [])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      if (activeLocation === 'desktop') {
        const folders = FOLDER_ITEMS.filter((f) => f.id !== 'applications')
        const apps = Object.entries(APPS).filter(([k]) => k !== 'finder').map(([key]) => ({ id: key, type: 'app', appKey: key }))
        return [...folders, ...apps]
      }
      if (activeLocation === 'applications') {
        return Object.entries(APPS).filter(([k]) => k !== 'finder').map(([key]) => ({ id: key, type: 'app', appKey: key }))
      }
      const locFolder = FOLDER_ITEMS.find((f) => f.id === activeLocation)
      return locFolder ? [locFolder, FOLDER_ITEMS.find((f) => f.id === 'applications')].filter(Boolean) : FOLDER_ITEMS
    }
    return searchableItems.filter((item) => {
      const name = item.type === 'app' ? t(`apps.${item.appKey}`) : t(`finder.${item.nameKey}`)
      const nameMatch = name.toLowerCase().includes(q)
      const keywordMatch = item.keywords?.some((kw) => kw.includes(q))
      return nameMatch || keywordMatch
    })
  }, [searchQuery, activeLocation, searchableItems, t])

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
            placeholder={t('finder.searchPlaceholder')}
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
            aria-label={t('finder.gridView')}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            type="button"
            className={`finder-window__view-btn ${viewMode === 'list' ? 'finder-window__view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label={t('finder.listView')}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      <div className="finder-window__body">
        <aside className="finder-window__sidebar">
          <div className="finder-window__sidebar-section">
            <span className="finder-window__sidebar-label">{t('finder.favorites')}</span>
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
                  <span>{t(`finder.${item.labelKey}`)}</span>
                </button>
              )
            })}
          </div>
        </aside>
        <main className={`finder-window__content finder-window__content--${viewMode}`}>
          {filteredItems.length === 0 ? (
            <p className="finder-window__empty">{t('finder.noResults')} &quot;{searchQuery}&quot;</p>
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
                <span className="finder-window__item-label">{item.type === 'app' ? t(`apps.${item.appKey}`) : t(`finder.${item.nameKey}`)}</span>
              </button>
            ))
          )}
        </main>
      </div>
    </div>
  )
}
