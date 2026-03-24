import { useState, useCallback, useMemo, useRef, type ComponentType, type PointerEvent, type MouseEvent } from 'react'
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

const APP_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
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

const SLOT_PX = 52
const DRAG_THRESHOLD_PX = 6

function reorderDockWithInsertion(order: string[], dragKey: string, targetKey: string, placement: 'before' | 'after') {
  if (!dragKey || dragKey === targetKey) return order
  const next = order.filter((k) => k !== dragKey)
  let idx = next.indexOf(targetKey)
  if (idx === -1) return order
  if (placement === 'after') idx += 1
  next.splice(idx, 0, dragKey)
  return next
}

function shiftForIndex(i: number, fromIdx: number, insertIdx: number) {
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

type DockProps = {
  onOpenApp: (key: string) => void
  dockOrder?: string[]
  onDockReorder?: (order: string[]) => void
  isChromeMaximized?: boolean
  anyMaximized?: boolean
  openAppWindows?: { appKey: string }[]
}

export default function Dock({
  onOpenApp,
  dockOrder = Object.keys(APPS),
  onDockReorder,
  isChromeMaximized,
  anyMaximized,
  openAppWindows = [],
}: DockProps) {
  const { t } = useLanguage()
  const [draggedKey, setDraggedKey] = useState<string | null>(null)
  const [insertPreview, setInsertPreview] = useState<{ insertIdx: number; fromIdx: number } | null>(null)
  const [ghost, setGhost] = useState<{ left: number; top: number } | null>(null)
  const itemWrapRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const suppressClickRef = useRef(false)
  const dragSessionRef = useRef<{
    key: string
    startX: number
    startY: number
    active: boolean
    grabLeft: number
    grabTop: number
    pointerId: number
  } | null>(null)

  const doomOpen = openAppWindows.some((w) => w.appKey === 'doom')
  const dadnmeOpen = openAppWindows.some((w) => w.appKey === 'dadnme')
  const visibleKeys = dockOrder.filter(
    (key) => (key !== 'doom' && key !== 'dadnme') || (key === 'doom' && doomOpen) || (key === 'dadnme' && dadnmeOpen),
  )

  const fromIdx = useMemo(() => (draggedKey ? visibleKeys.indexOf(draggedKey) : -1), [draggedKey, visibleKeys])

  const computeInsertPreview = useCallback(
    (clientX: number, dragKey: string) => {
      const f = visibleKeys.indexOf(dragKey)
      if (f === -1) return null
      let insertIdx = visibleKeys.length
      for (let i = 0; i < visibleKeys.length; i++) {
        const el = itemWrapRefs.current.get(visibleKeys[i])
        if (!el) continue
        const r = el.getBoundingClientRect()
        const mid = r.left + r.width / 2
        if (clientX < mid) {
          insertIdx = i
          break
        }
        insertIdx = i + 1
      }
      return { insertIdx, fromIdx: f }
    },
    [visibleKeys],
  )

  const commitReorder = useCallback(
    (dragKey: string, clientX: number) => {
      if (!onDockReorder) return
      let targetKey: string | null = null
      let placement: 'before' | 'after' = 'before'
      for (let i = 0; i < visibleKeys.length; i++) {
        const k = visibleKeys[i]
        if (k === dragKey) continue
        const el = itemWrapRefs.current.get(k)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (clientX >= r.left && clientX <= r.right) {
          targetKey = k
          placement = clientX < r.left + r.width / 2 ? 'before' : 'after'
          break
        }
      }
      if (!targetKey) {
        const last = visibleKeys[visibleKeys.length - 1]
        if (last && last !== dragKey) {
          targetKey = last
          placement = 'after'
        }
      }
      if (!targetKey || targetKey === dragKey) return
      const next = reorderDockWithInsertion(dockOrder, dragKey, targetKey, placement)
      if (next !== dockOrder) onDockReorder(next)
    },
    [dockOrder, onDockReorder, visibleKeys],
  )

  const endPointerDrag = useCallback(() => {
    dragSessionRef.current = null
    setDraggedKey(null)
    setInsertPreview(null)
    setGhost(null)
  }, [])

  const handleItemPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>, key: string) => {
      if (e.button !== 0) return
      const wrap = e.currentTarget as HTMLDivElement
      const r = wrap.getBoundingClientRect()
      dragSessionRef.current = {
        key,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        grabLeft: e.clientX - r.left,
        grabTop: e.clientY - r.top,
        pointerId: e.pointerId,
      }

      const onMove = (ev: PointerEvent) => {
        const sess = dragSessionRef.current
        if (!sess || ev.pointerId !== sess.pointerId) return
        const dx = ev.clientX - sess.startX
        const dy = ev.clientY - sess.startY
        if (!sess.active) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
          sess.active = true
          setDraggedKey(sess.key)
          try {
            wrap.setPointerCapture(ev.pointerId)
          } catch {
            /* ignore */
          }
        }
        setGhost({ left: ev.clientX - sess.grabLeft, top: ev.clientY - sess.grabTop })
        const preview = computeInsertPreview(ev.clientX, sess.key)
        setInsertPreview(preview)
      }

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== dragSessionRef.current?.pointerId) return
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        const sess = dragSessionRef.current
        try {
          wrap.releasePointerCapture(ev.pointerId)
        } catch {
          /* ignore */
        }
        if (sess?.active) {
          if (onDockReorder) {
            suppressClickRef.current = true
            commitReorder(sess.key, ev.clientX)
          }
        }
        endPointerDrag()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [computeInsertPreview, commitReorder, onDockReorder, endPointerDrag],
  )

  const handleButtonClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>, key: string) => {
      if (suppressClickRef.current) {
        e.preventDefault()
        e.stopPropagation()
        suppressClickRef.current = false
        return
      }
      onOpenApp(key)
    },
    [onOpenApp],
  )

  const insertIdx = insertPreview?.insertIdx ?? -1
  const previewFrom = insertPreview?.fromIdx ?? fromIdx

  const isHidden = anyMaximized ?? isChromeMaximized

  const ghostApp = draggedKey ? APPS[draggedKey as keyof typeof APPS] : null
  const GhostIcon = draggedKey ? APP_ICONS[draggedKey] : null

  return (
    <div className={`dock-wrapper ${isHidden ? 'dock-wrapper--fullscreen-hidden' : ''}`}>
      {ghost && ghostApp && (
        <div
          className="dock__ghost"
          style={{ left: ghost.left, top: ghost.top }}
          aria-hidden
        >
          <span className="dock__icon dock__ghost__icon">
            {ghostApp.iconPath ? (
              <img
                src={ghostApp.iconPath}
                alt=""
                className={`dock__icon-img ${draggedKey === 'dadnme' ? 'dock__icon-img--rounded-square' : ''} ${draggedKey === 'finder' ? 'dock__icon-img--rounded-square' : ''} ${draggedKey === 'appStore' ? 'dock__icon-img--appstore' : ''}`}
              />
            ) : GhostIcon ? (
              <GhostIcon size={26} strokeWidth={1.6} />
            ) : null}
          </span>
        </div>
      )}
      <footer className="dock">
        <div className="dock__inner">
          {visibleKeys.map((key, i) => {
            const app = APPS[key as keyof typeof APPS]
            if (!app) return null
            const Icon = APP_ICONS[key] ?? Film
            const isDragging = draggedKey === key
            const tx = draggedKey ? shiftForIndex(i, previewFrom, insertIdx) : 0
            return (
              <div
                key={key}
                ref={(el) => {
                  if (el) itemWrapRefs.current.set(key, el)
                  else itemWrapRefs.current.delete(key)
                }}
                className={`dock__item-wrap ${isDragging ? 'dock__item-wrap--dragging' : ''}`}
                style={{
                  transform: tx ? `translateX(${tx}px)` : undefined,
                }}
                onPointerDown={(e) => handleItemPointerDown(e, key)}
              >
                <button
                  type="button"
                  className="dock__item"
                  onClick={(e) => handleButtonClick(e, key)}
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
