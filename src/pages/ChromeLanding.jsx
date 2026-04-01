import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import ChromeFrame from '../components/ChromeFrame'
import ChromeWindow from '../components/ChromeWindow'
import ChromeHome from '../components/ChromeHome'
import ChromeContextMenu from '../components/ChromeContextMenu'
import Desktop from '../components/Desktop'
import DesktopDocumentsFolderModal from '../components/DesktopDocumentsFolderModal'
import {
  LazyInstagramWindow,
  LazyAboutPage,
  LazyProjectPage,
  LazyContactPage,
  LazySocialProfileWindow,
  LazyMapWindow,
  LazyDoomWindow,
  LazyDadNMeWindow,
  LazyNetflixWindow,
  LazyYouTubeMusicWindow,
  LazySettingsWindow,
  LazyAppStoreWindow,
  LazyGalleryWindow,
  LazyFaceTimeWindow,
  LazyFinderWindow,
  LazyNotesWindow,
  LazyNotionCalendarWindow,
  LazyTetrisWindow,
  LazyGitHubProfileCard,
  LazyLinkedInProfileCard,
} from './chromeLazyComponents'
import MenuBar from '../components/MenuBar'
import WelcomeOverlay from '../components/WelcomeOverlay'
import Dock from '../components/Dock'
import AppWindow from '../components/AppWindow'
import { APPS, getDomainForApp } from '../config/apps'
import { SHORTCUTS } from '../config/shortcuts'
import { useLanguage } from '../context/LanguageContext'
import { MusicPlayerProvider } from '../context/MusicPlayerContext'
import { DesktopBackgroundProvider } from '../context/DesktopBackgroundContext'
import {
  Globe,
  Image,
  Film,
  Images,
  Video,
  ShoppingBag,
  Settings,
  Map as MapIcon,
  Folder,
  StickyNote,
  LayoutGrid,
} from 'lucide-react'
import './ChromeLanding.css'

const APP_ICONS = {
  finder: Folder,
  chrome: Globe,
  instagram: Image,
  netflix: Film,
  photos: Images,
  facetime: Video,
  appStore: ShoppingBag,
  settings: Settings,
  map: MapIcon,
  youtubeMusic: Film,
  notes: StickyNote,
  tetris: LayoutGrid,
}

const HOME_TAB = { id: 'home', title: 'Home', type: 'home' }
const DESKTOP_ITEMS_KEY = 'desktop-items'
const DOCK_ORDER_KEY = 'dock-order'
/** Legacy seeded desktop folder — removed from layout on load. */
const REMOVED_SEED_FOLDER_ID = 'seed-desktop-glass-folder'

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

function loadDockOrder() {
  try {
    const raw = localStorage.getItem(DOCK_ORDER_KEY)
    if (!raw) return Object.keys(APPS)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return Object.keys(APPS)
    const valid = parsed.filter((k) => k in APPS)
    const missing = Object.keys(APPS).filter((k) => !valid.includes(k))
    return [...valid, ...missing]
  } catch {
    return Object.keys(APPS)
  }
}

