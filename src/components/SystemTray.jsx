import { useState } from 'react'
import { Wifi, Battery, ChevronUp } from 'lucide-react'
import './SystemTray.css'

export default function SystemTray() {
  const [showControlCenter, setShowControlCenter] = useState(false)

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
      <button type="button" className="system-tray__icon-btn" aria-label="Wi-Fi">
        <Wifi size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        className="system-tray__control-center"
        onClick={() => setShowControlCenter((o) => !o)}
        aria-expanded={showControlCenter}
        aria-label="Control Center"
      >
        <ChevronUp size={12} strokeWidth={2.5} />
      </button>
      <button type="button" className="system-tray__clock" aria-label="Date and time">
        {clockStr}
      </button>
    </div>
  )
}
