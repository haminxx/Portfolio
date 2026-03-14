import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText, Gamepad2 } from 'lucide-react'
import './DesktopCustomIcons.css'

const MOVE_THRESHOLD = 2
const ICON_WIDTH = 80
const ICON_HEIGHT = 96

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
  const [draggingId, setDraggingId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 })
  const [dropTargetId, setDropTargetId] = useState(null)
  const [pointerDownId, setPointerDownId] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0, item: null })

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
    dragStartRef.current = { x: e.clientX, y: e.clientY, item }
    setPointerDownId(item.id)
  }, [])

  const handleMouseMove = useCallback((e) => {
    const { x, y, item } = dragStartRef.current
    if (!item || pointerDownId !== item.id) return
    const dx = e.clientX - x
    const dy = e.clientY - y
    const distance = Math.sqrt(dx * dx + dy * dy)

    setDraggingId((prev) => {
      if (!prev && distance >= MOVE_THRESHOLD) return item.id
      return prev
    })
    setDragOffset({ dx, dy })
    if (distance >= MOVE_THRESHOLD) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const folderEl = el?.closest('[data-folder-id]')
      setDropTargetId(folderEl ? folderEl.dataset.folderId : null)
    }
  }, [pointerDownId])

  const handleMouseUp = useCallback(
    (e) => {
      const { item } = dragStartRef.current
      if (!item || pointerDownId !== item.id) return
      setPointerDownId(null)

      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      const wasDragging = draggingId === item.id

      setDraggingId(null)
      setDragOffset({ dx: 0, dy: 0 })
      setDropTargetId(null)

      if (!wasDragging) return

      let targetFolderId = null
      const el = document.querySelector(`[data-desktop-item-id="${item.id}"]`)
      if (el) {
        el.style.pointerEvents = 'none'
        el.style.visibility = 'hidden'
        const hitEl = document.elementFromPoint(e.clientX, e.clientY)
        const folderEl = hitEl?.closest('[data-folder-id]')
        targetFolderId = folderEl?.dataset.folderId
        el.style.pointerEvents = ''
        el.style.visibility = ''
      }

      if (targetFolderId && item.type !== 'folder' && item.id !== targetFolderId) {
        onItemsChange?.((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, parentId: targetFolderId } : i))
        )
      } else if (targetFolderId && item.type === 'folder' && item.id !== targetFolderId) {
        onItemsChange?.((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, parentId: targetFolderId } : i))
        )
      } else {
        const vw = window.innerWidth
        const vh = window.innerHeight
        const rawX = (item.x ?? 24) + dx
        const rawY = (item.y ?? 24) + dy
        const newX = Math.max(0, Math.min(vw - ICON_WIDTH, rawX))
        const newY = Math.max(0, Math.min(vh - ICON_HEIGHT, rawY))
        onItemsChange?.((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, x: newX, y: newY } : i))
        )
      }
    },
    [draggingId, pointerDownId, onItemsChange]
  )

  useEffect(() => {
    if (!pointerDownId) return
    const move = (e) => handleMouseMove(e)
    const up = (e) => handleMouseUp(e)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
  }, [pointerDownId, handleMouseMove, handleMouseUp])

  return (
    <div className="desktop-custom-icons">
      {rootItems.map((item) => {
        const isFolder = item.type === 'folder'
        const isShortcut = item.type === 'shortcut'
        const Icon = isFolder ? Folder : isShortcut ? Gamepad2 : FileText
        const isDropTarget = dropTargetId === item.id && draggingId !== item.id
        const isDragging = draggingId === item.id
        const offset = isDragging ? dragOffset : { dx: 0, dy: 0 }

        return (
          <div
            key={item.id}
            className={`desktop-custom-icons__item ${isDragging ? 'desktop-custom-icons__item--dragging' : ''} ${selectedIds.includes(item.id) ? 'desktop-custom-icons__item--selected' : ''} ${isDropTarget ? 'desktop-custom-icons__item--drop-target' : ''}`}
            style={{
              left: item.x ?? 24,
              top: item.y ?? 24,
              transform: `translate(${offset.dx}px, ${offset.dy}px)${isDragging ? ' scale(1.05)' : ''}`,
            }}
            data-desktop-item-id={item.id}
            data-folder-id={isFolder ? item.id : undefined}
            onMouseDown={(e) => handleMouseDown(e, item)}
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
