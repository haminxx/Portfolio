import { useState, useCallback } from 'react'
import { Folder, FileText, Home } from 'lucide-react'
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
    <div className="folder-window">
      <div className="folder-window__titlebar">
        <div className="folder-window__traffic-lights">
          <button type="button" className="folder-window__btn folder-window__btn--close" aria-label="Close" onClick={onClose} />
          <button type="button" className="folder-window__btn folder-window__btn--minimize" aria-label="Minimize" />
          <button type="button" className="folder-window__btn folder-window__btn--maximize" aria-label="Maximize" />
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
