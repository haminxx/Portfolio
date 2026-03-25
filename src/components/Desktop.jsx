import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import DesktopCustomIcons from './DesktopCustomIcons'
import DesktopContextMenu from './DesktopContextMenu'
import DesktopWidgets from './DesktopWidgets'
import './Desktop.css'
import { DESKTOP_ICON_WIDTH, DESKTOP_ICON_HEIGHT, DESKTOP_SAFE_TOP } from '../desktopConstants'
import { DesktopBackgroundProvider, useDesktopBackground } from '../context/DesktopBackgroundContext'

const DesktopShaderBackground = lazy(() => import('./ui/DesktopShaderBackground'))

function DesktopShaderBackgroundGate() {
  const { color1, color2, speed } = useDesktopBackground()
  return <DesktopShaderBackground color1={color1} color2={color2} speed={speed} />
}

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

function rectsIntersect(r1, r2) {
  return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom)
}

function DesktopContent({
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
    if (e.target.closest('.desktop-widgets__card')) return
    setContextMenu(null)
    setSelectedIds([])
    selectionStartRef.current = { x: e.clientX, y: e.clientY }
    setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 })
  }, [])

  const selectionBoxRef = useRef(null)
  selectionBoxRef.current = selectionBox

  const widgetLayoutRef = useRef(null)
  const handleWidgetLayout = useCallback((layout) => {
    widgetLayoutRef.current = layout
  }, [])

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
          right: iconLeft + DESKTOP_ICON_WIDTH,
          bottom: iconTop + DESKTOP_ICON_HEIGHT,
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

  const clientToIconCoords = useCallback((clientX, clientY) => {
    const wrap = iconsRef.current
    if (!wrap) return { x: 24, y: 24 }
    const r = wrap.getBoundingClientRect()
    const maxX = Math.max(0, r.width - DESKTOP_ICON_WIDTH)
    const maxY = Math.max(0, r.height - DESKTOP_ICON_HEIGHT)
    return {
      x: Math.max(0, Math.min(maxX, clientX - r.left)),
      y: Math.max(DESKTOP_SAFE_TOP, Math.min(maxY, clientY - r.top)),
    }
  }, [])

  const handleNewFolderAtClient = useCallback(
    (clientX, clientY) => {
      const { x, y } = clientToIconCoords(clientX, clientY)
      onNewFolder?.(x, y)
    },
    [clientToIconCoords, onNewFolder],
  )

  const handleNewFileAtClient = useCallback(
    (clientX, clientY) => {
      const { x, y } = clientToIconCoords(clientX, clientY)
      onNewFile?.(x, y)
    },
    [clientToIconCoords, onNewFile],
  )

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (e.target.closest('.desktop-custom-icons__item')) return
    if (e.target.closest('.desktop-widgets__card')) return
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

  return (
    <div
      ref={desktopRef}
      className="daedalos-desktop"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <Suspense fallback={null}>
        <DesktopShaderBackgroundGate />
      </Suspense>
      <DesktopWidgets
        desktopItems={desktopItems}
        onLayoutChange={handleWidgetLayout}
        onOpenApp={onOpenApp}
      />
      <div ref={iconsRef} className="desktop__icons-wrap">
        <DesktopCustomIcons
          desktopItems={desktopItems}
          widgetLayoutRef={widgetLayoutRef}
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
          onNewFolder={handleNewFolderAtClient}
          onNewFile={handleNewFileAtClient}
          onOpenFolder={onOpenFolder}
          onStartRename={onStartRename}
        />
      )}
    </div>
  )
}

export default function Desktop(props) {
  return (
    <DesktopBackgroundProvider>
      <DesktopContent {...props} />
    </DesktopBackgroundProvider>
  )
}
