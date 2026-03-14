import { useState, useCallback, useRef, useEffect } from 'react'
import DesktopCustomIcons from './DesktopCustomIcons'
import DesktopContextMenu from './DesktopContextMenu'
import './Desktop.css'

const DESKTOP_ITEMS_KEY = 'desktop-items'

function loadDesktopItems() {
  try {
    const raw = localStorage.getItem(DESKTOP_ITEMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDesktopItems(items) {
  try {
    localStorage.setItem(DESKTOP_ITEMS_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export default function Desktop({
  onOpenApp,
  sortBy,
  onSortByChange,
  desktopItems = [],
  onItemsChange,
  onOpenFolder,
  onNewFolder,
  onNewFile,
  onStartRename,
  startRenameId,
  onClearStartRenameId,
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const desktopRef = useRef(null)
  const iconsRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    if (e.target.closest('.desktop-custom-icons__item')) return
    setContextMenu(null)
    setSelectedId(null)
  }, [])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (e.target.closest('.desktop-custom-icons__item')) return
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleCustomIconContextMenu = useCallback((e, item) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, customItem: item })
  }, [])

  return (
    <div
      ref={desktopRef}
      className="daedalos-desktop"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div ref={iconsRef} className="desktop__icons-wrap">
        <DesktopCustomIcons
          desktopItems={desktopItems}
          selectedId={selectedId}
          onSelectIcon={setSelectedId}
          onItemsChange={onItemsChange}
          onOpenFolder={onOpenFolder}
          onOpenApp={onOpenApp}
          onIconContextMenu={handleCustomIconContextMenu}
          startRenameId={startRenameId}
          onClearStartRenameId={onClearStartRenameId}
        />
      </div>
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          appKey={contextMenu.appKey}
          customItem={contextMenu.customItem}
          onClose={() => setContextMenu(null)}
          onOpenApp={onOpenApp}
          onSortByChange={onSortByChange}
          sortBy={sortBy}
          onNewFolder={onNewFolder}
          onNewFile={onNewFile}
          onOpenFolder={onOpenFolder}
          onStartRename={onStartRename}
        />
      )}
    </div>
  )
}
