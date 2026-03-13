import { useState, useCallback } from 'react'
import ChromeFrame from '../components/ChromeFrame'
import Taskbar from '../components/Taskbar'
import { APPS, getDomainForApp } from '../config/apps'
import './ChromeLanding.css'

const HOME_TAB = { id: 'home', title: 'Home', type: 'home' }

export default function ChromeLanding() {
  const [tabs, setTabs] = useState([HOME_TAB])
  const [activeTabId, setActiveTabId] = useState('home')

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const currentDomain = activeTab.type === 'home' ? 'portfolio.local' : getDomainForApp(activeTab.type)

  const openAppTab = useCallback((appKey) => {
    const app = APPS[appKey]
    if (!app) return
    const id = `${appKey}-${Date.now()}`
    const newTab = { id, title: app.label, type: appKey }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(id)
  }, [])

  const setActiveTab = useCallback((id) => setActiveTabId(id), [])
  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (activeTabId === id && next.length) setActiveTabId(next[0].id)
      else if (activeTabId === id) setActiveTabId('home')
      return next
    })
  }, [activeTabId])

  const goHome = useCallback(() => {
    setActiveTabId('home')
  }, [])

  return (
    <div className="chrome-landing">
      <ChromeFrame
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={closeTab}
        currentDomain={currentDomain}
        onGoHome={goHome}
        activeTabType={activeTab.type}
      />
      <div className="chrome-landing__content">
        {activeTab.type === 'home' ? (
          <div className="chrome-landing__bg" />
        ) : (
          <div className="chrome-landing__empty">
            <span>Opened: {activeTab.title}</span>
          </div>
        )}
      </div>
      <Taskbar onOpenApp={openAppTab} />
    </div>
  )
}
