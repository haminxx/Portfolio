import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'portfolio-theme'
const ACCENT_KEY = 'portfolio-accent'

const ACCENT_COLORS = [
  { id: 'blue', label: 'Blue', value: '#007aff' },
  { id: 'green', label: 'Green', value: '#34c759' },
  { id: 'purple', label: 'Purple', value: '#af52de' },
  { id: 'orange', label: 'Orange', value: '#ff9500' },
  { id: 'red', label: 'Red', value: '#ff3b30' },
  { id: 'pink', label: 'Pink', value: '#ff2d55' },
]

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [nightMode, setNightModeState] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'light' ? false : true
  })
  const [accentColor, setAccentColorState] = useState(() => {
    if (typeof window === 'undefined') return 'blue'
    return localStorage.getItem(ACCENT_KEY) || 'blue'
  })

  useEffect(() => {
    localStorage.setItem(THEME_KEY, nightMode ? 'dark' : 'light')
    document.documentElement.dataset.theme = nightMode ? 'dark' : 'light'
  }, [nightMode])

  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accentColor)
    const color = ACCENT_COLORS.find((c) => c.id === accentColor)?.value ?? '#007aff'
    document.documentElement.style.setProperty('--accent-color', color)
  }, [accentColor])

  const setNightMode = useCallback((valueOrFn) => {
    setNightModeState((prev) => (typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn))
  }, [])

  const setAccentColor = useCallback((id) => {
    setAccentColorState(id)
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        nightMode,
        setNightMode,
        accentColor,
        setAccentColor,
        accentColors: ACCENT_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  return (
    ctx || {
      nightMode: true,
      setNightMode: () => {},
      accentColor: 'blue',
      setAccentColor: () => {},
      accentColors: ACCENT_COLORS,
    }
  )
}
