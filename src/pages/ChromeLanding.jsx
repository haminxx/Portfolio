import { useState, useCallback, useEffect } from 'react'
import { useScreenshot } from '../hooks/useScreenshot'
import ChromeFrame from '../components/ChromeFrame'
import ChromeWindow from '../components/ChromeWindow'
import ChromeHome from '../components/ChromeHome'
import ChromeContextMenu from '../components/ChromeContextMenu'
import Desktop from '../components/Desktop'
import GitHubProfileCard from '../components/GitHubProfileCard'
import LinkedInProfileCard from '../components/LinkedInProfileCard'
import InstagramProfileCard from '../components/InstagramProfileCard'
import SocialProfileWindow from '../components/SocialProfileWindow'
import FolderWindow from '../components/FolderWindow'
import MapWindow from '../components/MapWindow'
import NetflixWindow from '../components/NetflixWindow'
import YouTubeMusicWindow from '../components/YouTubeMusicWindow'
import SettingsWindow from '../components/SettingsWindow'
import AppStoreWindow from '../components/AppStoreWindow'
import GalleryWindow from '../components/GalleryWindow'
import MenuBar from '../components/MenuBar'
import Dock from '../components/Dock'
import AppWindow from '../components/AppWindow'
import { APPS, getDomainForApp } from '../config/apps'
import { SHORTCUTS } from '../config/shortcuts'
import { Globe, Image, Film, Images, ShoppingBag, Settings, Map } from 'lucide-react'
import './ChromeLanding.css'

const APP_ICONS = {
  chrome: Globe,
  instagram: Image,
  netflix: Film,
  gallery: Images,
  appStore: ShoppingBag,
  settings: Settings,
  map: Map,
  youtubeMusic: Film,
}

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
  const [openAppWindows, setOpenAppWindows] = useState([])
  const [focusedAppWindowId, setFocusedAppWindowId] = useState(null)
  const [showShutdown, setShowShutdown] = useState(false)
  const [nightMode, setNightMode] = useState(true)
  const { isCapturing, takeScreenshot } = useScreenshot()

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
    if (appKey === 'chrome') {
      setChromeMinimized(false)
      return
    }
    setOpenAppWindows((prev) => {
      const existing = prev.find((w) => w.appKey === appKey)
      if (existing) {
        setFocusedAppWindowId(existing.id)
        return prev
      }
      const id = `app-${appKey}-${Date.now()}`
      const win = {
        id,
        appKey,
        position: { x: 120 + prev.length * 40, y: 80 + prev.length * 40 },
        isMaximized: false,
        isMinimized: false,
        isOpening: true,
      }
      setFocusedAppWindowId(id)
      return [...prev, win]
    })
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

  useEffect(() => {
    document.documentElement.dataset.theme = nightMode ? 'dark' : 'light'
  }, [nightMode])

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
          ) : activeTab.type === 'github' ? (
            <SocialProfileWindow profileUrl={getUrlForTab(activeTab)}>
              <GitHubProfileCard profileUrl={getUrlForTab(activeTab)} />
            </SocialProfileWindow>
          ) : activeTab.type === 'linkedin' ? (
            <SocialProfileWindow profileUrl={getUrlForTab(activeTab)}>
              <LinkedInProfileCard profileUrl={getUrlForTab(activeTab)} />
            </SocialProfileWindow>
          ) : activeTab.type === 'instagram' ? (
            <SocialProfileWindow profileUrl={getUrlForTab(activeTab)}>
              <InstagramProfileCard profileUrl={getUrlForTab(activeTab)} />
            </SocialProfileWindow>
          ) : (() => {
            const url = getUrlForTab(activeTab)
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
      <MenuBar
        onTurnOff={() => setShowShutdown(true)}
        onRestart={() => setShowShutdown(true)}
        onSleep={() => setShowShutdown(true)}
        nightMode={nightMode}
        onNightModeToggle={() => setNightMode((m) => !m)}
        isCapturing={isCapturing}
        onScreenshot={takeScreenshot}
      />
      <Dock
        onOpenApp={openAppTab}
        isChromeMaximized={chromeMaximized}
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
      {[...openAppWindows]
        .sort((a, b) => {
          if (a.id === focusedAppWindowId) return 1
          if (b.id === focusedAppWindowId) return -1
          return 0
        })
        .map((win) => {
        const app = APPS[win.appKey]
        if (!app) return null
        const Icon = APP_ICONS[win.appKey]
        const profileUrl = app.url ?? SHORTCUTS.find((s) => s.type === win.appKey)?.url
        let content
        if (win.appKey === 'map') {
          content = <MapWindow />
        } else if (win.appKey === 'netflix') {
          content = <NetflixWindow />
        } else if (win.appKey === 'youtubeMusic') {
          content = <YouTubeMusicWindow />
        } else if (win.appKey === 'instagram') {
          content = (
            <SocialProfileWindow profileUrl={profileUrl}>
              <InstagramProfileCard profileUrl={profileUrl} />
            </SocialProfileWindow>
          )
        } else if (win.appKey === 'github') {
          content = (
            <SocialProfileWindow profileUrl={profileUrl}>
              <GitHubProfileCard profileUrl={profileUrl} />
            </SocialProfileWindow>
          )
        } else if (win.appKey === 'linkedin') {
          content = (
            <SocialProfileWindow profileUrl={profileUrl}>
              <LinkedInProfileCard profileUrl={profileUrl} />
            </SocialProfileWindow>
          )
        } else if (win.appKey === 'settings') {
          content = <SettingsWindow />
        } else if (win.appKey === 'appStore') {
          content = <AppStoreWindow />
        } else if (win.appKey === 'gallery') {
          content = <GalleryWindow />
        } else if (profileUrl) {
          content = <iframe src={profileUrl} className="chrome-landing__iframe" title={app.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
        } else {
          content = <div className="chrome-landing__empty" style={{ padding: 24 }}><span>Opened: {app.label}</span></div>
        }
        return (
          <AppWindow
            key={win.id}
            id={win.id}
            title={app.label}
            icon={Icon ? <Icon size={16} strokeWidth={1.5} /> : null}
            position={win.position}
            isOpening={win.isOpening}
            onOpeningComplete={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isOpening: false } : w)))}
            onPositionChange={(pos) => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, position: pos } : w)))}
            onClose={() => setOpenAppWindows((prev) => prev.filter((w) => w.id !== win.id))}
            onMinimize={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMinimized: true } : w)))}
            onMaximize={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMaximized: !w.isMaximized } : w)))}
            isMaximized={win.isMaximized}
            isFocused={focusedAppWindowId === win.id}
            onFocus={() => setFocusedAppWindowId(win.id)}
          >
            {content}
          </AppWindow>
        )
      })}
      {showShutdown && (
        <div
          className="chrome-landing__shutdown"
          role="dialog"
          aria-label="Shutting down"
        >
          <div className="chrome-landing__shutdown-inner" />
        </div>
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
