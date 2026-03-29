import ChromeTabs from './ChromeTabs'
import AddressBar from './AddressBar'
import VoiceAIDropdown from './VoiceAIDropdown'
import { MoreVertical, X, Minus, Maximize2, Square } from 'lucide-react'
import './ChromeFrame.css'

export default function ChromeFrame({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReorderTabs,
  currentDomain,
  onGoHome,
  onBack,
  onForward,
  onRefresh,
  onMinimize,
  onMaximize,
  onWindowClose,
  isMaximized = false,
  canGoBack = true,
  canGoForward = true,
}) {
  return (
    <header className="chrome-frame">
      <div className="chrome-frame__drag" aria-hidden="true" />
      <div className="chrome-frame__row chrome-frame__row--top">
        <div className="chrome-frame__traffic-lights">
          <button
            type="button"
            className="chrome-frame__traffic chrome-frame__traffic--close"
            aria-label="Close"
            onClick={onWindowClose}
          >
            <X className="chrome-frame__traffic-icon" size={9} strokeWidth={3} />
          </button>
          <button type="button" className="chrome-frame__traffic chrome-frame__traffic--minimize" aria-label="Minimize" onClick={onMinimize}>
            <Minus className="chrome-frame__traffic-icon" size={9} strokeWidth={3} />
          </button>
          <button type="button" className="chrome-frame__traffic chrome-frame__traffic--maximize" aria-label={isMaximized ? 'Restore' : 'Maximize'} onClick={onMaximize}>
            {isMaximized ? (
              <Square className="chrome-frame__traffic-icon chrome-frame__traffic-icon--restore" size={8} strokeWidth={2.5} />
            ) : (
              <Maximize2 className="chrome-frame__traffic-icon" size={8} strokeWidth={2.5} />
            )}
          </button>
        </div>
        <div className="chrome-frame__tabs-wrap">
          <ChromeTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={onSelectTab}
            onCloseTab={onCloseTab}
            onNewTab={onNewTab}
            onReorderTabs={onReorderTabs}
          />
        </div>
        <div className="chrome-frame__right">
          <VoiceAIDropdown />
          <div className="chrome-frame__profile" aria-label="Profile" />
          <button type="button" className="chrome-frame__menu-btn" aria-label="Settings">
            <MoreVertical size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="chrome-frame__row chrome-frame__row--toolbar">
        <AddressBar
          domain={currentDomain}
          onGoHome={onGoHome}
          onBack={onBack}
          onForward={onForward}
          onRefresh={onRefresh}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      </div>
    </header>
  )
}
