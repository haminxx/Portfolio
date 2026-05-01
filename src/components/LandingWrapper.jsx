import { useState, useCallback } from 'react'
import PreLanding from '../pages/PreLanding'
import ChromeLanding from '../pages/ChromeLanding'
import iPhoneMobileLanding from '../pages/iPhoneMobileLanding'

const VIEW_KEY = 'portfolio-view' // sessionStorage key

/** Aligns MusicPlayer autoplay unlock with finished boot flow (replacing WelcomeOverlay). */
function markPortfolioWelcomeComplete() {
  try {
    localStorage.setItem('portfolio_welcome_done_v1', '1')
  } catch {
    /* ignore */
  }
}

export default function LandingWrapper() {
  const [view, setViewState] = useState(() => {
    if (typeof window === 'undefined') return 'boot'
    const saved = sessionStorage.getItem(VIEW_KEY)
    if (saved === 'desktop' || saved === 'mobile') return saved
    return 'boot'
  })

  const setView = useCallback((v) => {
    setViewState(v)
    sessionStorage.setItem(VIEW_KEY, v)
  }, [])

  const handleEnterDesktop = useCallback(() => {
    markPortfolioWelcomeComplete()
    setView('desktop')
  }, [setView])

  const handleEnterMobile = useCallback(() => {
    markPortfolioWelcomeComplete()
    setView('mobile')
  }, [setView])

  if (view === 'boot') {
    return (
      <PreLanding
        onEnterDesktop={handleEnterDesktop}
        onEnterMobile={handleEnterMobile}
      />
    )
  }

  if (view === 'mobile') {
    return <iPhoneMobileLanding onEnterDesktop={handleEnterDesktop} />
  }

  return <ChromeLanding />
}
