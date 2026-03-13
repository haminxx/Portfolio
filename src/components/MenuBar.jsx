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

const CNL_ITEMS = [
  { id: 'sleep', label: 'Sleep' },
  { id: 'restart', label: 'Restart…' },
  { id: 'turnOff', label: 'Turn Off…' },
]

export default function MenuBar({ onTurnOff, onRestart, onSleep, nightMode, onNightModeToggle, isRecording, onRecordToggle }) {
  const [openMenu, setOpenMenu] = useState(null)
  const [openCnl, setOpenCnl] = useState(false)
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

  useEffect(() => () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
  }, [])

  return (
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
        <SystemTray
          nightMode={nightMode ?? true}
          onNightModeToggle={onNightModeToggle ?? (() => {})}
          isRecording={isRecording ?? false}
          onRecordToggle={onRecordToggle ?? (() => {})}
        />
      </div>
    </header>
  )
}
