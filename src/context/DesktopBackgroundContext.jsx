import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'

const STORAGE_KEY = 'desktop-bg-shader-v1'

const DEFAULTS = {
  color1: '#121018',
  color2: '#d4cfc4',
  speed: 0.35,
  waveAmp: 1.0,
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw)
    return {
      color1: typeof p.color1 === 'string' ? p.color1 : DEFAULTS.color1,
      color2: typeof p.color2 === 'string' ? p.color2 : DEFAULTS.color2,
      speed: typeof p.speed === 'number' && Number.isFinite(p.speed) ? p.speed : DEFAULTS.speed,
      waveAmp: typeof p.waveAmp === 'number' && Number.isFinite(p.waveAmp) ? p.waveAmp : DEFAULTS.waveAmp,
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
    setPrefs((p) => ({ ...p, speed }))
  }, [])
  const setWaveAmp = useCallback((waveAmp) => {
    setPrefs((p) => ({ ...p, waveAmp }))
  }, [])

  const value = useMemo(
    () => ({
      ...prefs,
      setColor1,
      setColor2,
      setSpeed,
      setWaveAmp,
    }),
    [prefs, setColor1, setColor2, setSpeed, setWaveAmp],
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
      setWaveAmp: () => {},
    }
  }
  return ctx
}
