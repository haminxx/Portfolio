import { useState, useCallback, useRef, useEffect } from 'react'
import DesktopIcons from './DesktopIcons'
import DesktopContextMenu from './DesktopContextMenu'
import { APPS } from '../config/apps'
import './Desktop.css'

const STORAGE_KEY = 'desktop-icon-positions'

function getDefaultPositions() {
  const entries = Object.keys(APPS)
  const positions = {}
  entries.forEach((key, index) => {
    positions[key] = {
      x: 24 + (index % 4) * 100,
      y: 24 + Math.floor(index / 4) * 88,
    }
  })
  return positions
}

function loadPositions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

function savePositions(positions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  } catch {
    // ignore
  }
}

export default function Desktop({
  onOpenApp,
  sortBy,
  onSortByChange,
}) {
  const [iconPositions, setIconPositions] = useState(() => {
    const saved = loadPositions()
    const defaults = getDefaultPositions()
    if (!saved) return defaults
    const merged = { ...defaults }
    Object.keys(defaults).forEach((key) => {
      if (saved[key] && typeof saved[key].x === 'number' && typeof saved[key].y === 'number') {
        merged[key] = { x: saved[key].x, y: saved[key].y }
      }
    })
    return merged
  })
  const [selectionBox, setSelectionBox] = useState(null)
  const [selectedIcons, setSelectedIcons] = useState(new Set())
  const [contextMenu, setContextMenu] = useState(null)
  const desktopRef = useRef(null)
  const iconsRef = useRef(null)

  const handleIconPositionChange = useCallback((appKey, x, y) => {
    setIconPositions((prev) => {
      const next = { ...prev, [appKey]: { x, y } }
      savePositions(next)
      return next
    })
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    if (e.target.closest('.desktop-icons__item')) return
    setContextMenu(null)
    setSelectedIcons(new Set())
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    })
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!selectionBox) return
    setSelectionBox((prev) => ({
      ...prev,
      endX: e.clientX,
      endY: e.clientY,
    }))
  }, [selectionBox])

  const handleMouseUp = useCallback(() => {
    if (!selectionBox) return
    const left = Math.min(selectionBox.startX, selectionBox.endX)
    const right = Math.max(selectionBox.startX, selectionBox.endX)
    const top = Math.min(selectionBox.startY, selectionBox.endY)
    const bottom = Math.max(selectionBox.startY, selectionBox.endY)
    const boxW = right - left
    const boxH = bottom - top
    if (boxW < 5 && boxH < 5) {
      setSelectionBox(null)
      return
    }
    const box = { left, top, right, bottom }
    const iconEls = iconsRef.current?.querySelectorAll('.desktop-icons__item')
    const selected = new Set()
    iconEls?.forEach((el, i) => {
      const rect = el.getBoundingClientRect()
      const iconLeft = rect.left
      const iconRight = rect.right
      const iconTop = rect.top
      const iconBottom = rect.bottom
      const overlaps =
        !(box.right < iconLeft || box.left > iconRight ||
          box.bottom < iconTop || box.top > iconBottom)
      if (overlaps && el.dataset.appKey) selected.add(el.dataset.appKey)
    })
    setSelectedIcons(selected)
    setSelectionBox(null)
  }, [selectionBox])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (e.target.closest('.desktop-icons__item')) return
    setContextMenu({ x: e.clientX, y: e.clientY })
    setSelectionBox(null)
  }, [])

  useEffect(() => {
    if (!selectionBox) return
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [selectionBox, handleMouseMove, handleMouseUp])

  const handleIconContextMenu = useCallback((e, appKey) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, appKey })
  }, [])

  return (
    <div
      ref={desktopRef}
      className="daedalos-desktop"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div ref={iconsRef} className="desktop__icons-wrap">
        <DesktopIcons
          onOpenApp={onOpenApp}
          iconPositions={iconPositions}
          onIconPositionChange={handleIconPositionChange}
          selectedIcons={selectedIcons}
          onIconContextMenu={handleIconContextMenu}
          sortBy={sortBy}
        />
      </div>
      {selectionBox && (
        <div
          className="desktop__selection-box"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY),
          }}
        />
      )}
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          appKey={contextMenu.appKey}
          onClose={() => setContextMenu(null)}
          onOpenApp={onOpenApp}
          onSortByChange={onSortByChange}
          sortBy={sortBy}
        />
      )}
    </div>
  )
}
