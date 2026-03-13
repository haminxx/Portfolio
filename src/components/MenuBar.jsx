import { useState, useRef, useEffect } from 'react'
import SystemTray from './SystemTray'
import './MenuBar.css'

const MENUS = [
  { id: 'file', label: 'File', items: ['New Tab', 'New Window', 'Open…', '—', 'Close Tab', 'Quit'] },
  { id: 'edit', label: 'Edit', items: ['Undo', 'Redo', '—', 'Cut', 'Copy', 'Paste'] },
  { id: 'view', label: 'View', items: ['Reload', 'Zoom In', 'Zoom Out', '—', 'Enter Full Screen'] },
  { id: 'go', label: 'Go', items: ['Back', 'Forward', 'Home'] },
  { id: 'window', label: 'Window', items: ['Minimize', 'Zoom', 'Bring All to Front'] },
  { id: 'help', label: 'Help', items: ['Portfolio Help'] },
]

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState(null)
  const barRef = useRef(null)

  useEffect(() => {
    if (!openMenu) return
    const handleClickOutside = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenu])

  return (
    <header className="menu-bar" ref={barRef}>
      <div className="menu-bar__left">
        <span className="menu-bar__logo">CNL</span>
        {MENUS.map((menu) => (
          <div key={menu.id} className="menu-bar__menu-wrap">
            <button
              type="button"
              className={`menu-bar__menu-trigger ${openMenu === menu.id ? 'menu-bar__menu-trigger--open' : ''}`}
              onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
              aria-expanded={openMenu === menu.id}
            >
              {menu.label}
            </button>
            {openMenu === menu.id && (
              <div className="menu-bar__dropdown">
                {menu.items.map((item, i) =>
                  item === '—' ? (
                    <div key={`${menu.id}-div-${i}`} className="menu-bar__divider" />
                  ) : (
                    <button key={`${menu.id}-${i}`} type="button" className="menu-bar__item" onClick={() => setOpenMenu(null)}>
                      {item}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="menu-bar__right">
        <SystemTray />
      </div>
    </header>
  )
}
