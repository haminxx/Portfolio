import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import ChromeLanding from './pages/ChromeLanding'
import iPhoneMobileLanding from './pages/iPhoneMobileLanding'

const VIEW_KEY = 'portfolio-view'

function readInitialView() {
  if (typeof window === 'undefined') return 'desktop'
  const v = sessionStorage.getItem(VIEW_KEY)
  if (v === 'boot' || v === null || v === '') {
    sessionStorage.setItem(VIEW_KEY, 'desktop')
    return 'desktop'
  }
  return v
}

function LandingWrapper() {
  const [view, setView] = useState(() => readInitialView())

  useEffect(() => {
    sessionStorage.setItem(VIEW_KEY, view)
  }, [view])

  if (view === 'mobile') {
    return <iPhoneMobileLanding />
  }

  const handleReboot = () => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
    setView('desktop')
  }

  return <ChromeLanding onReboot={handleReboot} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingWrapper />} />
    </Routes>
  )
}

export default App
