import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText, Gamepad2 } from 'lucide-react'
import './DesktopCustomIcons.css'

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
  const [dropTargetId, setDropTargetId] = useState(null)
  const rootItems = desktopItems.filter((i) => !i.parentId)

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

  const handleDragStart = useCallback((e, item) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, offsetX, offsetY }))
    e.dataTransfer.dropEffect = 'move'
    setTimeout(() => e.target.classList.add('desktop-custom-icons__item--dragging'), 0)
  }, [])

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove('desktop-custom-icons__item--dragging')
    setDropTargetId(null)
  }, [])

  const handleDragOver = useCallback((e, folderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (folderId) setDropTargetId(folderId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null)
  }, [])

  const handleDropOnFolder = useCallback(
    (e, folderId) => {
      e.preventDefault()
      e.stopPropagation()
      setDropTargetId(null)
      const data = e.dataTransfer.getData('application/json')
      if (!data) return
      let parsed
      try {
        parsed = JSON.parse(data)
      } catch {
        return
      }
      const { id } = parsed
      const item = desktopItems.find((i) => i.id === id)
      if (!item || item.id === folderId) return
      onItemsChange?.((prev) =>
        prev.map((i) => (i.id === id ? { ...i, parentId: folderId } : i))
      )
    },
    [desktopItems, onItemsChange]
  )

  return (
    <div className="desktop-custom-icons">
      {rootItems.map((item) => {
        const isFolder = item.type === 'folder'
        const isShortcut = item.type === 'shortcut'
        const Icon = isFolder ? Folder : isShortcut ? Gamepad2 : FileText
        const isDropTarget = dropTargetId === item.id

        return (
          <div
            key={item.id}
            className={`desktop-custom-icons__item ${selectedIds.includes(item.id) ? 'desktop-custom-icons__item--selected' : ''} ${isDropTarget ? 'desktop-custom-icons__item--drop-target' : ''}`}
            style={{ left: item.x ?? 24, top: item.y ?? 24 }}
            data-desktop-item-id={item.id}
            data-folder-id={isFolder ? item.id : undefined}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={isFolder ? (e) => handleDragOver(e, item.id) : undefined}
            onDragLeave={isFolder ? handleDragLeave : undefined}
            onDrop={isFolder ? (e) => handleDropOnFolder(e, item.id) : undefined}
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
