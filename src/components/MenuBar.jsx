import { useState, useMemo, useCallback } from 'react'
import SystemTray from './SystemTray'
import MacOSMenuBar from '@/components/ui/mac-os-menu-bar'
import { useLanguage } from '../context/LanguageContext'
import './MenuBar.css'

export default function MenuBar({
  onTurnOff,
  onRestart,
  onSleep,
  onNewTab,
  onCloseTab,
  onReload,
  onGoHome,
  onBack,
  onForward,
  onMinimize,
  onZoom,
  onFullScreenToggle,
  isFullscreen,
}) {
  const { t } = useLanguage()
  const [showHelp, setShowHelp] = useState(false)

  const appleMenuItems = useMemo(
    () => [
      { label: t('menuBar.portfolioHelp'), action: 'portfolio-help' },
      { type: 'separator' },
      { label: t('menuBar.sleep'), action: 'sleep' },
      { label: t('menuBar.restart'), action: 'restart' },
      { label: t('menuBar.turnOff'), action: 'turn-off' },
    ],
    [t],
  )

  const menus = useMemo(
    () => [
      {
        label: t('menuBar.file'),
        items: [
          { label: t('menuBar.newTab'), action: 'new-tab', shortcut: '⌘T' },
          { label: t('menuBar.newWindow'), action: 'new-window', shortcut: '⌘N' },
          { label: t('menuBar.open'), action: 'open', shortcut: '⌘O' },
          { type: 'separator' },
          { label: t('menuBar.closeTab'), action: 'close-tab', shortcut: '⌘W' },
          { label: t('menuBar.quit'), action: 'quit', shortcut: '⌘Q' },
        ],
      },
      {
        label: t('menuBar.edit'),
        items: [
          { label: t('menuBar.undo'), action: 'undo', shortcut: '⌘Z' },
          { label: t('menuBar.redo'), action: 'redo', shortcut: '⇧⌘Z' },
          { type: 'separator' },
          { label: t('menuBar.cut'), action: 'cut', shortcut: '⌘X' },
          { label: t('menuBar.copy'), action: 'copy', shortcut: '⌘C' },
          { label: t('menuBar.paste'), action: 'paste', shortcut: '⌘V' },
        ],
      },
      {
        label: t('menuBar.view'),
        items: [
          { label: t('menuBar.reload'), action: 'reload', shortcut: '⌘R' },
          { label: t('menuBar.zoomIn'), action: 'zoom-in' },
          { label: t('menuBar.zoomOut'), action: 'zoom-out' },
          { type: 'separator' },
          {
            label: isFullscreen ? t('menuBar.exitFullScreen') : t('menuBar.fullScreen'),
            action: 'fullscreen',
            shortcut: '⌃⌘F',
          },
        ],
      },
      {
        label: t('menuBar.go'),
        items: [
          { label: t('menuBar.back'), action: 'back', shortcut: '⌘[' },
          { label: t('menuBar.forward'), action: 'forward', shortcut: '⌘]' },
          { label: t('menuBar.home'), action: 'home', shortcut: '⌥⌘H' },
        ],
      },
      {
        label: t('menuBar.window'),
        items: [
          { label: t('menuBar.minimize'), action: 'minimize', shortcut: '⌘M' },
          { label: t('menuBar.zoom'), action: 'zoom' },
          { label: t('menuBar.bringAll'), action: 'bring-all' },
        ],
      },
      {
        label: t('menuBar.help'),
        items: [{ label: t('menuBar.portfolioHelp'), action: 'portfolio-help' }],
      },
    ],
    [t, isFullscreen],
  )

  const handleMenuAction = useCallback(
    (action) => {
      switch (action) {
        case 'new-tab':
          onNewTab?.()
          break
        case 'close-tab':
          onCloseTab?.()
          break
        case 'reload':
          onReload?.()
          break
        case 'home':
          onGoHome?.()
          break
        case 'back':
          onBack?.()
          break
        case 'forward':
          onForward?.()
          break
        case 'minimize':
          onMinimize?.()
          break
        case 'zoom':
          onZoom?.()
          break
        case 'fullscreen':
          onFullScreenToggle?.()
          break
        case 'portfolio-help':
          setShowHelp(true)
          break
        case 'sleep':
          onSleep?.()
          break
        case 'restart':
          onRestart?.()
          break
        case 'turn-off':
        case 'quit':
          onTurnOff?.()
          break
        default:
          break
      }
    },
    [
      onNewTab,
      onCloseTab,
      onReload,
      onGoHome,
      onBack,
      onForward,
      onMinimize,
      onZoom,
      onFullScreenToggle,
      onSleep,
      onRestart,
      onTurnOff,
    ],
  )

  return (
    <>
      <header className="menu-bar">
        <MacOSMenuBar
          appName={t('apps.chrome')}
          menus={menus}
          appleMenuItems={appleMenuItems}
          onMenuAction={handleMenuAction}
          className="menu-bar__mac h-full min-w-0 w-full"
          rightSlot={
            <SystemTray onFullScreenToggle={onFullScreenToggle} isFullscreen={isFullscreen ?? false} />
          }
        />
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
            <p className="menu-bar__help-text">{t('menuBar.helpText')}</p>
          </div>
        </div>
      )}
    </>
  )
}
