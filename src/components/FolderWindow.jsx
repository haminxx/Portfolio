import { useState, useCallback, useRef, useEffect } from 'react'
import { Folder, FileText, Home, X, Minus, Maximize2 } from 'lucide-react'
import './FolderWindow.css'

const SIDEBAR_ITEMS = [
  { id: 'recents', label: 'Recents', icon: 'clock' },
  { id: 'desktop', label: 'Desktop', icon: 'desktop' },
  { id: 'documents', label: 'Documents', icon: 'folder' },
  { id: 'downloads', label: 'Downloads', icon: 'download' },
]

export default function FolderWindow({
  folderId,
  folderName = 'Folder',
  desktopItems = [],
  onItemsChange,
  onClose,
  onOpenFolder,
}) {
  const [activeSidebarId, setActiveSidebarId] = useState('desktop')
  const [openFolders, setOpenFolders] = useState(new Set())
  const [position, setPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    const w = Math.min(700, window.innerWidth * 0.9)
    const h = Math.min(450, window.innerHeight * 0.7)
    return { x: (window.innerWidth - w) / 2, y: Math.max(0, (window.innerHeight - h) / 2) }
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isOpening, setIsOpening] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [openingPhase, setOpeningPhase] = useState('dock')
  const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0 })

  useEffect(() => {
    if (!isOpening) return
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpeningPhase('final'))
    })
    return () => cancelAnimationFrame(t)
  }, [isOpening])

  const handleOpeningTransitionEnd = useCallback((e) => {
    if (!isOpening || openingPhase !== 'final') return
    if (e.propertyName === 'transform' || e.propertyName === 'opacity' || e.propertyName === 'top' || e.propertyName === 'left') {
      setIsOpening(false)
    }
  }, [isOpening, openingPhase])

  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
  }, [isClosing])

  useEffect(() => {
    if (!isClosing) return
    const el = document.getElementById(`folder-window-${folderId}`)
    if (!el) return
    const onEnd = () => onClose?.()
    el.addEventListener('animationend', onEnd, { once: true })
    return () => el.removeEventListener('animationend', onEnd)
  }, [isClosing, folderId, onClose])

  const handleTitleMouseDown = useCallback((e) => {
    if (e.target.closest('button')) return
    e.preventDefault()
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y,
    }
  }, [position])

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e) => {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPosition({
        x: Math.max(0, dragRef.current.startLeft + dx),
        y: Math.max(0, dragRef.current.startTop + dy),
      })
    }
    const handleUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging])

  const winWidth = Math.min(700, typeof window !== 'undefined' ? window.innerWidth * 0.9 : 700)
  const winHeight = Math.min(450, typeof window !== 'undefined' ? window.innerHeight * 0.7 : 450)
  const finalX = (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - winWidth / 2
  const finalY = (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 - winHeight / 2
  const showOpening = isOpening && openingPhase === 'dock'
  const folderStyle = showOpening
    ? {
        left: finalX,
        top: finalY,
        width: winWidth,
        height: winHeight,
        transform: 'scale(0.05) translateY(40vh)',
        opacity: 0,
      }
    : isClosing
      ? { left: position.x, top: position.y, width: winWidth, height: winHeight }
      : { left: position.x, top: position.y, width: winWidth, height: winHeight, opacity: 1 }

  const children = desktopItems.filter((i) => i.parentId === folderId)
  const subfolders = desktopItems.filter((i) => i.type === 'folder')
  const sidebarItems = SIDEBAR_ITEMS.map((s) => ({
    ...s,
    Icon: s.icon === 'folder' ? Folder : Home,
  }))

  const toggleFolder = useCallback((id) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDoubleClick = useCallback(
    (item) => {
      if (item.type === 'folder') {
        onOpenFolder?.(item.id)
      }
    },
    [onOpenFolder]
  )

  const handleNewFolder = useCallback(() => {
    const id = `folder-${Date.now()}`
    const name = 'New Folder'
    onItemsChange?.((prev) => [
      ...prev,
      { id, type: 'folder', name, parentId: folderId, x: 0, y: 0 },
    ])
  }, [folderId, onItemsChange])

  const handleNewFile = useCallback(() => {
    const id = `file-${Date.now()}`
    const name = 'New File'
    onItemsChange?.((prev) => [
      ...prev,
      { id, type: 'file', name, parentId: folderId, x: 0, y: 0 },
    ])
  }, [folderId, onItemsChange])

  return (
    <div
      id={`folder-window-${folderId}`}
      className={`folder-window ${isDragging ? 'folder-window--dragging' : ''} ${isOpening ? 'folder-window--opening' : ''} ${isClosing ? 'folder-window--closing' : ''}`}
      style={folderStyle}
      onTransitionEnd={isOpening ? handleOpeningTransitionEnd : undefined}
    >
      <div
        className="folder-window__titlebar"
        onMouseDown={handleTitleMouseDown}
      >
        <div className="folder-window__traffic-lights">
          <button type="button" className="folder-window__btn folder-window__btn--close" aria-label="Close" onClick={handleClose}>
            <X className="folder-window__traffic-icon" size={9} strokeWidth={3} />
          </button>
          <button type="button" className="folder-window__btn folder-window__btn--minimize" aria-label="Minimize">
            <Minus className="folder-window__traffic-icon" size={9} strokeWidth={3} />
          </button>
          <button type="button" className="folder-window__btn folder-window__btn--maximize" aria-label="Maximize">
            <Maximize2 className="folder-window__traffic-icon" size={8} strokeWidth={2.5} />
          </button>
        </div>
        <span className="folder-window__title">{folderName}</span>
      </div>
      <div className="folder-window__body">
        <aside className="folder-window__sidebar">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`folder-window__sidebar-item ${activeSidebarId === item.id ? 'folder-window__sidebar-item--active' : ''}`}
              onClick={() => setActiveSidebarId(item.id)}
            >
              <item.Icon size={18} strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>
        <main className="folder-window__content">
          <div className="folder-window__toolbar">
            <button type="button" className="folder-window__toolbar-btn" onClick={handleNewFolder}>
              New Folder
            </button>
            <button type="button" className="folder-window__toolbar-btn" onClick={handleNewFile}>
              New File
            </button>
          </div>
          <div className="folder-window__items">
            {children.map((item) => {
              const Icon = item.type === 'folder' ? Folder : FileText
              return (
                <button
                  key={item.id}
                  type="button"
                  className="folder-window__content-item"
                  onDoubleClick={() => handleDoubleClick(item)}
                >
                  <span className="folder-window__content-icon">
                    <Icon size={32} strokeWidth={1.5} />
                  </span>
                  <span className="folder-window__content-label">{item.name}</span>
                </button>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