function saveDockOrder(order) {
  try {
    localStorage.setItem(DOCK_ORDER_KEY, JSON.stringify(order))
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
    if (tab.type === 'about') return 'portfolio.local/about'
    if (tab.type === 'project') return 'portfolio.local/project'
    if (tab.type === 'contact') return 'portfolio.local/contact'
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

function readWelcomeCompleted() {
  try {
    return localStorage.getItem('portfolio_welcome_done_v1') === '1'
  } catch {
    return true
  }
}

export default function ChromeLanding({ onReboot }) {
  const [welcomeDone, setWelcomeDone] = useState(readWelcomeCompleted)
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
    const withoutFolder = loaded.filter((i) => i.id !== REMOVED_SEED_FOLDER_ID)
    const removedFolder = withoutFolder.length !== loaded.length
    let next = [...withoutFolder]
    const hasDoom = next.some((i) => i.type === 'shortcut' && i.appKey === 'doom')
    const hasDadnme = next.some((i) => i.type === 'shortcut' && i.appKey === 'dadnme')
    const hasTetris = next.some((i) => i.type === 'shortcut' && i.appKey === 'tetris')
    if (!hasDoom) {
      next = [...next, { id: 'doom-shortcut', type: 'shortcut', name: 'DOOM', appKey: 'doom', parentId: null, x: 24, y: 572 }]
    }
    if (!hasDadnme) {
      next = [...next, { id: 'dadnme-shortcut', type: 'shortcut', name: "Dad 'n Me", appKey: 'dadnme', parentId: null, x: 120, y: 572 }]
    }
    if (!hasTetris) {
      next = [...next, { id: 'tetris-shortcut', type: 'shortcut', name: 'Tetris', appKey: 'tetris', parentId: null, x: 216, y: 572 }]
    }
    if (!hasDoom || !hasDadnme || !hasTetris || removedFolder) {
      saveDesktopItems(next)
    }
    return next
  })
  const [openFolderId, setOpenFolderId] = useState(null)
  const [startRenameId, setStartRenameId] = useState(null)
  const [openAppWindows, setOpenAppWindows] = useState([])
  const [focusedAppWindowId, setFocusedAppWindowId] = useState(null)
  const [chromeFocused, setChromeFocused] = useState(false)
  const [chromeRefreshing, setChromeRefreshing] = useState(false)
  const [showShutdown, setShowShutdown] = useState(false)
  const [shutdownAction, setShutdownAction] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dockOrder, setDockOrder] = useState(loadDockOrder)
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

  const chromeNavStacksRef = useRef(
    new Map([['home', { entries: [{ type: 'home', title: 'Home' }], index: 0 }]]),
  )
  const chromeNavReplayRef = useRef(false)

  const pushChromeNav = useCallback((tabId, type, title) => {
    if (chromeNavReplayRef.current) return
    let state = chromeNavStacksRef.current.get(tabId)
    if (!state) {
      chromeNavStacksRef.current.set(tabId, { entries: [{ type, title }], index: 0 })
      return
    }
    const { entries, index } = state
    const last = entries[index]
    if (last && last.type === type && last.title === title) return
    const nextEntries = entries.slice(0, index + 1)
    nextEntries.push({ type, title })
    state.entries = nextEntries
    state.index = nextEntries.length - 1
  }, [])

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const currentDomain = getDomainForTab(activeTab)

  useEffect(() => {
    const tab = tabs.find((t) => t.id === activeTabId)
    if (!tab) return
    if (!chromeNavStacksRef.current.has(activeTabId)) {
      chromeNavStacksRef.current.set(activeTabId, {
        entries: [{ type: tab.type, title: tab.title }],
        index: 0,
      })
    }
  }, [activeTabId, tabs])

  const chromeNavState = chromeNavStacksRef.current.get(activeTabId)
  const canGoBack = chromeNavState ? chromeNavState.index > 0 : false
  const canGoForward = chromeNavState ? chromeNavState.index < chromeNavState.entries.length - 1 : false

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
    setChromeFocused(false)
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
      let winWidth = Math.min(880, Math.max(400, vw * 0.85))
      let winHeight = Math.min(660, Math.max(400, vh * 0.8))
      if (appKey === 'tetris') {
        winWidth = Math.min(460, Math.max(380, vw * 0.42))
        winHeight = Math.min(560, Math.max(400, vh * 0.72))
      }
      if (appKey === 'notes') {
        winWidth = Math.min(760, Math.max(520, vw * 0.72))
        winHeight = Math.min(620, Math.max(400, vh * 0.78))
      }
      if (appKey === 'notionCalendar') {
        winWidth = Math.min(960, Math.max(560, vw * 0.88))
        winHeight = Math.min(640, Math.max(420, vh * 0.82))
      }
      const x = Math.max(0, (vw - winWidth) / 2 + prev.length * 24)
      const y = Math.max(32, (vh - winHeight) / 2 + prev.length * 24 - 36)
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

  const navigateToShortcut = useCallback(
    (shortcutType) => {
      const shortcut = SHORTCUTS.find((s) => s.type === shortcutType)
      if (!shortcut) return
      pushChromeNav(activeTabId, shortcutType, shortcut.label)
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, type: shortcutType, title: shortcut.label } : t
        )
      )
      setChromeMinimized(false)
    },
    [activeTabId, pushChromeNav]
  )

  const openShortcutTab = useCallback((shortcutType) => {
    const shortcut = SHORTCUTS.find((s) => s.type === shortcutType)
    if (!shortcut) return
    const id = `${shortcutType}-${Date.now()}`
    const newTab = { id, title: shortcut.label, type: shortcutType }
    chromeNavStacksRef.current.set(id, {
      entries: [{ type: shortcutType, title: shortcut.label }],
      index: 0,
    })
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(id)
    setChromeMinimized(false)
  }, [])

  const setActiveTab = useCallback((id) => setActiveTabId(id), [])
  const reorderTabs = useCallback((newTabs) => {
    setTabs(newTabs)
  }, [])
  const closeTab = useCallback((id) => {
    chromeNavStacksRef.current.delete(id)
    const willBeEmpty = tabs.filter((t) => t.id !== id).length === 0
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (!next.length) {
        chromeNavStacksRef.current.clear()
        chromeNavStacksRef.current.set('home', {
          entries: [{ type: 'home', title: 'Home' }],
          index: 0,
        })
      }
      if (activeTabId === id && next.length) setActiveTabId(next[0].id)
      else if (activeTabId === id && !next.length) setActiveTabId('home')
      return next.length ? next : [HOME_TAB]
    })
    if (willBeEmpty) setChromeMinimized(true)
  }, [activeTabId, tabs])

  const goHome = useCallback(() => {
    const id = activeTabId
    const tab = tabs.find((t) => t.id === id)
    if (!tab) return
    pushChromeNav(id, 'home', 'Home')
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, type: 'home', title: 'Home' } : t)),
    )
  }, [activeTabId, tabs, pushChromeNav])

  const handleBack = useCallback(() => {
    const id = activeTabId
    const state = chromeNavStacksRef.current.get(id)
    if (!state || state.index <= 0) return
    state.index -= 1
    const { type, title } = state.entries[state.index]
    chromeNavReplayRef.current = true
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, type, title } : t)))
    queueMicrotask(() => {
      chromeNavReplayRef.current = false
    })
  }, [activeTabId])

  const handleForward = useCallback(() => {
    const id = activeTabId
    const state = chromeNavStacksRef.current.get(id)
    if (!state || state.index >= state.entries.length - 1) return
    state.index += 1
    const { type, title } = state.entries[state.index]
    chromeNavReplayRef.current = true
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, type, title } : t)))
    queueMicrotask(() => {
      chromeNavReplayRef.current = false
    })
  }, [activeTabId])
  const iframeRefreshKeyRef = useRef(0)
  const handleRefresh = useCallback(() => {
    setChromeRefreshing(true)
    setTimeout(() => {
      iframeRefreshKeyRef.current += 1
      setChromeRefreshing(false)
    }, 400)
  }, [])

  const openNewHomeTab = useCallback(() => {
    const homeTab = { id: `home-${Date.now()}`, title: 'Home', type: 'home' }
    chromeNavStacksRef.current.set(homeTab.id, {
      entries: [{ type: 'home', title: 'Home' }],
      index: 0,
    })
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
    const handler = () =>
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    handler()
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  /**
   * Fullscreen may only run inside a user gesture (otherwise Chrome logs a warning and rejects).
   * Enter on first trusted pointerdown; no load/timeout calls.
   */
  useEffect(() => {
    const el = document.documentElement
    const tryFullscreen = (e) => {
      if (document.fullscreenElement || document.webkitFullscreenElement) return
      if (e && !e.isTrusted) return
      try {
        const p = el.requestFullscreen?.()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      } catch {
        // ignore
      }
      try {
        if (typeof el.webkitRequestFullscreen === 'function') el.webkitRequestFullscreen()
      } catch {
        // ignore
      }
    }
    const onFirstPointer = (e) => {
      tryFullscreen(e)
      window.removeEventListener('pointerdown', onFirstPointer)
    }
    window.addEventListener('pointerdown', onFirstPointer, { capture: true, passive: true })
    return () => window.removeEventListener('pointerdown', onFirstPointer, { capture: true })
  }, [])

  const handleFullScreenToggle = useCallback(() => {
    const doc = document
    const el = doc.documentElement
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      doc.exitFullscreen?.()
      doc.webkitExitFullscreen?.()
    } else {
      el.requestFullscreen?.()
      el.webkitRequestFullscreen?.()
    }
  }, [])

  const handleTurnOff = useCallback(() => {
    setShutdownAction('turnOff')
    setShowShutdown(true)
  }, [])

  const handleRestart = useCallback(() => {
    setShutdownAction('restart')
    setShowShutdown(true)
  }, [])

  useEffect(() => {
    if (!showShutdown || !shutdownAction) return
    const t = setTimeout(() => {
      if (shutdownAction === 'restart') {
        onReboot?.()
      } else if (shutdownAction === 'turnOff') {
        window.close()
        setTimeout(() => {
          window.location.href = 'about:blank'
        }, 100)
      }
      setShowShutdown(false)
      setShutdownAction(null)
    }, 2000)
    return () => clearTimeout(t)
  }, [showShutdown, shutdownAction, onReboot])

  return (
    <MusicPlayerProvider>
    <DesktopBackgroundProvider>
    <div className="chrome-landing">
      {!welcomeDone && <WelcomeOverlay onComplete={() => setWelcomeDone(true)} />}
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
        onTurnOff={handleTurnOff}
        onRestart={handleRestart}
        onSleep={() => setShowShutdown(true)}
        onNewTab={openNewHomeTab}
        onCloseTab={() => closeTab(activeTabId)}
        onReload={handleRefresh}
        onGoHome={goHome}
        onBack={handleBack}
        onForward={handleForward}
        onMinimize={setMinimized}
        onZoom={toggleMaximize}
        onFullScreenToggle={handleFullScreenToggle}
        isFullscreen={isFullscreen}
      />
      <Dock
        onOpenApp={openAppTab}
        dockOrder={dockOrder}
        onDockReorder={(order) => {
          setDockOrder(order)
          saveDockOrder(order)
        }}
        isChromeMaximized={chromeMaximized}
        anyMaximized={(chromeMaximized && !chromeMinimized) || openAppWindows.some((w) => w.isMaximized && !w.isMinimized)}
        openAppWindows={openAppWindows}
      />
      {openFolderId && (
        <DesktopDocumentsFolderModal
          folderId={openFolderId}
          desktopItems={desktopItems}
          onClose={() => setOpenFolderId(null)}
          onOpenFolder={handleOpenFolder}
          onOpenApp={openAppTab}
        />
      )}
      {[
        ...openAppWindows
          .filter((w) => !w.isMinimized || w.isMinimizing)
          .map((w) => ({ ...w, _type: 'app', _isFocused: focusedAppWindowId === w.id })),
        ...((!chromeMinimized || chromeMinimizing)
          ? [{ id: 'chrome', _type: 'chrome', _isFocused: chromeFocused }]
          : []),
      ]
        .sort((a, b) => (a._isFocused ? 1 : 0) - (b._isFocused ? 1 : 0))
        .map((win) => {
        if (win._type === 'chrome') {
          return (
            <ChromeWindow
              key="chrome"
              isMaximized={chromeMaximized}
              onMaximize={toggleMaximize}
              isMinimizing={chromeMinimizing}
              onOpeningComplete={handleChromeOpeningComplete}
              isOpening={chromeOpening}
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
                onBack={handleBack}
                onForward={handleForward}
                onRefresh={handleRefresh}
                isMaximized={chromeMaximized}
                onMaximize={toggleMaximize}
                onMinimize={setMinimized}
                onWindowClose={setMinimized}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
              />
              <div
                className="chrome-landing__content"
                onContextMenu={(e) => {
                  e.preventDefault()
                  const url = getUrlForTab(activeTab)
                  setChromeContextMenu({ x: e.clientX, y: e.clientY, url })
                }}
              >
                {chromeRefreshing && (
                  <div className="chrome-landing__refresh-overlay" aria-hidden="true">
                    <div className="chrome-landing__refresh-spinner" />
                  </div>
                )}
                {activeTab.type === 'home' ? (
                  <ChromeHome onNavigateShortcut={navigateToShortcut} onShortcutInNewTab={openShortcutTab} />
                ) : activeTab.type === 'about' ? (
                  <Suspense fallback={null}>
                    <LazyAboutPage />
                  </Suspense>
                ) : activeTab.type === 'project' ? (
                  <Suspense fallback={null}>
                    <LazyProjectPage />
                  </Suspense>
                ) : activeTab.type === 'contact' ? (
                  <Suspense fallback={null}>
                    <LazyContactPage />
                  </Suspense>
                ) : activeTab.type === 'github' ? (
                  <Suspense fallback={null}>
                    <LazySocialProfileWindow profileUrl={getUrlForTab(activeTab)} cardOnly>
                      <LazyGitHubProfileCard profileUrl={getUrlForTab(activeTab)} />
                    </LazySocialProfileWindow>
                  </Suspense>
                ) : activeTab.type === 'linkedin' ? (
                  <Suspense fallback={null}>
                    <LazySocialProfileWindow profileUrl={getUrlForTab(activeTab)} cardOnly>
                      <LazyLinkedInProfileCard profileUrl={getUrlForTab(activeTab)} />
                    </LazySocialProfileWindow>
                  </Suspense>
                ) : (() => {
                  const url = getUrlForTab(activeTab)
                  if (url) {
                    return (
                      <iframe key={iframeRefreshKeyRef.current} src={url} className="chrome-landing__iframe" title={activeTab.title} />
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
          )
        }
        const app = APPS[win.appKey]
        if (!app) return null
        const Icon = APP_ICONS[win.appKey]
        const profileUrl = app.url ?? SHORTCUTS.find((s) => s.type === win.appKey)?.url
        let content
        if (win.appKey === 'map') {
          content = <LazyMapWindow />
        } else if (win.appKey === 'netflix') {
          content = <LazyNetflixWindow />
        } else if (win.appKey === 'youtubeMusic') {
          content = <LazyYouTubeMusicWindow />
        } else if (win.appKey === 'instagram') {
          content = <LazyInstagramWindow />
        } else if (win.appKey === 'github') {
          content = (
            <LazySocialProfileWindow profileUrl={profileUrl}>
              <LazyGitHubProfileCard profileUrl={profileUrl} />
            </LazySocialProfileWindow>
          )
        } else if (win.appKey === 'linkedin') {
          content = (
            <LazySocialProfileWindow profileUrl={profileUrl}>
              <LazyLinkedInProfileCard profileUrl={profileUrl} />
            </LazySocialProfileWindow>
          )
        } else if (win.appKey === 'settings') {
          content = <LazySettingsWindow />
        } else if (win.appKey === 'appStore') {
          content = <LazyAppStoreWindow />
        } else if (win.appKey === 'photos') {
          content = <LazyGalleryWindow />
        } else if (win.appKey === 'finder') {
          content = <LazyFinderWindow onOpenApp={openAppTab} />
        } else if (win.appKey === 'facetime') {
          content = <LazyFaceTimeWindow />
        } else if (win.appKey === 'doom') {
          content = <LazyDoomWindow isMinimized={win.isMinimized} isMinimizing={win.isMinimizing} />
        } else if (win.appKey === 'dadnme') {
          content = <LazyDadNMeWindow />
        } else if (win.appKey === 'notes') {
          content = <LazyNotesWindow />
        } else if (win.appKey === 'notionCalendar') {
          content = <LazyNotionCalendarWindow />
        } else if (win.appKey === 'tetris') {
          content = <LazyTetrisWindow keyboardActive={focusedAppWindowId === win.id && !win.isMinimized} />
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
            icon={
              win.appKey === 'notionCalendar' ? (
                <img src="/dock-icons/notion-calendar.png" alt="" className="app-window__icon-img" />
              ) : Icon ? (
                <Icon size={16} strokeWidth={1.5} />
              ) : null
            }
            position={win.position}
            isOpening={win.isOpening}
            onOpeningComplete={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isOpening: false } : w)))}
            size={win.size ?? { width: 880, height: 660 }}
            onPositionChange={(pos) => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, position: { ...pos, y: Math.max(32, pos.y) } } : w)))}
            onSizeChange={(size) => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, size } : w)))}
            onClosingStart={() => {
              const nextApp = openAppWindows.find((w) => w.id !== win.id && !w.isMinimized)
              setFocusedAppWindowId(nextApp?.id ?? null)
              setChromeFocused(!nextApp)
            }}
            onClose={() => setOpenAppWindows((prev) => prev.filter((w) => w.id !== win.id))}
            onMinimizeStart={() => {
              const nextApp = openAppWindows.find((w) => w.id !== win.id && !w.isMinimized)
              setFocusedAppWindowId(nextApp?.id ?? null)
              setChromeFocused(!nextApp)
            }}
            onMinimize={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMinimizing: true } : w)))}
            onMinimizeComplete={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMinimized: true, isMinimizing: false } : w)))}
            onMaximize={() => setOpenAppWindows((prev) => prev.map((w) => (w.id === win.id ? { ...w, isMaximized: !w.isMaximized } : w)))}
            isMaximized={win.isMaximized}
            isMinimized={win.isMinimized}
            isMinimizing={win.isMinimizing}
            isFocused={focusedAppWindowId === win.id}
            onFocus={() => { setFocusedAppWindowId(win.id); setChromeFocused(false) }}
          >
            <Suspense fallback={null}>{content}</Suspense>
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
          onRefresh={handleRefresh}
        />
      )}
    </div>
    </DesktopBackgroundProvider>
    </MusicPlayerProvider>
  )
}
