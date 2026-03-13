import { useState, useMemo } from 'react'
import { Wifi, Battery, Circle, Moon, Search } from 'lucide-react'
import './SystemTray.css'

const WIFI_NETWORKS = [
  { id: 'home', name: 'Home WiFi', connected: true },
  { id: 'office', name: 'Office', connected: false },
  { id: 'guest', name: 'Guest Network', connected: false },
  { id: 'off', name: 'Wi-Fi Off', connected: false },
]

function CalendarDropdown() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const days = useMemo(() => {
    const arr = []
    for (let i = 0; i < firstDay; i++) {
      arr.push({ day: daysInPrevMonth - firstDay + i + 1, other: true })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({ day: i, other: false, today: i === now.getDate() })
    }
    const remaining = 42 - arr.length
    for (let i = 1; i <= remaining; i++) {
      arr.push({ day: i, other: true })
    }
    return arr
  }, [year, month, firstDay, daysInMonth, daysInPrevMonth, now])

  return (
    <div className="system-tray__calendar-flyout">
      <div className="system-tray__calendar-header">
        <div className="system-tray__calendar-time">
          {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div className="system-tray__calendar-date">
          {monthNames[month]} {now.getDate()}, {year}
        </div>
      </div>
      <div className="system-tray__calendar-nav">
        <span className="system-tray__calendar-month">{monthNames[month]} {year}</span>
      </div>
      <div className="system-tray__calendar-dow">
        {dow.map((d) => (
          <span key={d} className="system-tray__calendar-dow-cell">{d}</span>
        ))}
      </div>
      <div className="system-tray__calendar-grid">
        {days.slice(0, 35).map((d, i) => (
          <span
            key={i}
            className={`system-tray__calendar-day ${d.other ? 'system-tray__calendar-day--other' : ''} ${d.today ? 'system-tray__calendar-day--today' : ''}`}
          >
            {d.day}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SystemTray({ nightMode, onNightModeToggle, isRecording, onRecordToggle }) {
  const [showWifi, setShowWifi] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  const now = new Date()
  const clockStr = now.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="system-tray system-tray--mac">
      <button type="button" className="system-tray__icon-btn" aria-label="Battery">
        <Battery size={14} strokeWidth={2} />
      </button>
      <div className="system-tray__dropdown-wrap">
        <button
          type="button"
          className="system-tray__icon-btn"
          aria-label="Wi-Fi"
          aria-expanded={showWifi}
          onClick={() => setShowWifi((o) => !o)}
        >
          <Wifi size={14} strokeWidth={2} />
        </button>
        {showWifi && (
          <>
            <div className="system-tray__backdrop" onClick={() => setShowWifi(false)} aria-hidden />
            <div className="system-tray__wifi-flyout">
              <div className="system-tray__wifi-header">Wi-Fi</div>
              {WIFI_NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`system-tray__wifi-item ${n.connected ? 'system-tray__wifi-item--connected' : ''}`}
                  onClick={() => setShowWifi(false)}
                >
                  {n.connected && <span className="system-tray__wifi-check">✓</span>}
                  {n.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        className={`system-tray__icon-btn system-tray__record-btn ${isRecording ? 'system-tray__record-btn--active' : ''}`}
        aria-label="Record screen"
        onClick={onRecordToggle}
      >
        <Circle size={12} fill={isRecording ? '#ff3b30' : 'currentColor'} stroke="none" />
      </button>
      <button
        type="button"
        className="system-tray__icon-btn"
        aria-label="Night mode"
        onClick={onNightModeToggle}
        title={nightMode ? 'Light mode' : 'Dark mode'}
      >
        <Moon size={14} strokeWidth={2} />
      </button>
      <button type="button" className="system-tray__icon-btn" aria-label="Search">
        <Search size={14} strokeWidth={2} />
      </button>
      <div className="system-tray__dropdown-wrap">
        <button
          type="button"
          className="system-tray__clock"
          aria-label="Date and time"
          aria-expanded={showCalendar}
          onClick={() => setShowCalendar((o) => !o)}
        >
          {clockStr}
        </button>
        {showCalendar && (
          <>
            <div className="system-tray__backdrop" onClick={() => setShowCalendar(false)} aria-hidden />
            <CalendarDropdown />
          </>
        )}
      </div>
    </div>
  )
}
