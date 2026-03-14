import { useState, useRef, useEffect } from 'react'
import SystemTray from './SystemTray'
import './MenuBar.css'

const MENUS = [
  { id: 'file', label: 'File', items: [
    { id: 'newTab', label: 'New Tab' },
    { id: 'newWindow', label: 'New Window' },
    { id: 'open', label: 'Open…' },
    { type: 'divider' },
    { id: 'closeTab', label: 'Close Tab' },
    { id: 'quit', label: 'Quit' },
  ]},
  { id: 'edit', label: 'Edit', items: [
    { id: 'undo', label: 'Undo' },
    { id: 'redo', label: 'Redo' },
    { type: 'divider' },
    { id: 'cut', label: 'Cut' },
    { id: 'copy', label: 'Copy' },
    { id: 'paste', label: 'Paste' },
  ]},
  { id: 'view', label: 'View', items: [
    { id: 'reload', label: 'Reload' },
    { id: 'zoomIn', label: 'Zoom In' },
    { id: 'zoomOut', label: 'Zoom Out' },
    { type: 'divider' },
    { id: 'fullScreen', label: 'Enter Full Screen' },
  ]},
  { id: 'go', label: 'Go', items: [
    { id: 'back', label: 'Back' },
    { id: 'forward', label: 'Forward' },
    { id: 'home', label: 'Home' },
  ]},
  { id: 'window', label: 'Window', items: [
    { id: 'minimize', label: 'Minimize' },
    { id: 'zoom', label: 'Zoom' },
    { id: 'bringAll', label: 'Bring All to Front' },
  ]},
  { id: 'help', label: 'Help', items: [
    { id: 'portfolioHelp', label: 'Portfolio Help' },
  ]},
]

const CNL_ITEMS = [
  { id: 'sleep', label: 'Sleep' },
  { id: 'restart', label: 'Restart…' },
  { id: 'turnOff', label: 'Turn Off…' },
]

export default function MenuBar({
  onTurnOff,
  onRestart,
  onSleep,
  nightMode,
  onNightModeToggle,
  isCapturing,
  onScreenshot,
  onNewTab,
  onCloseTab,
  onReload,
  onGoHome,
  onMinimize,
  onZoom,
}) {
  const [openMenu, setOpenMenu] = useState(null)
  const [openCnl, setOpenCnl] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const barRef = useRef(null)
  const leaveTimeoutRef = useRef(null)

  const handleMenuEnter = (menuId) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setOpenCnl(false)
    setOpenMenu(menuId)
  }

  const handleMenuLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null)
      setOpenCnl(false)
    }, 150)
  }

  const handleCnlEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setOpenMenu(null)
    setOpenCnl(true)
  }

  const handleCnlLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => setOpenCnl(false), 150)
  }

  const handleCnlItem = (id) => {
    setOpenCnl(false)
    if (id === 'turnOff') onTurnOff?.()
    else if (id === 'restart') onRestart?.()
    else if (id === 'sleep') onSleep?.()
  }

  const handleDropdownEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }

  const handleDropdownLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null)
      setOpenCnl(false)
    }, 150)
  }

  const handleMenuItem = (item) => {
    if (item.type === 'divider') return
    setOpenMenu(null)
    switch (item.id) {
      case 'newTab': onNewTab?.(); break
      case 'closeTab': onCloseTab?.(); break
      case 'reload': onReload?.(); break
      case 'home': onGoHome?.(); break
      case 'minimize': onMinimize?.(); break
      case 'zoom': onZoom?.(); break
      case 'portfolioHelp': setShowHelp(true); break
      default: break
    }
  }

  useEffect(() => () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
  }, [])

  return (
    <>
      <header className="menu-bar" ref={barRef}>
        <div className="menu-bar__left">
          <div
            className="menu-bar__cnl-wrap"
            onMouseEnter={handleCnlEnter}
            onMouseLeave={handleCnlLeave}
          >
            <button
              type="button"
              className={`menu-bar__logo menu-bar__logo--btn ${openCnl ? 'menu-bar__logo--open' : ''}`}
              aria-expanded={openCnl}
            >
              CNL
            </button>
            {openCnl && (
              <div
                className="menu-bar__dropdown menu-bar__dropdown--cnl"
                onMouseEnter={handleDropdownEnter}
                onMouseLeave={handleDropdownLeave}
              >
                {CNL_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="menu-bar__item"
                    onClick={() => handleCnlItem(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {MENUS.map((menu) => (
            <div
              key={menu.id}
              className="menu-bar__menu-wrap"
              onMouseEnter={() => handleMenuEnter(menu.id)}
              onMouseLeave={handleMenuLeave}
            >
              <button
                type="button"
                className={`menu-bar__menu-trigger ${openMenu === menu.id ? 'menu-bar__menu-trigger--open' : ''}`}
                aria-expanded={openMenu === menu.id}
              >
                {menu.label}
              </button>
              {openMenu === menu.id && (
                <div
                  className="menu-bar__dropdown"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  {menu.items.map((item, i) =>
                    item.type === 'divider' ? (
                      <div key={`${menu.id}-div-${i}`} className="menu-bar__divider" />
                    ) : (
                      <button
                        key={`${menu.id}-${item.id}`}
                        type="button"
                        className="menu-bar__item"
                        onClick={() => handleMenuItem(item)}
                      >
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="menu-bar__right">
          <SystemTray
            nightMode={nightMode ?? true}
            onNightModeToggle={onNightModeToggle ?? (() => {})}
            isCapturing={isCapturing ?? false}
            onScreenshot={onScreenshot ?? (() => {})}
          />
        </div>
      </header>
      {showHelp && (
        <div
          className="menu-bar__help-overlay"
          role="dialog"
          aria-label="Portfolio Help"
          onClick={() => setShowHelp(false)}
        >
          <div className="menu-bar__help-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="menu-bar__help-close"
              onClick={() => setShowHelp(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="menu-bar__help-title">Portfolio Help</h2>
            <p className="menu-bar__help-text">
              Welcome to my portfolio! Explore the dock to open apps like Chrome, Netflix, Gallery, and more.
              Double-click desktop icons to launch apps. Use the menu bar for additional options.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
