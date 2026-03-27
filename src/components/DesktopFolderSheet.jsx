import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { DesktopIconGlyph } from './DesktopIconGlyph'
import './DesktopFolderSheet.css'

const GRID = 9

export default function DesktopFolderSheet({
  folderId,
  folderName = 'Folder',
  desktopItems = [],
  onClose,
  onOpenFolder,
  onOpenApp,
}) {
  const children = desktopItems.filter((i) => i.parentId === folderId)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onBackdrop = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose?.()
    },
    [onClose],
  )

  const cells = []
  for (let i = 0; i < GRID; i += 1) {
    cells.push(children[i] || null)
  }

  return (
    <div className="desktop-folder-sheet__backdrop" role="presentation" onMouseDown={onBackdrop}>
      <div
        className="desktop-folder-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={folderName}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="desktop-folder-sheet__head">
          <span className="desktop-folder-sheet__title">{folderName}</span>
          <button type="button" className="desktop-folder-sheet__close" aria-label="Close" onClick={() => onClose?.()}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="desktop-folder-sheet__grid">
          {cells.map((item, idx) => (
            <div key={item?.id ?? `empty-${idx}`} className="desktop-folder-sheet__cell">
              {item ? (
                <button
                  type="button"
                  className="desktop-folder-sheet__item"
                  onDoubleClick={() => {
                    if (item.type === 'folder') onOpenFolder?.(item.id)
                    else if (item.type === 'shortcut' && item.appKey) onOpenApp?.(item.appKey)
                  }}
                >
                  <span className="desktop-folder-sheet__glyph">
                    <DesktopIconGlyph item={item} size={36} />
                  </span>
                  <span className="desktop-folder-sheet__label">{item.name}</span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
