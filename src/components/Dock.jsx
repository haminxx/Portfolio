import { useState } from 'react'
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
} from 'lucide-react'
import './Dock.css'

const APP_ICONS = {
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

export default function Dock({ onOpenApp, dockOrder = Object.keys(APPS), onDockReorder, isChromeMaximized, anyMaximized, openAppWindows = [] }) {
  const { t } = useLanguage()
  const [draggedKey, setDraggedKey] = useState(null)
  const [dragOverKey, setDragOverKey] = useState(null)
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

  const handleDragOver = (e, key) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverKey(key)
  }

  const handleDragLeave = () => {
    setDragOverKey(null)
  }

  const handleDrop = (e, dropKey) => {
    e.preventDefault()
    setDragOverKey(null)
    setDraggedKey(null)
    const dragKey = e.dataTransfer.getData('text/plain')
    if (!dragKey || dragKey === dropKey || !onDockReorder) return
    const fromIdx = dockOrder.indexOf(dragKey)
    const toIdx = dockOrder.indexOf(dropKey)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...dockOrder]
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, dragKey)
    onDockReorder(next)
  }

  const handleDragEnd = () => {
    setDraggedKey(null)
    setDragOverKey(null)
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
          const isDragOver = dragOverKey === key
          return (
            <div
              key={key}
              className={`dock__item-wrap ${isDragging ? 'dock__item-wrap--dragging' : ''} ${isDragOver ? 'dock__item-wrap--drag-over' : ''}`}
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
                      className={`dock__icon-img ${key === 'dadnme' ? 'dock__icon-img--rounded-square' : ''}`}
                    />
                  ) : Icon ? (
                    <Icon size={26} strokeWidth={1.6} />
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
