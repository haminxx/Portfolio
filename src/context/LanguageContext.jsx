import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LANG_KEY = 'portfolio-language'

export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'ko', label: '한국어' },
  { id: 'es', label: 'Español' },
  { id: 'zh', label: '中文' },
  { id: 'fr', label: 'Français' },
  { id: 'ja', label: '日本語' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'ar', label: 'العربية' },
]

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    return localStorage.getItem(LANG_KEY) || 'en'
  })

  useEffect(() => {
    localStorage.setItem(LANG_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((id) => {
    setLanguageState(id)
  }, [])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  return ctx || { language: 'en', setLanguage: () => {}, languages: LANGUAGES }
}
