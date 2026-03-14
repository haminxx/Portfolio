import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import './ChromeTabs.css'

export default function ChromeTabs({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab, onReorderTabs }) {
  const [closingTabId, setClosingTabId] = useState(null)
  const [addedTabIds, setAddedTabIds] = useState(new Set())
  const [draggedTabId, setDraggedTabId] = useState(null)
  const [dragOverTabId, setDragOverTabId] = useState(null)
  const lastTabIdsRef = useRef(new Set())

  useEffect(() => {
    const currentIds = new Set(tabs.map((t) => t.id))
    const newIds = [...currentIds].filter((id) => !lastTabIdsRef.current.has(id))
    lastTabIdsRef.current = currentIds
    if (newIds.length) {
      setAddedTabIds((prev) => new Set([...prev, ...newIds]))
      const t = setTimeout(() => setAddedTabIds(new Set()), 350)
      return () => clearTimeout(t)
    }
  }, [tabs])

  const closedForTabRef = useRef(null)
  const lastCloseTimeRef = useRef(0)
  const handleCloseTab = useCallback(
    (e, tabId) => {
      e.stopPropagation()
      e.preventDefault()
      closedForTabRef.current = null
      lastCloseTimeRef.current = Date.now()
      setClosingTabId(tabId)
    },
    []
  )

  const handleNewTabClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (Date.now() - lastCloseTimeRef.current < 300) return
      onNewTab?.()
    },
    [onNewTab]
  )

  const handleCloseAnimationEnd = useCallback(
    (e, tabId) => {
      if (e.propertyName !== 'opacity' && e.propertyName !== 'max-width') return
      if (closingTabId === tabId && closedForTabRef.current !== tabId) {
        closedForTabRef.current = tabId
        onCloseTab?.(tabId)
        setClosingTabId(null)
      }
    },
    [closingTabId, onCloseTab]
  )

  const handleDragStart = useCallback((e, tabId) => {
    setDraggedTabId(tabId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tabId)
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0)
  }, [])

  const handleDragOver = useCallback((e, tabId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedTabId && draggedTabId !== tabId) setDragOverTabId(tabId)
  }, [draggedTabId])

  const handleDragLeave = useCallback(() => {
    setDragOverTabId(null)
  }, [])

  const handleDrop = useCallback(
    (e, targetTabId) => {
      e.preventDefault()
      setDragOverTabId(null)
      setDraggedTabId(null)
      const fromId = e.dataTransfer.getData('text/plain')
      if (!fromId || fromId === targetTabId || !onReorderTabs) return
      const fromIdx = tabs.findIndex((t) => t.id === fromId)
      const toIdx = tabs.findIndex((t) => t.id === targetTabId)
      if (fromIdx < 0 || toIdx < 0) return
      const newTabs = [...tabs]
      const [removed] = newTabs.splice(fromIdx, 1)
      newTabs.splice(toIdx, 0, removed)
      onReorderTabs(newTabs)
    },
    [tabs, onReorderTabs]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedTabId(null)
    setDragOverTabId(null)
  }, [])

  return (
    <div className="chrome-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          draggable
          className={`chrome-tabs__tab ${tab.id === activeTabId ? 'chrome-tabs__tab--active' : ''} ${addedTabIds.has(tab.id) ? 'chrome-tabs__tab--added' : ''} ${closingTabId === tab.id ? 'chrome-tabs__tab--closing' : ''} ${draggedTabId === tab.id ? 'chrome-tabs__tab--dragging' : ''} ${dragOverTabId === tab.id ? 'chrome-tabs__tab--drag-over' : ''}`}
          onClick={() => onSelectTab(tab.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectTab(tab.id)
            }
          }}
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={(e) => handleDragOver(e, tab.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, tab.id)}
          onDragEnd={handleDragEnd}
          onAnimationEnd={(e) => handleCloseAnimationEnd(e, tab.id)}
          role="tab"
          tabIndex={0}
          aria-selected={tab.id === activeTabId}
        >
          <span className="chrome-tabs__title">{tab.title}</span>
          <button
            type="button"
            className="chrome-tabs__close"
            onClick={(e) => handleCloseTab(e, tab.id)}
            aria-label={`Close ${tab.title}`}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="chrome-tabs__new chrome-tabs__new--animate"
        onClick={handleNewTabClick}
        aria-label="New tab"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}
