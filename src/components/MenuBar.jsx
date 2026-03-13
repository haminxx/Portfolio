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
  const leaveTimeoutRef = useRef(null)

  const handleMenuEnter = (menuId) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setOpenMenu(menuId)
  }

  const handleMenuLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => setOpenMenu(null), 150)
  }

  const handleDropdownEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }

  const handleDropdownLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => setOpenMenu(null), 150)
  }

  useEffect(() => () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
  }, [])

  return (
    <header className="menu-bar" ref={barRef}>
      <div className="menu-bar__left">
        <span className="menu-bar__logo">CNL</span>
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
