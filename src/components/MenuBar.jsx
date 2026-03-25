import { useState, useRef, useEffect } from 'react'
import SystemTray from './SystemTray'
import { useLanguage } from '../context/LanguageContext'
import './MenuBar.css'

const MENUS = [
  { id: 'file', labelKey: 'menuBar.file', items: [
    { id: 'newTab', labelKey: 'menuBar.newTab' },
    { id: 'newWindow', labelKey: 'menuBar.newWindow' },
    { id: 'open', labelKey: 'menuBar.open' },
    { type: 'divider' },
    { id: 'closeTab', labelKey: 'menuBar.closeTab' },
    { id: 'quit', labelKey: 'menuBar.quit' },
  ]},
  { id: 'edit', labelKey: 'menuBar.edit', items: [
    { id: 'undo', labelKey: 'menuBar.undo' },
    { id: 'redo', labelKey: 'menuBar.redo' },
    { type: 'divider' },
    { id: 'cut', labelKey: 'menuBar.cut' },
    { id: 'copy', labelKey: 'menuBar.copy' },
    { id: 'paste', labelKey: 'menuBar.paste' },
  ]},
  { id: 'view', labelKey: 'menuBar.view', items: [
    { id: 'reload', labelKey: 'menuBar.reload' },
    { id: 'zoomIn', labelKey: 'menuBar.zoomIn' },
    { id: 'zoomOut', labelKey: 'menuBar.zoomOut' },
    { type: 'divider' },
    { id: 'fullScreen', labelKey: 'menuBar.fullScreen' },
  ]},
  { id: 'go', labelKey: 'menuBar.go', items: [
    { id: 'back', labelKey: 'menuBar.back' },
    { id: 'forward', labelKey: 'menuBar.forward' },
    { id: 'home', labelKey: 'menuBar.home' },
  ]},
  { id: 'window', labelKey: 'menuBar.window', items: [
    { id: 'minimize', labelKey: 'menuBar.minimize' },
    { id: 'zoom', labelKey: 'menuBar.zoom' },
    { id: 'bringAll', labelKey: 'menuBar.bringAll' },
  ]},
  { id: 'help', labelKey: 'menuBar.help', items: [
    { id: 'portfolioHelp', labelKey: 'menuBar.portfolioHelp' },
  ]},
]

const CNL_ITEMS = [
  { id: 'sleep', labelKey: 'menuBar.sleep' },
  { id: 'restart', labelKey: 'menuBar.restart' },
  { id: 'turnOff', labelKey: 'menuBar.turnOff' },
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
  onFullScreenToggle,
  isFullscreen,
}) {
  const { t } = useLanguage()
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
      case 'fullScreen': onFullScreenToggle?.(); break
      default: break
    }
  }

  useEffect(() => () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
  }, [])

  return (
    <>
      <header className="menu-bar" ref={barRef}>
        <div className="menu-bar__glass" aria-hidden />
        <div className="menu-bar__content">
        <div className="menu-bar__left">
          <div
            className="menu-bar__cnl-wrap"
            onMouseEnter={handleCnlEnter}
            onMouseLeave={handleCnlLeave}
          >
            <button
              type="button"
              className={`menu-bar__logo menu-bar__logo--btn menu-bar__invert ${openCnl ? 'menu-bar__logo--open' : ''}`}
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
                    {t(item.labelKey)}
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
                className={`menu-bar__menu-trigger menu-bar__invert ${openMenu === menu.id ? 'menu-bar__menu-trigger--open' : ''}`}
                aria-expanded={openMenu === menu.id}
              >
                {t(menu.labelKey)}
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
                        {item.id === 'fullScreen' && isFullscreen ? t('menuBar.exitFullScreen') : t(item.labelKey)}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="menu-bar__right menu-bar__invert">
          <SystemTray
            nightMode={nightMode ?? true}
            onNightModeToggle={onNightModeToggle ?? (() => {})}
            isCapturing={isCapturing ?? false}
            onScreenshot={onScreenshot ?? (() => {})}
            onFullScreenToggle={onFullScreenToggle}
            isFullscreen={isFullscreen ?? false}
          />
        </div>
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
            <h2 className="menu-bar__help-title">{t('menuBar.portfolioHelp')}</h2>
            <p className="menu-bar__help-text">
              {t('menuBar.helpText')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
