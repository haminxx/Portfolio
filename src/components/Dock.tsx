import {
  useState,
  useCallback,
  useMemo,
  useRef,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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
import MacOSDock, { type MacOSDockApp } from './ui/mac-os-dock'
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
  /** App keys that show a running indicator under the icon (Chrome + non-minimized windows). */
  openAppIndicatorKeys?: string[]
}

export default function Dock({
  onOpenApp,
  dockOrder = Object.keys(APPS),
  onDockReorder,
  isChromeMaximized,
  anyMaximized,
  openAppWindows = [],
  openAppIndicatorKeys = [],
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

  const dockApps: MacOSDockApp[] = useMemo(
    () =>
      visibleKeys
        .map((key) => {
          const app = APPS[key as keyof typeof APPS]
          if (!app) return null
          const name = t(`apps.${key}`)
          if (app.iconPath) {
            return { id: key, name, icon: app.iconPath } satisfies MacOSDockApp
          }
          const Icon = APP_ICONS[key] ?? Film
          return {
            id: key,
            name,
            renderIcon: (px: number) => <Icon size={Math.round(px)} strokeWidth={1.6} />,
          } satisfies MacOSDockApp
        })
        .filter((x): x is MacOSDockApp => x != null),
    [visibleKeys, t],
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
    (e: ReactPointerEvent<HTMLDivElement>, key: string) => {
      if (e.button !== 0) return
      const wrap = itemWrapRefs.current.get(key)
      if (!wrap) return
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

  const handleAppClick = useCallback(
    (id: string) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        return
      }
      onOpenApp(id)
    },
    [onOpenApp],
  )

  const insertIdx = insertPreview?.insertIdx ?? -1
  const previewFrom = insertPreview?.fromIdx ?? fromIdx

  const isHidden = anyMaximized ?? isChromeMaximized

  const ghostApp = draggedKey ? APPS[draggedKey as keyof typeof APPS] : null
  const GhostIcon = draggedKey ? APP_ICONS[draggedKey] : null

  const shiftXByIndex =
    draggedKey != null
      ? (i: number) => shiftForIndex(i, previewFrom, insertIdx)
      : undefined

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
      <footer className="dock dock--macos">
        <MacOSDock
          apps={dockApps}
          onAppClick={handleAppClick}
          openAppIds={openAppIndicatorKeys}
          shiftXByIndex={shiftXByIndex}
          onAppPointerDown={(e, id) => handleItemPointerDown(e, id)}
          onIconElementRef={(id, el) => {
            if (el) itemWrapRefs.current.set(id, el)
            else itemWrapRefs.current.delete(id)
          }}
          className="dock-macos-bar"
        />
      </footer>
    </div>
  )
}
