import { useState, useCallback, useRef, useEffect } from 'react'
import DesktopCustomIcons from './DesktopCustomIcons'
import DesktopContextMenu from './DesktopContextMenu'
import './Desktop.css'

const DESKTOP_ITEMS_KEY = 'desktop-items'
const ICON_WIDTH = 80
const ICON_HEIGHT = 96

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

function rectsIntersect(r1, r2) {
  return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom)
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
  const [selectedIds, setSelectedIds] = useState([])
  const [selectionBox, setSelectionBox] = useState(null)
  const desktopRef = useRef(null)
  const iconsRef = useRef(null)
  const selectionStartRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    if (e.target.closest('.desktop-custom-icons__item')) return
    setContextMenu(null)
    setSelectedIds([])
    selectionStartRef.current = { x: e.clientX, y: e.clientY }
    setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 })
  }, [])

  const selectionBoxRef = useRef(null)
  selectionBoxRef.current = selectionBox

  useEffect(() => {
    if (!selectionBox) return
    const handleMove = (e) => {
      const start = selectionStartRef.current
      if (!start) return
      const left = Math.min(start.x, e.clientX)
      const top = Math.min(start.y, e.clientY)
      const width = Math.abs(e.clientX - start.x)
      const height = Math.abs(e.clientY - start.y)
      setSelectionBox({ left, top, width, height })
    }
    const handleUp = () => {
      const start = selectionStartRef.current
      const currentBox = selectionBoxRef.current
      setSelectionBox(null)
      selectionStartRef.current = null
      if (!start || !currentBox) return
      const rootItems = desktopItems.filter((i) => !i.parentId)
      const boxRect = {
        left: currentBox.left,
        top: currentBox.top,
        right: currentBox.left + currentBox.width,
        bottom: currentBox.top + currentBox.height,
      }
      const ids = rootItems.filter((item) => {
        const iconLeft = item.x ?? 24
        const iconTop = item.y ?? 24
        const iconRect = {
          left: iconLeft,
          top: iconTop,
          right: iconLeft + ICON_WIDTH,
          bottom: iconTop + ICON_HEIGHT,
        }
        return rectsIntersect(boxRect, iconRect)
      }).map((i) => i.id)
      if (ids.length > 0 || (currentBox.width > 4 && currentBox.height > 4)) {
        setSelectedIds(ids)
      }
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [selectionBox, desktopItems])

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

  const handleSelectIcons = useCallback((ids) => {
    setSelectedIds(Array.isArray(ids) ? ids : [ids])
  }, [])

  const handleDesktopDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDesktopDrop = useCallback(
    (e) => {
      e.preventDefault()
      const data = e.dataTransfer.getData('application/json')
      if (!data) return
      let parsed
      try {
        parsed = JSON.parse(data)
      } catch {
        return
      }
      const { id, offsetX, offsetY } = parsed
      const item = desktopItems.find((i) => i.id === id)
      if (!item) return
      const newX = Math.max(0, Math.min(window.innerWidth - ICON_WIDTH, e.clientX - (offsetX ?? ICON_WIDTH / 2)))
      const newY = Math.max(0, Math.min(window.innerHeight - ICON_HEIGHT, e.clientY - (offsetY ?? 24)))
      onItemsChange?.((prev) =>
        prev.map((i) => (i.id === id ? { ...i, x: newX, y: newY, parentId: null } : i))
      )
    },
    [desktopItems, onItemsChange]
  )

  return (
    <div
      ref={desktopRef}
      className="daedalos-desktop"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDragOver={handleDesktopDragOver}
      onDrop={handleDesktopDrop}
    >
      <div ref={iconsRef} className="desktop__icons-wrap">
        <DesktopCustomIcons
          desktopItems={desktopItems}
          selectedIds={selectedIds}
          onSelectIcons={handleSelectIcons}
          onItemsChange={onItemsChange}
          onOpenFolder={onOpenFolder}
          onOpenApp={onOpenApp}
          onIconContextMenu={handleCustomIconContextMenu}
          startRenameId={startRenameId}
          onClearStartRenameId={onClearStartRenameId}
        />
      </div>
      {selectionBox && (selectionBox.width > 2 || selectionBox.height > 2) && (
        <div
          className="desktop__selection-box"
          style={{
            left: selectionBox.left,
            top: selectionBox.top,
            width: selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}
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
