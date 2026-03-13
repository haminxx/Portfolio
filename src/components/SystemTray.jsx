import { useState, useRef, useEffect } from 'react'
import {
  Wifi,
  Bluetooth,
  Plane,
  Volume2,
  Globe,
  ChevronUp,
} from 'lucide-react'
import './SystemTray.css'

const LANGUAGES = [
  { id: 'en', label: 'English', short: 'Eng' },
  { id: 'ko', label: '한국어', short: '한' },
]

export default function SystemTray() {
  const [trayOpen, setTrayOpen] = useState(false)
  const [clockOpen, setClockOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [language, setLanguage] = useState('en')
  const trayRef = useRef(null)

  const currentLang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0]

  useEffect(() => {
    if (!trayOpen && !clockOpen && !langOpen) return
    const handleClickOutside = (e) => {
      if (trayRef.current && !trayRef.current.contains(e.target)) {
        setTrayOpen(false)
        setClockOpen(false)
        setLangOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [trayOpen, clockOpen, langOpen])

  const now = new Date()
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="system-tray" ref={trayRef}>
      <div className="system-tray__lang-wrap">
        <button
          type="button"
          className="system-tray__lang"
          onClick={() => { setTrayOpen(false); setClockOpen(false); setLangOpen((o) => !o); }}
          aria-expanded={langOpen}
          aria-label="Language"
        >
          <Globe size={14} />
          <span>{currentLang.short}</span>
        </button>
        {langOpen && (
          <div className="system-tray__lang-flyout">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={`system-tray__lang-opt ${language === lang.id ? 'system-tray__lang-opt--active' : ''}`}
                onClick={() => { setLanguage(lang.id); setLangOpen(false); }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="system-tray__icons-wrap">
        <button
          type="button"
          className="system-tray__trigger"
          onClick={() => { setClockOpen(false); setLangOpen(false); setTrayOpen((o) => !o); }}
          aria-expanded={trayOpen}
          aria-label="Quick settings"
        >
          <ChevronUp size={16} />
        </button>
        {trayOpen && (
          <div className="system-tray__flyout">
            <div className="system-tray__icons">
              <button type="button" className="system-tray__icon" aria-label="Wi-Fi">
                <Wifi size={18} />
              </button>
              <button type="button" className="system-tray__icon" aria-label="Bluetooth">
                <Bluetooth size={18} />
              </button>
              <button type="button" className="system-tray__icon" aria-label="Airplane mode">
                <Plane size={18} />
              </button>
              <button type="button" className="system-tray__icon" aria-label="Audio">
                <Volume2 size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        className="system-tray__clock"
        onClick={() => { setTrayOpen(false); setLangOpen(false); setClockOpen((o) => !o); }}
        aria-expanded={clockOpen}
        aria-label="Date and time"
      >
        <span className="system-tray__time">{timeStr}</span>
        <span className="system-tray__date">{dateStr}</span>
      </button>
      {clockOpen && (
        <div className="system-tray__calendar-flyout">
          <div className="system-tray__calendar-header">
            <span className="system-tray__calendar-time">{timeStr}</span>
            <span className="system-tray__calendar-date">{dateStr}</span>
          </div>
          <div className="system-tray__calendar">
            {/* Simple month grid - could use Intl or a small lib for full calendar */}
            <div className="system-tray__calendar-grid">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="system-tray__calendar-dow">{d}</span>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - (new Date(now.getFullYear(), now.getMonth(), 1).getDay()) + 1
                const inMonth = day > 0 && day <= new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                const isToday = inMonth && day === now.getDate()
                return (
                  <span
                    key={i}
                    className={`system-tray__calendar-day ${!inMonth ? 'system-tray__calendar-day--other' : ''} ${isToday ? 'system-tray__calendar-day--today' : ''}`}
                  >
                    {inMonth ? day : ''}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
