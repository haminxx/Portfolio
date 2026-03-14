import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText, Gamepad2 } from 'lucide-react'
import './DesktopCustomIcons.css'

const DRAG_THRESHOLD = 10
const GRID_SIZE = 80

export default function DesktopCustomIcons({
  desktopItems = [],
  onItemsChange,
  onOpenFolder,
  onOpenApp,
  onIconContextMenu,
  startRenameId,
  onClearStartRenameId,
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [pendingDragId, setPendingDragId] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0, item: null, element: null })
  const lastClickRef = useRef({ id: null, time: 0 })

  const rootItems = desktopItems.filter((i) => !i.parentId)

  useEffect(() => {
    if (startRenameId && desktopItems.some((i) => i.id === startRenameId)) {
      const item = desktopItems.find((i) => i.id === startRenameId)
      setRenamingId(startRenameId)
      setRenameValue(item?.name ?? '')
      onClearStartRenameId?.()
    }
  }, [startRenameId, desktopItems, onClearStartRenameId])

  const handleStartRename = useCallback((item, defaultValue = '') => {
    setRenamingId(item.id)
    setRenameValue(defaultValue || item.name)
  }, [])

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

  const handleMouseDown = useCallback((e, item) => {
    if (e.button !== 0) return
    e.stopPropagation()
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      item,
      element: e.currentTarget,
    }
    setPendingDragId(item.id)
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      const { x, y, item, element } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (pendingDragId && distance >= DRAG_THRESHOLD) {
        setPendingDragId(null)
        setDraggingId(item.id)
      }
      if (draggingId) {
        if (element) {
          element.style.transform = `translate(${dx}px, ${dy}px)`
        }
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const folderEl = el?.closest('[data-folder-id]')
        setDropTargetId(folderEl ? folderEl.dataset.folderId : null)
      }
    },
    [draggingId, pendingDragId]
  )

  const handleMouseUp = useCallback(
    (e) => {
      if (!draggingId) return
      const { x, y, item } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const distance = Math.sqrt(dx * dx + dy * dy)

      setDraggingId(null)
      setDropTargetId(null)

      if (distance >= DRAG_THRESHOLD) {
        const { element } = dragStartRef.current
        if (element) element.style.transform = ''
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const folderEl = el?.closest('[data-folder-id]')
        const targetFolderId = folderEl?.dataset.folderId
        if (targetFolderId && item.type !== 'folder') {
          onItemsChange?.((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, parentId: targetFolderId } : i
            )
          )
        } else if (targetFolderId && item.type === 'folder' && item.id !== targetFolderId) {
          onItemsChange?.((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, parentId: targetFolderId } : i
            )
          )
        } else {
          const rawX = (item.x ?? 0) + dx
          const rawY = (item.y ?? 0) + dy
          const newX = Math.round(rawX / GRID_SIZE) * GRID_SIZE
          const newY = Math.round(rawY / GRID_SIZE) * GRID_SIZE
          onItemsChange?.((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, x: Math.max(0, newX), y: Math.max(0, newY) } : i
            )
          )
        }
      } else {
        lastClickRef.current = { id: item.id, time: Date.now() }
      }
    },
    [draggingId, onItemsChange]
  )

  const handleDocMouseUp = useCallback(
    (e) => {
      if (pendingDragId && !draggingId) {
        const { item } = dragStartRef.current
        lastClickRef.current = { id: item.id, time: Date.now() }
        setPendingDragId(null)
      }
    },
    [pendingDragId, draggingId]
  )

  useEffect(() => {
    if (!draggingId && !pendingDragId) return
    const up = (e) => {
      if (draggingId) handleMouseUp(e)
      else if (pendingDragId) handleDocMouseUp(e)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', up)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', up)
    }
  }, [draggingId, pendingDragId, handleMouseMove, handleMouseUp, handleDocMouseUp])

  return (
    <div className="desktop-custom-icons">
      {rootItems.map((item) => {
        const isFolder = item.type === 'folder'
        const isShortcut = item.type === 'shortcut'
        const Icon = isFolder ? Folder : isShortcut ? Gamepad2 : FileText
        const isDropTarget = dropTargetId === item.id && draggingId !== item.id

        return (
          <div
            key={item.id}
            className={`desktop-custom-icons__item ${draggingId === item.id ? 'desktop-custom-icons__item--dragging' : ''} ${isDropTarget ? 'desktop-custom-icons__item--drop-target' : ''}`}
            style={{ left: item.x ?? 24, top: item.y ?? 24 }}
            data-folder-id={isFolder ? item.id : undefined}
            onMouseDown={(e) => handleMouseDown(e, item)}
            onDoubleClick={(e) => handleDoubleClick(e, item)}
            onContextMenu={(e) => onIconContextMenu?.(e, item)}
          >
            <span className="desktop-custom-icons__icon">
              {isShortcut && item.appKey === 'doom' ? (
                <img src="/dock-icons/doom.png" alt="Doom" className="desktop-custom-icons__icon-img" />
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
