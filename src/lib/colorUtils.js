/** Shared hex color helpers for widgets and UI. */

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex ?? '').trim())
  if (!m) return { r: 138, g: 136, b: 140 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const lin = (v) => {
    const n = v / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  const R = lin(r)
  const G = lin(g)
  const B = lin(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function hexRgbInvert(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex ?? '').trim())
  if (!m) return '#ffffff'
  const x = (i) => (255 - parseInt(m[i], 16)).toString(16).padStart(2, '0')
  return `#${x(1)}${x(2)}${x(3)}`
}

/** True when mesh accent is effectively black (use solid black surfaces). */
export function isNearBlackAccent(hex) {
  return relativeLuminance(hex) < 0.06
}

/** Readable text on a solid background hex. */
export function foregroundOnSolid(bgHex) {
  return relativeLuminance(bgHex) > 0.45 ? '#0a0a0c' : '#f5f5f7'
}

/** Weather/year surface: black when accent is black, else inverted accent. */
export function widgetSurfaceFromAccent(accentHex) {
  if (isNearBlackAccent(accentHex)) return '#000000'
  return hexRgbInvert(accentHex)
}
