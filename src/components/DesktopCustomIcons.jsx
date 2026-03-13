import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText } from 'lucide-react'
import './DesktopCustomIcons.css'

const DRAG_THRESHOLD = 10

export default function DesktopCustomIcons({
  desktopItems = [],
  onItemsChange,
  onOpenFolder,
  onIconContextMenu,
  startRenameId,
  onClearStartRenameId,
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0, item: null })
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
      }
    },
    [onOpenFolder]
  )

  const handleMouseDown = useCallback(
    (e, item) => {
      if (e.button !== 0) return
      e.stopPropagation()
      setDraggingId(item.id)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        item,
      }
    },
    []
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!draggingId) return
      const { x, y, item } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance >= DRAG_THRESHOLD) {
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const folderEl = el?.closest('[data-folder-id]')
        setDropTargetId(folderEl ? folderEl.dataset.folderId : null)
      }
    },
    [draggingId]
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
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      if (distance >= DRAG_THRESHOLD) {
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
          const newX = (item.x ?? 0) + dx
          const newY = (item.y ?? 0) + dy
          onItemsChange?.((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, x: newX, y: newY } : i
            )
          )
        }
      } else {
        const now = Date.now()
        const last = lastClickRef.current
        if (last.id === item.id && now - last.time < 400) {
          if (item.type === 'folder') onOpenFolder?.(item.id)
          lastClickRef.current = { id: null, time: 0 }
        } else {
          lastClickRef.current = { id: item.id, time: now }
        }
      }
    },
    [draggingId, handleMouseMove, onItemsChange, onOpenFolder]
  )

  useEffect(() => {
    if (!draggingId) return
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingId, handleMouseMove, handleMouseUp])

  return (
    <div className="desktop-custom-icons">
      {rootItems.map((item) => {
        const isFolder = item.type === 'folder'
        const Icon = isFolder ? Folder : FileText
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
              <Icon size={40} strokeWidth={1.5} />
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
