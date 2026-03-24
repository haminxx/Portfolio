import { useState, useCallback, useMemo } from 'react'
import { APPS } from '../config/apps'
import { useLanguage } from '../context/LanguageContext'
import {
  Globe,
  Image,
  Film,
  Images,
  Video,
  ShoppingBag,
  Settings,
  Map,
  Folder,
} from 'lucide-react'
import './Dock.css'

const APP_ICONS = {
  finder: Folder,
  chrome: Globe,
  instagram: Image,
  netflix: Film,
  photos: Images,
  facetime: Video,
  appStore: ShoppingBag,
  settings: Settings,
  map: Map,
  youtubeMusic: Film,
  doom: Film,
  dadnme: Film,
}

/** Horizontal slot width used for “make space” animation while dragging */
const SLOT_PX = 52

function reorderDockWithInsertion(order, dragKey, targetKey, placement) {
  if (!dragKey || dragKey === targetKey) return order
  const next = order.filter((k) => k !== dragKey)
  let idx = next.indexOf(targetKey)
  if (idx === -1) return order
  if (placement === 'after') idx += 1
  next.splice(idx, 0, dragKey)
  return next
}

function shiftForIndex(i, fromIdx, insertIdx) {
  if (fromIdx < 0 || insertIdx < 0 || fromIdx === insertIdx) return 0
  if (insertIdx < fromIdx) {
    if (i >= insertIdx && i < fromIdx) return SLOT_PX
    return 0
  }
  if (insertIdx > fromIdx) {
    if (i > fromIdx && i < insertIdx) return -SLOT_PX
    return 0
  }
  return 0
}

export default function Dock({ onOpenApp, dockOrder = Object.keys(APPS), onDockReorder, isChromeMaximized, anyMaximized, openAppWindows = [] }) {
  const { t } = useLanguage()
  const [draggedKey, setDraggedKey] = useState(null)
  const [insertPreview, setInsertPreview] = useState(null)
  const doomOpen = openAppWindows.some((w) => w.appKey === 'doom')
  const dadnmeOpen = openAppWindows.some((w) => w.appKey === 'dadnme')
  const visibleKeys = dockOrder.filter(
    (key) => (key !== 'doom' && key !== 'dadnme') || (key === 'doom' && doomOpen) || (key === 'dadnme' && dadnmeOpen)
  )

  const fromIdx = useMemo(() => (draggedKey ? visibleKeys.indexOf(draggedKey) : -1), [draggedKey, visibleKeys])

  const handleDragStart = (e, key) => {
    setDraggedKey(key)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', key)
    e.dataTransfer.setData('application/json', JSON.stringify({ appKey: key }))
  }

  const handleDragOver = useCallback(
    (e, key) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (!draggedKey || draggedKey === key) {
        setInsertPreview(null)
        return
      }
      const h = visibleKeys.indexOf(key)
      if (h === -1) return
      const wrap = e.currentTarget
      const rect = wrap.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      const placement = e.clientX < mid ? 'before' : 'after'
      const insertIdx = placement === 'before' ? h : h + 1
      const f = visibleKeys.indexOf(draggedKey)
      setInsertPreview({ insertIdx, fromIdx: f })
    },
    [draggedKey, visibleKeys]
  )

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setInsertPreview(null)
    }
  }

  const handleDrop = (e, targetKey) => {
    e.preventDefault()
    const dragKey = e.dataTransfer.getData('text/plain')
    setInsertPreview(null)
    setDraggedKey(null)
    if (!dragKey || !onDockReorder || dragKey === targetKey) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mid = rect.left + rect.width / 2
    const placement = e.clientX < mid ? 'before' : 'after'
    const next = reorderDockWithInsertion(dockOrder, dragKey, targetKey, placement)
    if (next !== dockOrder) onDockReorder(next)
  }

  const handleDragEnd = () => {
    setDraggedKey(null)
    setInsertPreview(null)
  }

  const insertIdx = insertPreview?.insertIdx ?? -1
  const previewFrom = insertPreview?.fromIdx ?? fromIdx

  const isHidden = anyMaximized ?? isChromeMaximized

  return (
    <div className={`dock-wrapper ${isHidden ? 'dock-wrapper--fullscreen-hidden' : ''}`}>
      <footer className="dock">
        <div className="dock__inner">
          {visibleKeys.map((key, i) => {
            const app = APPS[key]
            if (!app) return null
            const Icon = APP_ICONS[key] ?? Film
            const isDragging = draggedKey === key
            const tx = draggedKey ? shiftForIndex(i, previewFrom, insertIdx) : 0
            return (
              <div
                key={key}
                className={`dock__item-wrap ${isDragging ? 'dock__item-wrap--dragging' : ''}`}
                style={{
                  transform: tx ? `translateX(${tx}px)` : undefined,
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, key)}
                onDragOver={(e) => handleDragOver(e, key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, key)}
                onDragEnd={handleDragEnd}
              >
                <button
                  type="button"
                  className="dock__item"
                  onClick={() => onOpenApp(key)}
                  title=""
                  aria-label={t(`apps.${key}`)}
                >
                  <span className="dock__icon">
                    {app.iconPath ? (
                      <img
                        src={app.iconPath}
                        alt=""
                        className={`dock__icon-img ${key === 'dadnme' ? 'dock__icon-img--rounded-square' : ''} ${key === 'finder' ? 'dock__icon-img--rounded-square' : ''} ${key === 'appStore' ? 'dock__icon-img--appstore' : ''}`}
                      />
                    ) : Icon ? (
                      <Icon size={26} strokeWidth={1.6} />
                    ) : null}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </footer>
    </div>
  )
}
