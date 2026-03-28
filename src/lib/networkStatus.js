/**
 * Network Information API — browsers do not expose Wi‑Fi SSID or scan results (privacy).
 * We surface link-quality hints when `navigator.connection` is available.
 */

export function getNetworkConnection() {
  if (typeof navigator === 'undefined') return null
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null
}

export function snapshotNetworkInfo() {
  const c = getNetworkConnection()
  if (!c) {
    return { available: false }
  }
  return {
    available: true,
    type: c.type ?? 'unknown',
    effectiveType: c.effectiveType,
    downlink: typeof c.downlink === 'number' ? c.downlink : null,
    rtt: typeof c.rtt === 'number' ? c.rtt : null,
    saveData: !!c.saveData,
  }
}

/** Human-readable transport label when `type` is set; otherwise falls back to effectiveType. */
export function connectionTransportLabel(info) {
  if (!info?.available) return 'Network'
  const t = String(info.type || '').toLowerCase()
  if (t === 'wifi') return 'Wi‑Fi'
  if (t === 'ethernet') return 'Ethernet'
  if (t === 'cellular') return 'Cellular'
  if (t === 'none') return 'Offline'
  if (t === 'bluetooth') return 'Bluetooth'
  if (info.effectiveType) return String(info.effectiveType).toUpperCase()
  return 'This device'
}

export function formatDownlinkMbps(downlink) {
  if (downlink == null || !Number.isFinite(downlink)) return null
  if (downlink >= 10) return `${Math.round(downlink)} Mbps`
  return `${downlink.toFixed(1)} Mbps`
}

export function subscribeConnectionChange(onChange) {
  const c = getNetworkConnection()
  if (!c || typeof c.addEventListener !== 'function') return () => {}
  const handler = () => onChange(snapshotNetworkInfo())
  c.addEventListener('change', handler)
  return () => c.removeEventListener('change', handler)
}
