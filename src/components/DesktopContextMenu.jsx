import { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './DesktopContextMenu.css'

const SORT_OPTIONS = [
  { id: 'name', labelKey: 'desktopContextMenu.name' },
  { id: 'size', labelKey: 'desktopContextMenu.size' },
  { id: 'type', labelKey: 'desktopContextMenu.type' },
  { id: 'date', labelKey: 'desktopContextMenu.dateModified' },
]

export default function DesktopContextMenu({
  x,
  y,
  appKey,
  customItem,
  onClose,
  onOpenApp,
  onSortByChange,
  sortBy,
  onNewFolder,
  onNewFile,
  onOpenFolder,
  onStartRename,
}) {
  const { t } = useLanguage()
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  const handleSortBy = (id) => {
    onSortByChange?.(id)
    onClose?.()
  }

  const menuWidth = 200
  const menuHeight = 340
  const menuStyle = typeof window !== 'undefined'
    ? {
        left: Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8)),
        top: Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8)),
      }
    : { left: x, top: y }

  return (
    <div
      ref={menuRef}
      className="desktop-context-menu"
      style={menuStyle}
    >
      {appKey ? (
        <>
          <button
            type="button"
            className="desktop-context-menu__item"
            onClick={() => {
              onOpenApp?.(appKey)
              onClose?.()
            }}
          >
            {t('desktopContextMenu.open')}
          </button>
          <button type="button" className="desktop-context-menu__item">
            {t('desktopContextMenu.rename')}
          </button>
          <button type="button" className="desktop-context-menu__item">
            {t('desktopContextMenu.properties')}
          </button>
          <div className="desktop-context-menu__divider" />
        </>
      ) : customItem ? (
        <>
          {customItem.type === 'folder' ? (
            <button
              type="button"
              className="desktop-context-menu__item"
              onClick={() => {
                onOpenFolder?.(customItem.id)
                onClose?.()
              }}
            >
              {t('desktopContextMenu.open')}
            </button>
          ) : null}
          <button
            type="button"
            className="desktop-context-menu__item"
            onClick={() => {
              onStartRename?.(customItem.id)
              onClose?.()
            }}
          >
            {t('desktopContextMenu.rename')}
          </button>
          <div className="desktop-context-menu__divider" />
        </>
      ) : null}
      <div className="desktop-context-menu__submenu">
        <span className="desktop-context-menu__label">{t('desktopContextMenu.sortBy')}</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`desktop-context-menu__item ${sortBy === opt.id ? 'desktop-context-menu__item--active' : ''}`}
            onClick={() => handleSortBy(opt.id)}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
      <div className="desktop-context-menu__divider" />
      <button type="button" className="desktop-context-menu__item">
        {t('desktopContextMenu.refresh')}
      </button>
      <button type="button" className="desktop-context-menu__item">
        {t('desktopContextMenu.personalize')}
      </button>
      <button type="button" className="desktop-context-menu__item" onClick={() => { onNewFolder?.(x, y); onClose?.(); }}>
        {t('desktopContextMenu.newFolder')}
      </button>
      <button type="button" className="desktop-context-menu__item" onClick={() => { onNewFile?.(x, y); onClose?.(); }}>
        {t('desktopContextMenu.addFile')}
      </button>
      <div className="desktop-context-menu__divider" />
      <button type="button" className="desktop-context-menu__item">
        {t('desktopContextMenu.inspect')}
      </button>
    </div>
  )
}
