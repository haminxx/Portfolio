import { useEffect, useRef } from 'react'
import './DesktopContextMenu.css'

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'size', label: 'Size' },
  { id: 'type', label: 'Type' },
  { id: 'date', label: 'Date modified' },
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
            Open
          </button>
          <button type="button" className="desktop-context-menu__item">
            Rename
          </button>
          <button type="button" className="desktop-context-menu__item">
            Properties
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
              Open
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
            Rename
          </button>
          <div className="desktop-context-menu__divider" />
        </>
      ) : null}
      <div className="desktop-context-menu__submenu">
        <span className="desktop-context-menu__label">Sort by</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`desktop-context-menu__item ${sortBy === opt.id ? 'desktop-context-menu__item--active' : ''}`}
            onClick={() => handleSortBy(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="desktop-context-menu__divider" />
      <button type="button" className="desktop-context-menu__item">
        Refresh
      </button>
      <button type="button" className="desktop-context-menu__item">
        Personalize
      </button>
      <button type="button" className="desktop-context-menu__item" onClick={() => { onNewFolder?.(x, y); onClose?.(); }}>
        New folder
      </button>
      <button type="button" className="desktop-context-menu__item" onClick={() => { onNewFile?.(x, y); onClose?.(); }}>
        Add file
      </button>
      <div className="desktop-context-menu__divider" />
      <button type="button" className="desktop-context-menu__item">
        Inspect
      </button>
    </div>
  )
}
