import { useEffect, useRef } from 'react'
import './ChromeContextMenu.css'

export default function ChromeContextMenu({ x, y, currentUrl, onClose, onOpenInNewTab, onRefresh }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose?.()
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  const handleOpenInNewTab = () => {
    if (currentUrl) window.open(currentUrl, '_blank')
    onClose?.()
  }

  const handleInspect = () => {
    console.log('Inspect (placeholder)')
    onClose?.()
  }

  const handleReload = () => {
    (onRefresh || (() => window.location.reload()))()
    onClose?.()
  }

  const handleViewSource = () => {
    if (currentUrl) window.open(currentUrl, '_blank')
    onClose?.()
  }

  const style = typeof window !== 'undefined'
    ? {
        left: Math.min(x, window.innerWidth - 220),
        top: Math.min(y, window.innerHeight - 200),
      }
    : { left: x, top: y }

  return (
    <div ref={menuRef} className="chrome-context-menu" style={style}>
      <button type="button" className="chrome-context-menu__item" onClick={handleOpenInNewTab}>
        Open link in new tab
      </button>
      <button type="button" className="chrome-context-menu__item" onClick={handleInspect}>
        Inspect
      </button>
      <button type="button" className="chrome-context-menu__item" onClick={handleReload}>
        Reload
      </button>
      <button type="button" className="chrome-context-menu__item" onClick={handleViewSource}>
        View page source
      </button>
    </div>
  )
}
