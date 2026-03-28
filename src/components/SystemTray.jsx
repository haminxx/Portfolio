import { useState, useEffect, useMemo } from 'react'
import { Wifi, Maximize2, Minimize2, Lock, ChevronRight } from 'lucide-react'
import {
  snapshotNetworkInfo,
  subscribeConnectionChange,
  connectionTransportLabel,
  formatDownlinkMbps,
} from '../lib/networkStatus'
import './SystemTray.css'

export default function SystemTray({ onFullScreenToggle, isFullscreen }) {
  const [showWifi, setShowWifi] = useState(false)
  const [wifiOn, setWifiOn] = useState(true)
  const [now, setNow] = useState(() => new Date())
  const [netInfo, setNetInfo] = useState(() => snapshotNetworkInfo())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setNetInfo(snapshotNetworkInfo())
    return subscribeConnectionChange(setNetInfo)
  }, [])

  const clockStr = now.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const connectionSummary = useMemo(() => {
    if (!netInfo.available) {
      return { title: 'Network', detail: 'Link details unavailable in this browser.' }
    }
    const transport = connectionTransportLabel(netInfo)
    const parts = []
    const dl = formatDownlinkMbps(netInfo.downlink)
    if (dl) parts.push(`↓ ${dl} (est.)`)
    if (netInfo.rtt != null && Number.isFinite(netInfo.rtt)) parts.push(`RTT ${Math.round(netInfo.rtt)} ms`)
    if (netInfo.effectiveType) parts.push(netInfo.effectiveType)
    const detail = parts.length ? parts.join(' · ') : 'Live stats from this browser only.'
    return { title: transport, detail }
  }, [netInfo])

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
              <div className="system-tray__wifi-section-label">Current connection</div>
              <div
                className="system-tray__wifi-network system-tray__wifi-network--active system-tray__wifi-network--readonly"
                role="status"
              >
                <span className="system-tray__wifi-network-icon">
                  <Wifi size={18} strokeWidth={2} />
                </span>
                <span className="system-tray__wifi-network-body">
                  <span className="system-tray__wifi-network-name">{connectionSummary.title}</span>
                  <span className="system-tray__wifi-network-detail">{connectionSummary.detail}</span>
                </span>
                {netInfo.available && netInfo.type === 'wifi' && (
                  <Lock size={14} className="system-tray__wifi-network-lock" strokeWidth={2} aria-hidden />
                )}
              </div>
              <p className="system-tray__wifi-privacy">
                Browsers cannot read your Wi‑Fi network name (SSID) or scan nearby networks. Values above come from the
                Network Information API when supported.
              </p>
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
