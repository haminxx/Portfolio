import ChromeTabs from './ChromeTabs'
import AddressBar from './AddressBar'
import VoiceAIDropdown from './VoiceAIDropdown'
import {
  Minus,
  Square,
  X,
  User,
  MoreVertical,
} from 'lucide-react'
import './ChromeFrame.css'

export default function ChromeFrame({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  currentDomain,
  onGoHome,
  activeTabType,
}) {
  return (
    <header className="chrome-frame">
      <div className="chrome-frame__drag" />
      <div className="chrome-frame__left">
        <VoiceAIDropdown />
        <div className="chrome-frame__window-btns">
          <button type="button" className="chrome-frame__win-btn" aria-label="Minimize">
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <button type="button" className="chrome-frame__win-btn" aria-label="Maximize">
            <Square size={12} strokeWidth={2.5} />
          </button>
          <button type="button" className="chrome-frame__win-btn chrome-frame__win-btn--close" aria-label="Close">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="chrome-frame__center">
        <ChromeTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
        />
        <AddressBar
          domain={currentDomain}
          onGoHome={onGoHome}
        />
      </div>
      <div className="chrome-frame__right">
        <div className="chrome-frame__profile" aria-label="Profile">
          {/* Pathway: set src or background-image when you have a custom profile image */}
        </div>
        <button type="button" className="chrome-frame__menu-btn" aria-label="Settings">
          <MoreVertical size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}
