import { useState, useCallback } from 'react'
import PreLanding from './PreLanding'
import ChromeLanding from './ChromeLanding'
import iPhoneMobileLanding from './iPhoneMobileLanding'

const STORAGE_KEY = 'portfolio-view'

function getStoredView() {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    if (v === 'desktop' || v === 'mobile') return v
  } catch {
    /* ignore */
  }
  return null
}

function setStoredView(view) {
  try {
    sessionStorage.setItem(STORAGE_KEY, view)
  } catch {
    /* ignore */
  }
}

/** Align MusicPlayer autoplay with finished boot flow. */
function markPortfolioWelcomeComplete() {
  try {
    localStorage.setItem('portfolio_welcome_done_v1', '1')
  } catch {
    /* ignore */
  }
}

export default function LandingWrapper() {
  const [view, setView] = useState(() => getStoredView() || 'boot')

  const handleEnterDesktop = useCallback(() => {
    markPortfolioWelcomeComplete()
    setView('desktop')
    setStoredView('desktop')
  }, [])

  if (view === 'boot') {
    return <PreLanding onEnterDesktop={handleEnterDesktop} />
  }

  if (view === 'mobile') {
    return <iPhoneMobileLanding />
  }

  return <ChromeLanding />
}
