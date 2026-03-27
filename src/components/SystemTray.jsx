import { useState, useEffect } from 'react'
import { Wifi, Maximize2, Minimize2, Lock, ChevronRight } from 'lucide-react'
import './SystemTray.css'

const WIFI_KNOWN = [
  { id: 'sj', name: 'SJ', secured: true, connected: true },
  { id: 'cox', name: 'CoxWiFi', secured: false, connected: false },
]

export default function SystemTray({ onFullScreenToggle, isFullscreen }) {
  const [showWifi, setShowWifi] = useState(false)
  const [wifiOn, setWifiOn] = useState(true)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const clockStr = now.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="system-tray system-tray--mac">
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
            <div className="system-tray__wifi-panel" role="dialog" aria-label="Wi-Fi">
              <div className="system-tray__wifi-panel-header">
                <span className="system-tray__wifi-panel-title">Wi-Fi</span>
                <button
                  type="button"
                  className={`system-tray__wifi-toggle ${wifiOn ? 'system-tray__wifi-toggle--on' : ''}`}
                  aria-pressed={wifiOn}
                  onClick={() => setWifiOn((v) => !v)}
                  aria-label={wifiOn ? 'Turn Wi-Fi off' : 'Turn Wi-Fi on'}
                >
                  <span className="system-tray__wifi-toggle-knob" />
                </button>
              </div>
              <div className="system-tray__wifi-section-label">Known Networks</div>
              {WIFI_KNOWN.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`system-tray__wifi-network ${n.connected ? 'system-tray__wifi-network--active' : ''}`}
                  onClick={() => setShowWifi(false)}
                >
                  <span className="system-tray__wifi-network-icon">
                    <Wifi size={18} strokeWidth={2} />
                  </span>
                  <span className="system-tray__wifi-network-name">{n.name}</span>
                  {n.secured && <Lock size={14} className="system-tray__wifi-network-lock" strokeWidth={2} aria-hidden />}
                </button>
              ))}
              <div className="system-tray__wifi-divider" />
              <button type="button" className="system-tray__wifi-other" onClick={() => setShowWifi(false)}>
                <span>Other Networks</span>
                <ChevronRight size={16} strokeWidth={2} />
              </button>
              <div className="system-tray__wifi-divider" />
              <button type="button" className="system-tray__wifi-settings" onClick={() => setShowWifi(false)}>
                Wi-Fi Settings…
              </button>
            </div>
          </>
        )}
      </div>
      {onFullScreenToggle && (
        <button
          type="button"
          className="system-tray__icon-btn"
          aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          onClick={onFullScreenToggle}
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {isFullscreen ? <Minimize2 size={14} strokeWidth={2} /> : <Maximize2 size={14} strokeWidth={2} />}
        </button>
      )}
      <span className="system-tray__clock system-tray__clock--plain" aria-live="polite">
        {clockStr}
      </span>
    </div>
  )
}
