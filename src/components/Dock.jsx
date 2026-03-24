import { useState, useCallback } from 'react'
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

function reorderDockWithInsertion(order, dragKey, targetKey, placement) {
  if (!dragKey || dragKey === targetKey) return order
  const next = order.filter((k) => k !== dragKey)
  let idx = next.indexOf(targetKey)
  if (idx === -1) return order
  if (placement === 'after') idx += 1
  next.splice(idx, 0, dragKey)
  return next
}

export default function Dock({ onOpenApp, dockOrder = Object.keys(APPS), onDockReorder, isChromeMaximized, anyMaximized, openAppWindows = [] }) {
  const { t } = useLanguage()
  const [draggedKey, setDraggedKey] = useState(null)
  const [dropHint, setDropHint] = useState(null)
  const doomOpen = openAppWindows.some((w) => w.appKey === 'doom')
  const dadnmeOpen = openAppWindows.some((w) => w.appKey === 'dadnme')
  const visibleKeys = dockOrder.filter(
    (key) => (key !== 'doom' && key !== 'dadnme') || (key === 'doom' && doomOpen) || (key === 'dadnme' && dadnmeOpen)
  )
  const isHidden = anyMaximized ?? isChromeMaximized

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
        setDropHint(null)
        return
      }
      const wrap = e.currentTarget
      const rect = wrap.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      const placement = e.clientX < mid ? 'before' : 'after'
      setDropHint({ key, placement })
    },
    [draggedKey]
  )

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropHint(null)
    }
  }

  const handleDrop = (e, targetKey) => {
    e.preventDefault()
    const dragKey = e.dataTransfer.getData('text/plain')
    setDropHint(null)
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
    setDropHint(null)
  }

  return (
    <div className={`dock-wrapper ${isHidden ? 'dock-wrapper--fullscreen-hidden' : ''}`}>
      <footer className="dock">
        <div className="dock__inner">
          {visibleKeys.map((key) => {
            const app = APPS[key]
            if (!app) return null
            const Icon = APP_ICONS[key] ?? Film
            const isDragging = draggedKey === key
            const hint = dropHint?.key === key ? dropHint.placement : null
            return (
              <div
                key={key}
                className={`dock__item-wrap ${isDragging ? 'dock__item-wrap--dragging' : ''} ${hint === 'before' ? 'dock__item-wrap--drop-before' : ''} ${hint === 'after' ? 'dock__item-wrap--drop-after' : ''}`}
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
                  title={t(`apps.${key}`)}
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
                      <Icon size={24} strokeWidth={1.6} />
                    ) : null}
                  </span>
                  <span className="dock__label">{t(`apps.${key}`)}</span>
                </button>
              </div>
            )
          })}
        </div>
      </footer>
    </div>
  )
}
