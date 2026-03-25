import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'

const STORAGE_KEY = 'desktop-bg-shader-v1'

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex ?? '').trim())
  if (!m) return { r: 138, g: 136, b: 140 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function relativeLuminance(hex) {
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

/** Readable foreground when averaging two mesh-like background colors (canvas blend is unreliable). */
function chromeForegroundForPair(color1, color2) {
  const L = (relativeLuminance(color1) + relativeLuminance(color2)) / 2
  return L > 0.45 ? '#0a0a0c' : '#f5f5f7'
}

function foregroundOnSolid(bgHex) {
  return relativeLuminance(bgHex) > 0.45 ? '#0a0a0c' : '#f5f5f7'
}

const DEFAULTS = {
  color1: '#1a1a1a',
  color2: '#e8e4df',
  speed: 0.72,
}

const SPEED_MIN = 0.15
const SPEED_MAX = 1.5

function clampSpeed(n) {
  if (!Number.isFinite(n)) return DEFAULTS.speed
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, n))
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw)
    return {
      color1: typeof p.color1 === 'string' ? p.color1 : DEFAULTS.color1,
      color2: typeof p.color2 === 'string' ? p.color2 : DEFAULTS.color2,
      speed: clampSpeed(typeof p.speed === 'number' ? p.speed : DEFAULTS.speed),
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

const DesktopBackgroundContext = createContext(null)

export function DesktopBackgroundProvider({ children }) {
  const [prefs, setPrefs] = useState(() => loadPrefs())

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  useEffect(() => {
    const { color1, color2 } = prefs
    const fg = chromeForegroundForPair(color1, color2)
    const muted =
      fg === '#0a0a0c' ? 'rgba(10, 10, 14, 0.58)' : 'rgba(245, 245, 247, 0.62)'
    const onAccent = foregroundOnSolid(color2)
    const el = document.documentElement
    el.style.setProperty('--portfolio-chrome-fg', fg)
    el.style.setProperty('--portfolio-chrome-muted', muted)
    el.style.setProperty('--portfolio-accent', color2)
    el.style.setProperty('--portfolio-on-accent', onAccent)
  }, [prefs.color1, prefs.color2])

  const setColor1 = useCallback((color1) => {
    setPrefs((p) => ({ ...p, color1 }))
  }, [])
  const setColor2 = useCallback((color2) => {
    setPrefs((p) => ({ ...p, color2 }))
  }, [])
  const setSpeed = useCallback((speed) => {
    setPrefs((p) => ({ ...p, speed: clampSpeed(speed) }))
  }, [])

  const value = useMemo(
    () => ({
      ...prefs,
      setColor1,
      setColor2,
      setSpeed,
    }),
    [prefs, setColor1, setColor2, setSpeed],
  )

  return <DesktopBackgroundContext.Provider value={value}>{children}</DesktopBackgroundContext.Provider>
}

export function useDesktopBackground() {
  const ctx = useContext(DesktopBackgroundContext)
  if (!ctx) {
    return {
      ...DEFAULTS,
      setColor1: () => {},
      setColor2: () => {},
      setSpeed: () => {},
    }
  }
  return ctx
}
