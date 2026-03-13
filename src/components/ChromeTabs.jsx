import { X } from 'lucide-react'
import './ChromeTabs.css'

export default function ChromeTabs({ tabs, activeTabId, onSelectTab, onCloseTab }) {
  return (
    <div className="chrome-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`chrome-tabs__tab ${tab.id === activeTabId ? 'chrome-tabs__tab--active' : ''}`}
          onClick={() => onSelectTab(tab.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectTab(tab.id)
            }
          }}
          role="tab"
          tabIndex={0}
          aria-selected={tab.id === activeTabId}
        >
          <span className="chrome-tabs__title">{tab.title}</span>
          <button
            type="button"
            className="chrome-tabs__close"
            onClick={(e) => {
              e.stopPropagation()
              onCloseTab(tab.id)
            }}
            aria-label={`Close ${tab.title}`}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  )
}
