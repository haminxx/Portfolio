import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'

const STORAGE_KEY = 'desktop-bg-shader-v1'

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
