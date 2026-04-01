import { useState, useCallback, useMemo, useRef } from 'react'
import type React from 'react'
import { APPS } from '../config/apps'
import { useLanguage } from '../context/LanguageContext'
import MacOSDock from './ui/mac-os-dock'
import type { DockApp } from './ui/mac-os-dock'
import './Dock.css'

const SLOT_PX = 48
const DRAG_THRESHOLD = 6

function reorderDockWithInsertion(
  order: string[],
  dragKey: string,
  targetKey: string,
  placement: 'before' | 'after',
) {
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

type OpenWin = { appKey: string }

interface DockProps {
  onOpenApp: (key: string) => void
  dockOrder?: string[]
  onDockReorder?: (order: string[]) => void
  isChromeMaximized?: boolean
  anyMaximized?: boolean
  openAppWindows?: OpenWin[]
}

type DragSession = {
  appId: string
  startX: number
  startY: number
  pointerId: number
  active: boolean
  target: HTMLElement | null
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
  const [insertPreview, setInsertPreview] = useState<{
    insertIdx: number
    fromIdx: number
  } | null>(null)
  const [pauseMagnification, setPauseMagnification] = useState(false)
  const suppressClickRef = useRef(false)
  const dragSessionRef = useRef<DragSession | null>(null)

  const doomOpen = openAppWindows.some((w) => w.appKey === 'doom')
  const dadnmeOpen = openAppWindows.some((w) => w.appKey === 'dadnme')
  const tetrisOpen = openAppWindows.some((w) => w.appKey === 'tetris')
  const visibleKeys = dockOrder.filter(
    (key) =>
      (key !== 'doom' && key !== 'dadnme' && key !== 'tetris') ||
      (key === 'doom' && doomOpen) ||
      (key === 'dadnme' && dadnmeOpen) ||
      (key === 'tetris' && tetrisOpen),
  )

  const fromIdx = useMemo(
    () => (draggedKey ? visibleKeys.indexOf(draggedKey) : -1),
    [draggedKey, visibleKeys],
  )

  const apps: DockApp[] = useMemo(
    () =>
      visibleKeys.map((key) => {
        const app = APPS[key as keyof typeof APPS]
        let imgClass =
          key === 'dadnme' || key === 'finder' || key === 'tetris' || key === 'notionCalendar'
            ? 'h-full w-full object-contain rounded-md'
            : 'h-full w-full object-contain'
        if (key === 'appStore') {
          imgClass = `${imgClass} scale-[0.86]`
        }
        return {
          id: key,
          name: t(`apps.${key}`),
          icon: app?.iconPath ?? '',
          imgClassName: imgClass,
        }
      }),
    [visibleKeys, t],
  )

  const openApps = openAppWindows.map((w) => w.appKey)

  const insertIdx = insertPreview?.insertIdx ?? -1
  const previewFrom = insertPreview?.fromIdx ?? fromIdx

  const shiftPxByIndex = useMemo(() => {
    if (!draggedKey || insertIdx < 0) return undefined
    return visibleKeys.map((_, i) =>
      shiftForIndex(i, previewFrom, insertIdx),
    )
  }, [draggedKey, insertIdx, previewFrom, visibleKeys])

  const endDragSession = useCallback(() => {
    const s = dragSessionRef.current
    if (s?.target) {
      try {
        s.target.releasePointerCapture(s.pointerId)
      } catch {
        // ignore
      }
    }
    dragSessionRef.current = null
    setDraggedKey(null)
    setInsertPreview(null)
    setPauseMagnification(false)
  }, [])

  const updateInsertPreviewFromPoint = useCallback(
    (clientX: number, clientY: number, dragKey: string) => {
      const el = document.elementFromPoint(clientX, clientY)
      const tile = el?.closest('[data-dock-app-id]') as HTMLElement | null
      const targetKey = tile?.getAttribute('data-dock-app-id')
      if (!targetKey || !tile || targetKey === dragKey) {
        setInsertPreview(null)
        return
      }
      const rect = tile.getBoundingClientRect()
      const placement: 'before' | 'after' =
        clientX < rect.left + rect.width / 2 ? 'before' : 'after'
      const h = visibleKeys.indexOf(targetKey)
      if (h === -1) {
        setInsertPreview(null)
        return
      }
      const insertI = placement === 'before' ? h : h + 1
      const f = visibleKeys.indexOf(dragKey)
      setInsertPreview({ insertIdx: insertI, fromIdx: f })
    },
    [visibleKeys],
  )

  const onIconPointerDown: (
    e: React.PointerEvent,
    appId: string,
  ) => void = useCallback((e, appId) => {
    if (e.button !== 0 || !onDockReorder) return
    const target = e.currentTarget as HTMLElement
    dragSessionRef.current = {
      appId,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      active: false,
      target,
    }
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }, [onDockReorder])

  const onIconPointerMove: (e: React.PointerEvent) => void = useCallback(
    (e) => {
      const s = dragSessionRef.current
      if (!s || !onDockReorder) return
      const dx = e.clientX - s.startX
      const dy = e.clientY - s.startY
      if (!s.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        s.active = true
        setDraggedKey(s.appId)
        setPauseMagnification(true)
      }
      updateInsertPreviewFromPoint(e.clientX, e.clientY, s.appId)
    },
    [onDockReorder, updateInsertPreviewFromPoint],
  )

  const onIconPointerUp: (
    e: React.PointerEvent,
    appId: string,
  ) => void = useCallback(
    (e, appId) => {
      const s = dragSessionRef.current
      if (!s || s.appId !== appId) return

      if (s.active && onDockReorder) {
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const tile = el?.closest('[data-dock-app-id]') as HTMLElement | null
        const targetKey = tile?.getAttribute('data-dock-app-id')
        if (targetKey && tile && targetKey !== s.appId) {
          const rect = tile.getBoundingClientRect()
          const placement: 'before' | 'after' =
            e.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
          const next = reorderDockWithInsertion(
            dockOrder,
            s.appId,
            targetKey,
            placement,
          )
          if (next !== dockOrder) {
            onDockReorder(next)
            suppressClickRef.current = true
          }
        }
      }

      endDragSession()
    },
    [onDockReorder, dockOrder, endDragSession],
  )

  const isHidden = anyMaximized ?? isChromeMaximized

  return (
    <div
      className={`dock-wrapper ${isHidden ? 'dock-wrapper--fullscreen-hidden' : ''}`}
    >
      <footer className="dock dock--macos">
        <MacOSDock
          apps={apps}
          onAppClick={onOpenApp}
          openApps={openApps}
          shiftPxByIndex={shiftPxByIndex}
          draggingId={draggedKey}
          pauseMagnification={pauseMagnification}
          suppressClickRef={suppressClickRef}
          onIconPointerDown={
            onDockReorder
              ? (e, appId) => onIconPointerDown(e, appId)
              : undefined
          }
          onIconPointerMove={onDockReorder ? onIconPointerMove : undefined}
          onIconPointerUp={
            onDockReorder
              ? (e, appId) => onIconPointerUp(e, appId)
              : undefined
          }
        />
      </footer>
    </div>
  )
}
