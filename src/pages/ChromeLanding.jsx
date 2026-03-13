import { useState, useCallback } from 'react'
import ChromeFrame from '../components/ChromeFrame'
import ChromeWindow from '../components/ChromeWindow'
import ChromeHome from '../components/ChromeHome'
import ChromeContextMenu from '../components/ChromeContextMenu'
import Desktop from '../components/Desktop'
import FolderWindow from '../components/FolderWindow'
import MenuBar from '../components/MenuBar'
import Dock from '../components/Dock'
import { APPS, getDomainForApp } from '../config/apps'
import { SHORTCUTS } from '../config/shortcuts'
import './ChromeLanding.css'

const HOME_TAB = { id: 'home', title: 'Home', type: 'home' }
const DESKTOP_ITEMS_KEY = 'desktop-items'

function loadDesktopItems() {
  try {
    const raw = localStorage.getItem(DESKTOP_ITEMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDesktopItems(items) {
  try {
    localStorage.setItem(DESKTOP_ITEMS_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function getDomainForTab(tab) {
  if (tab.type === 'home') return 'portfolio.local'
  const shortcut = SHORTCUTS.find((s) => s.type === tab.type)
  if (shortcut) {
    if (tab.type === 'linkedin') return 'linkedin.com/in/christian-j-l'
    if (tab.type === 'github') return 'github.com/haminxx'
    return `${tab.type}.local`
  }
  return getDomainForApp(tab.type)
}

const EMBED_BLOCKED_TYPES = ['linkedin', 'github', 'instagram']

function getUrlForTab(tab) {
  const shortcut = SHORTCUTS.find((s) => s.type === tab.type)
  if (shortcut?.url) return shortcut.url
  const app = APPS[tab.type]
  return app?.url ?? null
}

export default function ChromeLanding() {
  const [tabs, setTabs] = useState([HOME_TAB])
  const [activeTabId, setActiveTabId] = useState('home')
  const [chromeMaximized, setChromeMaximized] = useState(false)
  const [chromeMinimized, setChromeMinimized] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [chromeContextMenu, setChromeContextMenu] = useState(null)
  const [desktopItems, setDesktopItemsState] = useState(() => loadDesktopItems())
  const [openFolderId, setOpenFolderId] = useState(null)
  const [startRenameId, setStartRenameId] = useState(null)

  const setDesktopItems = useCallback((fnOrValue) => {
    setDesktopItemsState((prev) => {
      const next = typeof fnOrValue === 'function' ? fnOrValue(prev) : fnOrValue
      saveDesktopItems(next)
      return next
    })
  }, [])

  const handleNewFolder = useCallback((x, y) => {
    const id = `folder-${Date.now()}`
    setDesktopItems((prev) => [...prev, { id, type: 'folder', name: 'New Folder', parentId: null, x, y }])
    setStartRenameId(id)
  }, [setDesktopItems])

  const handleNewFile = useCallback((x, y) => {
    const id = `file-${Date.now()}`
    setDesktopItems((prev) => [...prev, { id, type: 'file', name: 'New File', parentId: null, x, y }])
    setStartRenameId(id)
  }, [setDesktopItems])

  const handleOpenFolder = useCallback((id) => setOpenFolderId(id), [])
  const handleStartRename = useCallback((id) => setStartRenameId(id), [])

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const currentDomain = getDomainForTab(activeTab)

  const openAppTab = useCallback((appKey) => {
    const app = APPS[appKey]
    if (!app) return
    const id = `${appKey}-${Date.now()}`
    const newTab = { id, title: app.label, type: appKey }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(id)
    setChromeMinimized(false)
  }, [])

  const openShortcutTab = useCallback((shortcutType) => {
    const shortcut = SHORTCUTS.find((s) => s.type === shortcutType)
    if (!shortcut) return
    const id = `${shortcutType}-${Date.now()}`
    const newTab = { id, title: shortcut.label, type: shortcutType }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(id)
    setChromeMinimized(false)
  }, [])

  const setActiveTab = useCallback((id) => setActiveTabId(id), [])
  const closeTab = useCallback((id) => {
    const willBeEmpty = tabs.filter((t) => t.id !== id).length === 0
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (activeTabId === id && next.length) setActiveTabId(next[0].id)
      else if (activeTabId === id) setActiveTabId('home')
      return next.length ? next : [HOME_TAB]
    })
    if (willBeEmpty) setChromeMinimized(true)
  }, [activeTabId, tabs])

  const goHome = useCallback(() => setActiveTabId('home'), [])
  const toggleMaximize = useCallback(() => setChromeMaximized((m) => !m), [])
  const setMinimized = useCallback(() => setChromeMinimized(true), [])

  return (
    <div className="chrome-landing">
      <Desktop
        onOpenApp={openAppTab}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        desktopItems={desktopItems}
        onItemsChange={setDesktopItems}
        onOpenFolder={handleOpenFolder}
        onNewFolder={handleNewFolder}
        onNewFile={handleNewFile}
        onStartRename={handleStartRename}
        startRenameId={startRenameId}
        onClearStartRenameId={() => setStartRenameId(null)}
      />
      {!chromeMinimized && (
        <ChromeWindow isMaximized={chromeMaximized} onMaximize={toggleMaximize}>
          <ChromeFrame
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
            currentDomain={currentDomain}
            onGoHome={goHome}
            activeTabType={activeTab.type}
            onMaximize={toggleMaximize}
            onMinimize={setMinimized}
            onWindowClose={setMinimized}
          />
          <div
            className="chrome-landing__content"
            onContextMenu={(e) => {
              e.preventDefault()
              const url = getUrlForTab(activeTab)
              setChromeContextMenu({ x: e.clientX, y: e.clientY, url })
            }}
          >
          {activeTab.type === 'home' ? (
            <ChromeHome onShortcut={openShortcutTab} />
          ) : (() => {
            const url = getUrlForTab(activeTab)
            const isEmbedBlocked = EMBED_BLOCKED_TYPES.includes(activeTab.type)
            if (url && isEmbedBlocked) {
              return (
                <div className="chrome-landing__embed-blocked">
                  <p className="chrome-landing__embed-msg">
                    {activeTab.title} restricts embedding. Open in a new tab to view.
                  </p>
                  <button
                    type="button"
                    className="chrome-landing__open-tab-btn"
                    onClick={() => window.open(url, '_blank')}
                  >
                    Open in new tab
                  </button>
                </div>
              )
            }
            if (url) {
              return (
                <iframe src={url} className="chrome-landing__iframe" title={activeTab.title} />
              )
            }
            return (
              <div className="chrome-landing__empty">
                <span>Opened: {activeTab.title}</span>
              </div>
            )
          })()}
          </div>
        </ChromeWindow>
      )}
      <MenuBar />
      <Dock
        onOpenApp={openAppTab}
        isChromeMinimized={chromeMinimized}
        isChromeMaximized={chromeMaximized}
        onRestoreChrome={() => setChromeMinimized(false)}
      />
      {openFolderId && (
        <FolderWindow
          folderId={openFolderId}
          folderName={desktopItems.find((i) => i.id === openFolderId)?.name ?? 'Folder'}
          desktopItems={desktopItems}
          onItemsChange={setDesktopItems}
          onClose={() => setOpenFolderId(null)}
          onOpenFolder={handleOpenFolder}
        />
      )}
      {chromeContextMenu && (
        <ChromeContextMenu
          x={chromeContextMenu.x}
          y={chromeContextMenu.y}
          currentUrl={chromeContextMenu.url}
          onClose={() => setChromeContextMenu(null)}
          onOpenInNewTab={() => {}}
        />
      )}
    </div>
  )
}
