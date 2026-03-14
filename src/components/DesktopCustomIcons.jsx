import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText, Gamepad2 } from 'lucide-react'
import './DesktopCustomIcons.css'

const DRAG_THRESHOLD = 1
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
  const [draggingIds, setDraggingIds] = useState([])
  const [dropTargetId, setDropTargetId] = useState(null)
  const [pendingDragId, setPendingDragId] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0, item: null, element: null, selectedItems: [] })
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
    const roots = desktopItems.filter((i) => !i.parentId)
    const isInSelection = selectedIds.includes(item.id)
    const itemsToMove = isInSelection
      ? roots.filter((i) => selectedIds.includes(i.id))
      : [item]
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      item,
      element: e.currentTarget,
      selectedItems: itemsToMove,
    }
    setPendingDragId(item.id)
  }, [selectedIds, desktopItems])

  const handleMouseMove = useCallback(
    (e) => {
      const { x, y, item, element } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const isDragging = draggingId === item.id || (pendingDragId === item.id && distance >= DRAG_THRESHOLD)
      if (pendingDragId && distance >= DRAG_THRESHOLD) {
        const { selectedItems } = dragStartRef.current
        setPendingDragId(null)
        setDraggingId(item.id)
        setDraggingIds(selectedItems.map((i) => i.id))
      }
      if (isDragging) {
        const { selectedItems } = dragStartRef.current
        selectedItems.forEach((it) => {
          const el = document.querySelector(`[data-desktop-item-id="${it.id}"]`)
          if (el) el.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`
        })
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
      const { x, y, item, element } = dragStartRef.current
      const dx = e.clientX - x
      const dy = e.clientY - y
      const distance = Math.sqrt(dx * dx + dy * dy)

      setDraggingId(null)
      setDraggingIds([])
      setDropTargetId(null)

      if (distance >= DRAG_THRESHOLD) {
        const { selectedItems } = dragStartRef.current
        selectedItems.forEach((it) => {
          const el = document.querySelector(`[data-desktop-item-id="${it.id}"]`)
          if (el) el.style.transform = ''
        })
        let targetFolderId = null
        if (element) {
          element.style.pointerEvents = 'none'
          element.style.visibility = 'hidden'
          const el = document.elementFromPoint(e.clientX, e.clientY)
          const folderEl = el?.closest('[data-folder-id]')
          targetFolderId = folderEl?.dataset.folderId
          element.style.pointerEvents = ''
          element.style.visibility = ''
        }
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
          const vw = window.innerWidth
          const vh = window.innerHeight
          onItemsChange?.((prev) =>
            prev.map((i) => {
              if (!selectedItems.some((s) => s.id === i.id)) return i
              const rawX = (i.x ?? 24) + dx
              const rawY = (i.y ?? 24) + dy
              const newX = Math.max(0, Math.min(vw - ICON_WIDTH, rawX))
              const newY = Math.max(0, Math.min(vh - ICON_HEIGHT, rawY))
              return { ...i, x: newX, y: newY }
            })
          )
        }
      } else {
        lastClickRef.current = { id: item.id, time: Date.now() }
        onSelectIcons?.([item.id])
      }
    },
    [draggingId, onItemsChange, onSelectIcons]
  )

  const handleDocMouseUp = useCallback(
    (e) => {
      if (pendingDragId && !draggingId) {
        const { item } = dragStartRef.current
        lastClickRef.current = { id: item.id, time: Date.now() }
        onSelectIcons?.([item.id])
        setPendingDragId(null)
      }
    },
    [pendingDragId, draggingId, onSelectIcons]
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
            className={`desktop-custom-icons__item ${(draggingId === item.id || draggingIds.includes(item.id)) ? 'desktop-custom-icons__item--dragging' : ''} ${pendingDragId === item.id ? 'desktop-custom-icons__item--pending' : ''} ${selectedIds.includes(item.id) ? 'desktop-custom-icons__item--selected' : ''} ${isDropTarget ? 'desktop-custom-icons__item--drop-target' : ''}`}
            style={{ left: item.x ?? 24, top: item.y ?? 24 }}
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
