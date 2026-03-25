import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText, Gamepad2 } from 'lucide-react'
import './DesktopCustomIcons.css'
import { DESKTOP_ICON_WIDTH as ICON_WIDTH, DESKTOP_ICON_HEIGHT as ICON_HEIGHT } from '../desktopConstants'
const DRAG_THRESHOLD_PX = 6

export default function DesktopCustomIcons({
  desktopItems = [],
  selectedIds = [],
  onSelectIcons,
  onItemsChange,
  onOpenFolder,
  onOpenApp,
  onIconContextMenu,
  startRenameId,
  onClearStartRenameId,
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [dropTargetId, setDropTargetId] = useState(null)
  const [draggingIds, setDraggingIds] = useState(() => [])
  const rootItems = desktopItems.filter((i) => !i.parentId)

  const desktopItemsRef = useRef(desktopItems)
  useEffect(() => {
    desktopItemsRef.current = desktopItems
  }, [desktopItems])

  const rafRef = useRef(null)
  const pendingPosRef = useRef(null)

  useEffect(() => {
    if (startRenameId && desktopItems.some((i) => i.id === startRenameId)) {
      const item = desktopItems.find((i) => i.id === startRenameId)
      setRenamingId(startRenameId)
      setRenameValue(item?.name ?? '')
      onClearStartRenameId?.()
    }
  }, [startRenameId, desktopItems, onClearStartRenameId])

  const handleCommitRename = useCallback(() => {
    if (!renamingId) return
    const value = renameValue.trim()
    if (value) {
      onItemsChange?.((prev) =>
        prev.map((i) => (i.id === renamingId ? { ...i, name: value } : i))
      )
    }
    setRenamingId(null)
    setRenameValue('')
  }, [renamingId, renameValue, onItemsChange])

  const handleRenameKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleCommitRename()
      if (e.key === 'Escape') {
        setRenamingId(null)
        setRenameValue('')
      }
    },
    [handleCommitRename]
  )

  const handleDoubleClick = useCallback(
    (e, item) => {
      e.stopPropagation()
      if (item.type === 'folder') {
        onOpenFolder?.(item.id)
      } else if (item.type === 'shortcut' && item.appKey) {
        onOpenApp?.(item.appKey)
      }
    },
    [onOpenFolder, onOpenApp]
  )

  const findFolderUnderPoint = useCallback((clientX, clientY, excludeIds = []) => {
    const exclude = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds].filter(Boolean))
    const stack = document.elementsFromPoint(clientX, clientY)
    for (const el of stack) {
      const desktopItem = el.closest?.('[data-desktop-item-id]')
      if (desktopItem) {
        const iid = desktopItem.getAttribute('data-desktop-item-id')
        if (iid && exclude.has(iid)) continue
      }
      const folderEl = el.closest?.('[data-folder-id]')
      if (!folderEl) continue
      const fid = folderEl.getAttribute('data-folder-id')
      if (fid && !exclude.has(fid)) return fid
    }
    return null
  }, [])

  const flushPendingPosition = useCallback(() => {
    const pending = pendingPosRef.current
    if (!pending || typeof pending !== 'object') return
    const entries = Object.entries(pending).filter(([, pos]) => pos && typeof pos.x === 'number')
    if (!entries.length) return
    pendingPosRef.current = null
    rafRef.current = null
    onItemsChange?.((prev) =>
      prev.map((i) => {
        const pos = pending[i.id]
        return pos ? { ...i, x: pos.x, y: pos.y, parentId: null } : i
      })
    )
  }, [onItemsChange])

  const handlePointerDown = useCallback(
    (e, item) => {
      if (e.button !== 0) return
      if (renamingId === item.id) return
      if (e.target.closest('input')) return

      const wrapEl = e.currentTarget.closest('.desktop__icons-wrap')
      if (!wrapEl) return

      e.stopPropagation()
      e.preventDefault()

      const captureEl = e.currentTarget
      try {
        captureEl.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }

      pendingPosRef.current = null
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      const multi =
        selectedIds.length > 1 &&
        selectedIds.includes(item.id) &&
        selectedIds.every((id) => rootItems.some((r) => r.id === id))

      const groupIds = multi ? selectedIds.filter((id) => rootItems.some((r) => r.id === id)) : [item.id]

      const itemStartPositions = {}
      for (const id of groupIds) {
        const ri = rootItems.find((r) => r.id === id)
        if (ri) {
          itemStartPositions[id] = { x: ri.x ?? 24, y: ri.y ?? 24 }
        }
      }

      if (!multi) {
        onSelectIcons?.([item.id])
      }

      const dragState = {
        groupIds,
        itemStartPositions,
        wrapEl,
        startClientX: e.clientX,
        startClientY: e.clientY,
        active: false,
        pointerId: e.pointerId,
        captureEl,
      }

      setDraggingIds(groupIds)

      const onMove = (ev) => {
        const dx = ev.clientX - dragState.startClientX
        const dy = ev.clientY - dragState.startClientY
        if (!dragState.active && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          return
        }
        dragState.active = true

        const wrap = dragState.wrapEl.getBoundingClientRect()
        const next = {}
        for (const id of dragState.groupIds) {
          const start = dragState.itemStartPositions[id]
          if (!start) continue
          let x = start.x + dx
          let y = start.y + dy
          x = Math.max(0, Math.min(wrap.width - ICON_WIDTH, x))
          y = Math.max(0, Math.min(wrap.height - ICON_HEIGHT, y))
          next[id] = { x, y }
        }

        pendingPosRef.current = next
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            flushPendingPosition()
          })
        }

        const folderId = findFolderUnderPoint(ev.clientX, ev.clientY, dragState.groupIds)
        setDropTargetId(folderId)
      }

      const onUp = (ev) => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)

        try {
          if (dragState.captureEl && dragState.pointerId != null) {
            dragState.captureEl.releasePointerCapture(dragState.pointerId)
          }
        } catch {
          // ignore
        }

        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        flushPendingPosition()
        pendingPosRef.current = null
        setDropTargetId(null)
        setDraggingIds([])

        if (!dragState.active) return

        const folderId = findFolderUnderPoint(ev.clientX, ev.clientY, dragState.groupIds)
        if (!folderId || dragState.groupIds.includes(folderId)) return

        const allMovable = dragState.groupIds.every((gid) => {
          const found = desktopItemsRef.current.find((i) => i.id === gid)
          return found && found.id !== folderId
        })
        if (!allMovable) return

        onItemsChange?.((prev) =>
          prev.map((i) => (dragState.groupIds.includes(i.id) ? { ...i, parentId: folderId } : i))
        )
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [renamingId, selectedIds, rootItems, onSelectIcons, findFolderUnderPoint, flushPendingPosition, onItemsChange]
  )

  return (
    <div className="desktop-custom-icons">
      {rootItems.map((item) => {
        const isFolder = item.type === 'folder'
        const isShortcut = item.type === 'shortcut'
        const Icon = isFolder ? Folder : isShortcut ? Gamepad2 : FileText
        const isDropTarget = dropTargetId === item.id
        const isDragging = draggingIds.includes(item.id)

        return (
          <div
            key={item.id}
            className={`desktop-custom-icons__item ${selectedIds.includes(item.id) ? 'desktop-custom-icons__item--selected' : ''} ${isDropTarget ? 'desktop-custom-icons__item--drop-target' : ''} ${isDragging ? 'desktop-custom-icons__item--pointer-dragging' : ''}`}
            style={{ left: item.x ?? 24, top: item.y ?? 24, touchAction: 'none' }}
            data-desktop-item-id={item.id}
            data-folder-id={isFolder ? item.id : undefined}
            onPointerDown={(e) => handlePointerDown(e, item)}
            onDoubleClick={(e) => handleDoubleClick(e, item)}
            onContextMenu={(e) => onIconContextMenu?.(e, item)}
          >
            <span className="desktop-custom-icons__icon">
              {isShortcut && item.appKey === 'doom' ? (
                <img src="/dock-icons/doom.png" alt="DOOM" className="desktop-custom-icons__icon-img" />
              ) : isShortcut && item.appKey === 'dadnme' ? (
                <img src="/dock-icons/dadnme.png" alt="Dad n Me" className="desktop-custom-icons__icon-img desktop-custom-icons__icon-img--rounded-square" />
              ) : (
                <Icon size={40} strokeWidth={1.5} />
              )}
            </span>
            {renamingId === item.id ? (
              <input
                type="text"
                className="desktop-custom-icons__rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleCommitRename}
                onKeyDown={handleRenameKeyDown}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="desktop-custom-icons__label">{item.name}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
