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
  youtubeMusic: Film,
}

const DRAG_THRESHOLD = 10
const ICON_WIDTH = 80
const ICON_HEIGHT = 72

export default function DesktopIcons({
  onOpenApp,
  iconPositions = {},
  onIconPositionChange,
  onIconPositionsBatchChange,
  selectedIcons = new Set(),
  onIconContextMenu,
  containerRef,
  sortBy,
}) {
  const [draggingKeys, setDraggingKeys] = useState(new Set())
  const dragStartRef = useRef({ x: 0, y: 0, positions: {} })
  const lastClickRef = useRef({ appKey: null, time: 0 })

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
        y: 80 + Math.floor(index / 4) * 88,
      }
    },
    [iconPositions]
  )

  const handleIconMouseDown = useCallback(
    (e, appKey) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const keysToDrag = selectedIcons.has(appKey) ? selectedIcons : new Set([appKey])
      const positions = {}
      keysToDrag.forEach((key) => {
        const idx = entries.findIndex(([k]) => k === key)
        positions[key] = iconPositions[key] ?? getPosition(key, idx >= 0 ? idx : 0)
      })
      setDraggingKeys(keysToDrag)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        positions: { ...positions },
      }
    },
    [iconPositions, getPosition, entries, selectedIcons]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (draggingKeys.size === 0) return
      const { x, y, positions, lastX, lastY } = dragStartRef.current
      const prevX = lastX ?? x
      const prevY = lastY ?? y
      const dx = e.clientX - prevX
      const dy = e.clientY - prevY

      const maxX = Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1200) - ICON_WIDTH)
      const maxY = Math.max(0, (typeof window !== 'undefined' ? window.innerHeight : 800) - ICON_HEIGHT)

      const updates = {}
      draggingKeys.forEach((key) => {
        const pos = positions[key] || { x: 0, y: 0 }
        const newX = Math.max(0, Math.min(pos.x + dx, maxX))
        const newY = Math.max(0, Math.min(pos.y + dy, maxY))
        updates[key] = { x: newX, y: newY }
        positions[key] = { x: newX, y: newY }
      })

      dragStartRef.current = {
        ...dragStartRef.current,
        lastX: e.clientX,
        lastY: e.clientY,
        positions,
      }
      onIconPositionsBatchChange?.(updates)
    },
    [draggingKeys, onIconPositionsBatchChange]
  )

  useEffect(() => {
    if (draggingKeys.size === 0) return
    const moveHandler = (e) => handleMouseMove(e)
    const upHandler = (e) => {
      const keys = new Set(draggingKeys)
      const primaryKey = keys.values().next().value
      setDraggingKeys(new Set())
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', upHandler)
      const { x, y, positions, lastX, lastY } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < DRAG_THRESHOLD) {
        const now = Date.now()
        const last = lastClickRef.current
        if (last.appKey === primaryKey && now - last.time < 400) {
          onOpenApp?.(primaryKey)
          lastClickRef.current = { appKey: null, time: 0 }
        } else {
          lastClickRef.current = { appKey: primaryKey, time: now }
        }
      } else {
        const maxX = Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1200) - ICON_WIDTH)
        const maxY = Math.max(0, (typeof window !== 'undefined' ? window.innerHeight : 800) - ICON_HEIGHT)
        const finalDx = e.clientX - (lastX ?? x)
        const finalDy = e.clientY - (lastY ?? y)
        const updates = {}
        keys.forEach((key) => {
          const pos = positions[key] || { x: 0, y: 0 }
          const finalX = Math.max(0, Math.min(pos.x + finalDx, maxX))
          const finalY = Math.max(0, Math.min(pos.y + finalDy, maxY))
          updates[key] = { x: finalX, y: finalY }
        })
        onIconPositionsBatchChange?.(updates)
      }
    }
    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('mouseup', upHandler)
    return () => {
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', upHandler)
    }
  }, [draggingKeys, onOpenApp, onIconPositionsBatchChange])

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
            className={`desktop-icons__item ${isSelected ? 'desktop-icons__item--selected' : ''} ${draggingKeys.has(key) ? 'desktop-icons__item--dragging' : ''}`}
            data-app-key={key}
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={(e) => handleIconMouseDown(e, key)}
            onContextMenu={(e) => onIconContextMenu?.(e, key)}
            title={app.label}
            aria-label={app.label}
          >
            <span className="desktop-icons__icon">
              {app.iconPath ? (
                <img src={app.iconPath} alt="" className="desktop-icons__icon-img" />
              ) : Icon ? (
                <Icon size={40} strokeWidth={1.5} />
              ) : null}
            </span>
            <span className="desktop-icons__label">{app.label}</span>
          </button>
        )
      })}
    </div>
  )
}
