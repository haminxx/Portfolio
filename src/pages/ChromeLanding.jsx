import { useState, useCallback, useEffect } from 'react'
import { useScreenshot } from '../hooks/useScreenshot'
import ChromeFrame from '../components/ChromeFrame'
import ChromeWindow from '../components/ChromeWindow'
import ChromeHome from '../components/ChromeHome'
import ChromeContextMenu from '../components/ChromeContextMenu'
import Desktop from '../components/Desktop'
import GitHubProfileCard from '../components/GitHubProfileCard'
import LinkedInProfileCard from '../components/LinkedInProfileCard'
import InstagramWindow from '../components/InstagramWindow'
import AboutPage from '../components/AboutPage'
import ProjectPage from '../components/ProjectPage'
import ContactPage from '../components/ContactPage'
import SocialProfileWindow from '../components/SocialProfileWindow'
import FolderWindow from '../components/FolderWindow'
import MapWindow from '../components/MapWindow'
import DoomWindow from '../components/DoomWindow'
import DadNMeWindow from '../components/DadNMeWindow'
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
import { useLanguage } from '../context/LanguageContext'
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
  const [chromeMinimizing, setChromeMinimizing] = useState(false)
  const [chromeOpening, setChromeOpening] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [chromeContextMenu, setChromeContextMenu] = useState(null)
  const [desktopItems, setDesktopItemsState] = useState(() => {
    const loaded = loadDesktopItems()
    const hasDoom = loaded.some((i) => i.type === 'shortcut' && i.appKey === 'doom')
    const hasDadnme = loaded.some((i) => i.type === 'shortcut' && i.appKey === 'dadnme')
    let next = [...loaded]
    if (!hasDoom) {
      next = [...next, { id: 'doom-shortcut', type: 'shortcut', name: 'Doom', appKey: 'doom', parentId: null, x: 24, y: 24 }]
    }
    if (!hasDadnme) {
      next = [...next, { id: 'dadnme-shortcut', type: 'shortcut', name: "Dad 'n Me", appKey: 'dadnme', parentId: null, x: 120, y: 24 }]
    }
    if (!hasDoom || !hasDadnme) saveDesktopItems(next)
    return next
  })
  const [openFolderId, setOpenFolderId] = useState(null)
  const [startRenameId, setStartRenameId] = useState(null)
  const [openAppWindows, setOpenAppWindows] = useState([])
  const [focusedAppWindowId, setFocusedAppWindowId] = useState(null)
  const [chromeFocused, setChromeFocused] = useState(false)
  const [showShutdown, setShowShutdown] = useState(false)
  const [nightMode, setNightMode] = useState(true)
  const { isCapturing, takeScreenshot } = useScreenshot()
  const { t } = useLanguage()

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
      if (chromeMinimized) {
        setChromeMinimized(false)
        setChromeOpening(true)
        setChromeFocused(true)
        setFocusedAppWindowId(null)
      } else {
        setChromeMinimizing(true)
      }
      return
    }
    setOpenAppWindows((prev) => {
      const existing = prev.find((w) => w.appKey === appKey)
      if (existing) {
        setFocusedAppWindowId(existing.id)
        if (existing.isMinimized) {
          return prev.map((w) =>
            w.id === existing.id ? { ...w, isMinimized: false, isOpening: true } : w
          )
        }
        return prev.map((w) =>
          w.id === existing.id ? { ...w, isMinimizing: true } : w
        )
      }
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      const winWidth = Math.min(880, Math.max(400, vw * 0.85))
      const winHeight = Math.min(660, Math.max(400, vh * 0.8))
      const x = Math.max(0, (vw - winWidth) / 2 + prev.length * 24)
      const y = Math.max(0, (vh - winHeight) / 2 + prev.length * 24 - 36)
      const id = `app-${appKey}-${Date.now()}`
      const win = {
        id,
        appKey,
        position: { x, y },
        size: { width: winWidth, height: winHeight },
        isMaximized: false,
        isMinimized: false,
        isOpening: true,
      }
      setFocusedAppWindowId(id)
      return [...prev, win]
    })
  }, [chromeMinimized])

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
  const reorderTabs = useCallback((newTabs) => {
    setTabs(newTabs)
  }, [])
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

  const openNewHomeTab = useCallback(() => {
    const homeTab = { id: `home-${Date.now()}`, title: 'Home', type: 'home' }
    setTabs((prev) => [...prev, homeTab])
    setActiveTabId(homeTab.id)
    setChromeMinimized(false)
  }, [])
  const toggleMaximize = useCallback(() => setChromeMaximized((m) => !m), [])
  const setMinimized = useCallback(() => setChromeMinimizing(true), [])

  const handleChromeMinimizeComplete = useCallback(() => {
    setChromeMinimized(true)
    setChromeMinimizing(false)
  }, [])

  const handleChromeOpeningComplete = useCallback(() => {
    setChromeOpening(false)
  }, [])

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
      <MenuBar
        onTurnOff={() => setShowShutdown(true)}
        onRestart={() => setShowShutdown(true)}
        onSleep={() => setShowShutdown(true)}
        nightMode={nightMode}
        onNightModeToggle={() => setNightMode((m) => !m)}
        isCapturing={isCapturing}
        onScreenshot={takeScreenshot}
        onNewTab={openNewHomeTab}
        onCloseTab={() => closeTab(activeTabId)}
        onReload={() => window.location.reload()}
        onGoHome={goHome}
        onMinimize={setMinimized}
        onZoom={toggleMaximize}
      />
      <Dock
        onOpenApp={openAppTab}
        isChromeMaximized={chromeMaximized}
        anyMaximized={chromeMaximized || openAppWindows.some((w) => w.isMaximized)}
        openAppWindows={openAppWindows}
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
        .filter((w) => !w.isMinimized || w.isMinimizing)
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
          content = <InstagramWindow />
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
        } else if (win.appKey === 'doom') {
          content = <DoomWindow isMinimized={win.isMinimized} isMinimizing={win.isMinimizing} />
        } else if (win.appKey === 'dadnme') {
          content = <DadNMeWindow />
        } else if (profileUrl) {
          content = <iframe src={profileUrl} className="chrome-landing__iframe" title={app.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
        } else {
          content = <div className="chrome-landing__empty" style={{ padding: 24 }}><span>Opened: {app.label}</span></div>
        }
        return (
          <AppWindow
            key={win.id}
            id={win.id}
            title={t(`apps.${win.appKey}`)}
            icon={Icon ? <Icon size={16} strokeWidth={1.5} /> : null}
            position={win.position}
            isOpening={win.isOpening}
            onOpeningComplete={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isOpening: false } : w)))}
            size={win.size ?? { width: 880, height: 660 }}
            onPositionChange={(pos) => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, position: pos } : w)))}
            onSizeChange={(size) => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, size } : w)))}
            onClose={() => setOpenAppWindows((prev) => prev.filter((w) => w.id !== win.id))}
            onMinimize={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMinimizing: true } : w)))}
            onMinimizeComplete={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMinimized: true, isMinimizing: false } : w)))}
            onMaximize={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMaximized: !w.isMaximized } : w)))}
            isMaximized={win.isMaximized}
            isMinimized={win.isMinimized}
            isMinimizing={win.isMinimizing}
            isFocused={focusedAppWindowId === win.id}
            onFocus={() => { setFocusedAppWindowId(win.id); setChromeFocused(false) }}
          >
            {content}
          </AppWindow>
        )
      })}
      {(!chromeMinimized || chromeMinimizing) && (
        <ChromeWindow
          isMaximized={chromeMaximized}
          onMaximize={toggleMaximize}
          isMinimizing={chromeMinimizing}
          isOpening={chromeOpening}
          onOpeningComplete={handleChromeOpeningComplete}
          onMinimizeComplete={handleChromeMinimizeComplete}
          onFocus={() => { setChromeFocused(true); setFocusedAppWindowId(null) }}
          isFocused={chromeFocused}
        >
          <ChromeFrame
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
            onNewTab={openNewHomeTab}
            onReorderTabs={reorderTabs}
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
          ) : activeTab.type === 'about' ? (
            <AboutPage />
          ) : activeTab.type === 'project' ? (
            <ProjectPage />
          ) : activeTab.type === 'contact' ? (
            <ContactPage />
          ) : activeTab.type === 'github' ? (
            <SocialProfileWindow profileUrl={getUrlForTab(activeTab)}>
              <GitHubProfileCard profileUrl={getUrlForTab(activeTab)} />
            </SocialProfileWindow>
          ) : activeTab.type === 'linkedin' ? (
            <SocialProfileWindow profileUrl={getUrlForTab(activeTab)}>
              <LinkedInProfileCard profileUrl={getUrlForTab(activeTab)} />
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
