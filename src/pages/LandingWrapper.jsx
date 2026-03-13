import { useState, useEffect, useCallback } from 'react'
import PreLanding from './PreLanding'
import ChromeLanding from './ChromeLanding'
import iPhoneMobileLanding from './iPhoneMobileLanding'

const STORAGE_KEY = 'portfolio-view'

function getStoredView() {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    if (v === 'desktop' || v === 'mobile') return v
  } catch {
    // ignore
  }
  return null
}

function setStoredView(view) {
  try {
    sessionStorage.setItem(STORAGE_KEY, view)
  } catch {
    // ignore
  }
}

export default function LandingWrapper() {
  const [view, setView] = useState(() => getStoredView() || 'boot')

  const handleEnterDesktop = useCallback(() => {
    setView('desktop')
    setStoredView('desktop')
  }, [])

  const handleEnterMobile = useCallback(() => {
    setView('mobile')
    setStoredView('mobile')
  }, [])

  if (view === 'boot') {
    return (
      <PreLanding
        onEnterDesktop={handleEnterDesktop}
        onEnterMobile={handleEnterMobile}
      />
    )
  }

  if (view === 'mobile') {
    return <iPhoneMobileLanding />
  }

  return <ChromeLanding />
}
