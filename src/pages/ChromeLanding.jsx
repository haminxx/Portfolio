import { useState, useCallback } from 'react'
import ChromeFrame from '../components/ChromeFrame'
import ChromeWindow from '../components/ChromeWindow'
import ChromeHome from '../components/ChromeHome'
import ChromeContextMenu from '../components/ChromeContextMenu'
import Desktop from '../components/Desktop'
import MenuBar from '../components/MenuBar'
import Dock from '../components/Dock'
import { APPS, getDomainForApp } from '../config/apps'
import { SHORTCUTS } from '../config/shortcuts'
import './ChromeLanding.css'

const HOME_TAB = { id: 'home', title: 'Home', type: 'home' }

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
  return shortcut?.url ?? null
}

export default function ChromeLanding() {
  const [tabs, setTabs] = useState([HOME_TAB])
  const [activeTabId, setActiveTabId] = useState('home')
  const [chromeMaximized, setChromeMaximized] = useState(false)
  const [chromeMinimized, setChromeMinimized] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [chromeContextMenu, setChromeContextMenu] = useState(null)

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
            return url ? (
              <iframe src={url} className="chrome-landing__iframe" title={activeTab.title} />
            ) : (
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
        onRestoreChrome={() => setChromeMinimized(false)}
      />
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
