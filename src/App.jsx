import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import ChromeLanding from './pages/ChromeLanding'

const VIEW_KEY = 'portfolio-view'

function AppShell() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(VIEW_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const handleReboot = () => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
  }

  return <ChromeLanding onReboot={handleReboot} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />} />
    </Routes>
  )
}

export default App
