import { useState, useEffect, useRef } from 'react'
import { Search, User, Folder, Mail } from 'lucide-react'
import { SHORTCUTS } from '../config/shortcuts'
import { useLanguage } from '../context/LanguageContext'
import './ChromeHome.css'

const SHORTCUT_ICONS = {
  user: User,
  folder: Folder,
  mail: Mail,
}

export default function ChromeHome({ onNavigateShortcut, onShortcutInNewTab }) {
  const { t } = useLanguage()
  const [shortcutContextMenu, setShortcutContextMenu] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!shortcutContextMenu) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShortcutContextMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [shortcutContextMenu])

  return (
    <div className="chrome-home">
      <div className="chrome-home__search-wrap">
        <Search size={20} className="chrome-home__search-icon" strokeWidth={2} />
        <input
          type="text"
          className="chrome-home__search"
          placeholder={t('chrome.searchPlaceholder')}
          aria-label="Search"
        />
      </div>
      <div className="chrome-home__shortcuts">
        {SHORTCUTS.map((s) => {
          const Icon = SHORTCUT_ICONS[s.icon] || Folder
          const label = t(`shortcuts.${s.type}`)
          return (
            <button
              key={s.id}
              type="button"
              className="chrome-home__shortcut"
              onClick={() => onNavigateShortcut?.(s.type)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShortcutContextMenu({ x: e.clientX, y: e.clientY, shortcutType: s.type })
              }}
              title={label}
              aria-label={label}
            >
              <span className="chrome-home__shortcut-icon">
                <Icon size={28} strokeWidth={1.5} />
              </span>
              <span className="chrome-home__shortcut-label">{label}</span>
            </button>
          )
        })}
      </div>
      {shortcutContextMenu && (
        <div
          ref={menuRef}
          className="chrome-home__context-menu"
          style={{
            left: Math.min(shortcutContextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 180 : shortcutContextMenu.x),
            top: shortcutContextMenu.y,
          }}
        >
          <button
            type="button"
            className="chrome-home__context-item"
            onClick={() => {
              onShortcutInNewTab?.(shortcutContextMenu.shortcutType)
              setShortcutContextMenu(null)
            }}
          >
            Open in new tab
          </button>
        </div>
      )}
    </div>
  )
}
