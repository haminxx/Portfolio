import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText, Gamepad2 } from 'lucide-react'
import './DesktopCustomIcons.css'

const ICON_WIDTH = 80
const ICON_HEIGHT = 96
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
  const [draggingId, setDraggingId] = useState(null)
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

  const findFolderUnderPoint = useCallback((clientX, clientY, excludeItemId) => {
    const stack = document.elementsFromPoint(clientX, clientY)
    for (const el of stack) {
      const folderEl = el.closest?.('[data-folder-id]')
      if (!folderEl) continue
      const fid = folderEl.getAttribute('data-folder-id')
      if (fid && fid !== excludeItemId) return fid
    }
    return null
  }, [])

  const flushPendingPosition = useCallback(() => {
    const pending = pendingPosRef.current
    if (!pending) return
    pendingPosRef.current = null
    rafRef.current = null
    const { id, x, y } = pending
    onItemsChange?.((prev) =>
      prev.map((i) => (i.id === id ? { ...i, x, y, parentId: null } : i))
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
      const rect = captureEl.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

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

      const dragState = {
        itemId: item.id,
        wrapEl,
        offsetX,
        offsetY,
        startClientX: e.clientX,
        startClientY: e.clientY,
        active: false,
        pointerId: e.pointerId,
        captureEl,
      }

      setDraggingId(item.id)
      onSelectIcons?.([item.id])

      const onMove = (ev) => {
        const dx = ev.clientX - dragState.startClientX
        const dy = ev.clientY - dragState.startClientY
        if (!dragState.active && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          return
        }
        dragState.active = true

        const wrap = dragState.wrapEl.getBoundingClientRect()
        let x = ev.clientX - wrap.left - dragState.offsetX
        let y = ev.clientY - wrap.top - dragState.offsetY
        x = Math.max(0, Math.min(wrap.width - ICON_WIDTH, x))
        y = Math.max(0, Math.min(wrap.height - ICON_HEIGHT, y))

        pendingPosRef.current = { id: dragState.itemId, x, y }
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            flushPendingPosition()
          })
        }

        const folderId = findFolderUnderPoint(ev.clientX, ev.clientY, dragState.itemId)
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
        setDraggingId(null)

        if (!dragState.active) return

        const folderId = findFolderUnderPoint(ev.clientX, ev.clientY, dragState.itemId)
        if (folderId) {
          const found = desktopItemsRef.current.find((i) => i.id === dragState.itemId)
          if (found && found.id !== folderId) {
            onItemsChange?.((prev) =>
              prev.map((i) => (i.id === dragState.itemId ? { ...i, parentId: folderId } : i))
            )
          }
        }
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [renamingId, onSelectIcons, findFolderUnderPoint, flushPendingPosition, onItemsChange]
  )

  return (
    <div className="desktop-custom-icons">
      {rootItems.map((item) => {
        const isFolder = item.type === 'folder'
        const isShortcut = item.type === 'shortcut'
        const Icon = isFolder ? Folder : isShortcut ? Gamepad2 : FileText
        const isDropTarget = dropTargetId === item.id
        const isDragging = draggingId === item.id

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
