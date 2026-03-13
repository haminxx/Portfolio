import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import PreLanding from './pages/PreLanding'
import ChromeLanding from './pages/ChromeLanding'
import iPhoneMobileLanding from './pages/iPhoneMobileLanding'

const VIEW_KEY = 'portfolio-view'

function LandingWrapper() {
  const [view, setView] = useState(() => {
    if (typeof window === 'undefined') return 'boot'
    return (sessionStorage.getItem(VIEW_KEY) || 'boot')
  })

  useEffect(() => {
    if (view !== 'boot') {
      sessionStorage.setItem(VIEW_KEY, view)
    }
  }, [view])

  const handleEnterDesktop = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setView('desktop')
      }).catch(() => setView('desktop'))
    } else {
      setView('desktop')
    }
  }

  const handleEnterMobile = () => {
    setView('mobile')
  }

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingWrapper />} />
    </Routes>
  )
}

export default App
