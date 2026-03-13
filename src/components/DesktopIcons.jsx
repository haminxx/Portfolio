import { useState, useCallback, useRef, useEffect } from 'react'
import { APPS } from '../config/apps'
import {
  Globe,
  Image,
  Film,
  Images,
  ShoppingBag,
  Settings,
  Map,
} from 'lucide-react'
import './DesktopIcons.css'

const APP_ICONS = {
  chrome: Globe,
  instagram: Image,
  netflix: Film,
  gallery: Images,
  appStore: ShoppingBag,
  settings: Settings,
  map: Map,
}

const DRAG_THRESHOLD = 5
const ICON_WIDTH = 80
const ICON_HEIGHT = 72

export default function DesktopIcons({
  onOpenApp,
  iconPositions = {},
  onIconPositionChange,
  selectedIcons = new Set(),
  onIconContextMenu,
  containerRef,
  sortBy,
}) {
  const [draggingKey, setDraggingKey] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  let entries = Object.entries(APPS)
  if (sortBy === 'name') {
    entries = [...entries].sort((a, b) => a[1].label.localeCompare(b[1].label))
  }

  const getPosition = useCallback(
    (appKey, index) => {
      const def = iconPositions[appKey]
      if (def && typeof def.x === 'number' && typeof def.y === 'number') {
        return { x: def.x, y: def.y }
      }
      return {
        x: 24 + (index % 4) * 100,
        y: 24 + Math.floor(index / 4) * 88,
      }
    },
    [iconPositions]
  )

  const handleIconMouseDown = useCallback(
    (e, appKey) => {
      if (e.button !== 0) return
      e.preventDefault()
      const pos = iconPositions[appKey] ?? getPosition(appKey, entries.findIndex(([k]) => k === appKey))
      setDraggingKey(appKey)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: pos.x,
        posY: pos.y,
      }
    },
    [iconPositions, getPosition, entries]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!draggingKey) return
      const { x, y, posX, posY } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const newX = posX + dx
      const newY = posY + dy

      const maxX = Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1200) - ICON_WIDTH)
      const maxY = Math.max(0, (typeof window !== 'undefined' ? window.innerHeight : 800) - ICON_HEIGHT)
      const clampedX = Math.max(0, Math.min(newX, maxX))
      const clampedY = Math.max(0, Math.min(newY, maxY))

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: clampedX,
        posY: clampedY,
      }
      onIconPositionChange?.(draggingKey, clampedX, clampedY)
    },
    [draggingKey, onIconPositionChange]
  )

  useEffect(() => {
    if (!draggingKey) return
    const moveHandler = (e) => handleMouseMove(e)
    const upHandler = (e) => {
      const appKey = draggingKey
      setDraggingKey(null)
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', upHandler)
      const { x, y, posX, posY } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < DRAG_THRESHOLD) {
        onOpenApp?.(appKey)
      } else {
        const finalX = posX + dx
        const finalY = posY + dy
        const maxX = Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1200) - ICON_WIDTH)
        const maxY = Math.max(0, (typeof window !== 'undefined' ? window.innerHeight : 800) - ICON_HEIGHT)
        const clampedX = Math.max(0, Math.min(finalX, maxX))
        const clampedY = Math.max(0, Math.min(finalY, maxY))
        onIconPositionChange?.(appKey, clampedX, clampedY)
      }
    }
    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('mouseup', upHandler)
    return () => {
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', upHandler)
    }
  }, [draggingKey, onOpenApp, onIconPositionChange])

  return (
    <div className="desktop-icons" ref={containerRef} aria-label="Desktop icons">
      {entries.map(([key, app], index) => {
        const Icon = APP_ICONS[key]
        const isSelected = selectedIcons.has(key)
        const pos = getPosition(key, index)
        return (
          <button
            key={key}
            type="button"
            className={`desktop-icons__item ${isSelected ? 'desktop-icons__item--selected' : ''} ${draggingKey === key ? 'desktop-icons__item--dragging' : ''}`}
            data-app-key={key}
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={(e) => handleIconMouseDown(e, key)}
            onContextMenu={(e) => onIconContextMenu?.(e, key)}
            title={app.label}
            aria-label={app.label}
          >
            <span className="desktop-icons__icon">
              {Icon ? <Icon size={40} strokeWidth={1.5} /> : null}
            </span>
            <span className="desktop-icons__label">{app.label}</span>
          </button>
        )
      })}
    </div>
  )
}
