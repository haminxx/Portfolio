import ChromeTabs from './ChromeTabs'
import AddressBar from './AddressBar'
import VoiceAIDropdown from './VoiceAIDropdown'
import { MoreVertical } from 'lucide-react'
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
  activeTabType,
  onMinimize,
  onMaximize,
  onWindowClose,
}) {
  return (
    <header className="chrome-frame">
      <div className="chrome-frame__traffic-lights">
        <button type="button" className="chrome-frame__traffic chrome-frame__traffic--close" aria-label="Close" onClick={onWindowClose} />
        <button type="button" className="chrome-frame__traffic chrome-frame__traffic--minimize" aria-label="Minimize" onClick={onMinimize} />
        <button type="button" className="chrome-frame__traffic chrome-frame__traffic--maximize" aria-label="Maximize" onClick={onMaximize} />
      </div>
      <div className="chrome-frame__drag" />
      <div className="chrome-frame__center">
        <ChromeTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onNewTab={onNewTab}
          onReorderTabs={onReorderTabs}
        />
        <AddressBar
          domain={currentDomain}
          onGoHome={onGoHome}
          onBack={onBack}
          onForward={onForward}
          onRefresh={onRefresh}
        />
      </div>
      <div className="chrome-frame__right">
        <VoiceAIDropdown />
        <div className="chrome-frame__profile" aria-label="Profile" />
        <button type="button" className="chrome-frame__menu-btn" aria-label="Settings">
          <MoreVertical size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}
