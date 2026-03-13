import { useEffect, useState } from 'react'
import './PreLanding.css'

export default function PreLanding({ onEnterDesktop, onEnterMobile }) {
  const [phase, setPhase] = useState('booting') // 'booting' | 'ready'
  const [showMobileButton, setShowMobileButton] = useState(false)

  // Boot sequence: 4 seconds, then switch to gate
  useEffect(() => {
    const t = setTimeout(() => setPhase('ready'), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'ready') return
    setShowMobileButton(false)
    const t = setTimeout(() => setShowMobileButton(true), 1200)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        onEnterDesktop?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEnterDesktop])

  const handleMobileEnter = () => {
    onEnterMobile?.()
  }

  if (phase === 'booting') {
    return (
      <div className="pre-landing pre-landing--boot">
        <div className="pre-landing__boot">
          <div className="pre-landing__boot-logo">Portfolio OS</div>
          <div className="pre-landing__boot-bar">
            <div className="pre-landing__boot-progress" />
          </div>
          <p className="pre-landing__boot-text">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pre-landing">
      <p className="pre-landing__flash">Press Fn + F11 to Enter</p>
      <div className={`pre-landing__mobile-wrap ${showMobileButton ? 'pre-landing__mobile-wrap--visible' : ''}`}>
        <button type="button" className="pre-landing__mobile-btn" onClick={handleMobileEnter}>
          Mobile User
        </button>
      </div>
    </div>
  )
}
