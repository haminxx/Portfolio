import { useEffect, useCallback, useState } from 'react'
import { X } from 'lucide-react'
import RetroCalendarPanel from './desktop/RetroCalendarPanel'
import { FolderQuoteClockWidget } from './desktop/QuoteClockPanel'
import { DesktopIconGlyph } from './DesktopIconGlyph'
import './DesktopDocumentsFolderModal.css'

const GRID = 9

export default function DesktopDocumentsFolderModal({
  folderId,
  desktopItems = [],
  onClose,
  onOpenFolder,
  onOpenApp,
}) {
  const [now, setNow] = useState(() => new Date())
  const children = desktopItems.filter((i) => i.parentId === folderId)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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
    <div className="desktop-docs-folder__backdrop" role="presentation" onMouseDown={onBackdrop}>
      <div
        className="desktop-docs-folder__card"
        role="dialog"
        aria-modal="true"
        aria-label="Documents and media"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="desktop-docs-folder__head">
          <span className="desktop-docs-folder__title">DOCUMENTS &amp; MEDIA</span>
          <button type="button" className="desktop-docs-folder__close" aria-label="Close" onClick={() => onClose?.()}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="desktop-docs-folder__panels">
          <div className="desktop-docs-folder__panel desktop-docs-folder__panel--cal">
            <RetroCalendarPanel now={now} variant="full" />
          </div>
          <div className="desktop-docs-folder__panel desktop-docs-folder__panel--quote">
            <FolderQuoteClockWidget date={now} />
          </div>
        </div>
        <div className="desktop-docs-folder__shortcuts-head">Shortcuts</div>
        <div className="desktop-docs-folder__grid">
          {cells.map((item, idx) => (
            <div key={item?.id ?? `empty-${idx}`} className="desktop-docs-folder__cell">
              {item ? (
                <button
                  type="button"
                  className="desktop-docs-folder__item"
                  onDoubleClick={() => {
                    if (item.type === 'folder') onOpenFolder?.(item.id)
                    else if (item.type === 'shortcut' && item.appKey) onOpenApp?.(item.appKey)
                  }}
                >
                  <span className="desktop-docs-folder__glyph">
                    <DesktopIconGlyph item={item} size={36} />
                  </span>
                  <span className="desktop-docs-folder__label">{item.name}</span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
