import { useEffect, useState, useCallback, useRef } from 'react'
import './PreLanding.css'

const PHASES = ['hello', 'welcome', 'swipePrompt', 'transitioning']

export default function PreLanding({ onEnterDesktop, onEnterMobile }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [showMobileButton, setShowMobileButton] = useState(false)
  const touchStartY = useRef(0)

  const phase = PHASES[phaseIndex]

  // Hello animation: 2.5s, then welcome
  useEffect(() => {
    if (phase !== 'hello') return
    const t = setTimeout(() => setPhaseIndex(1), 2500)
    return () => clearTimeout(t)
  }, [phase])

  // Welcome: show after 0.5s, then swipe prompt after 1.5s
  useEffect(() => {
    if (phase !== 'welcome') return
    const t1 = setTimeout(() => setPhaseIndex(2), 2000)
    return () => clearTimeout(t1)
  }, [phase])

  const handleSwipeUp = useCallback(() => {
    if (phase !== 'swipePrompt') return
    setPhaseIndex(3)
  }, [phase])

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (phase !== 'swipePrompt') return
    const endY = e.changedTouches[0].clientY
    const delta = touchStartY.current - endY
    if (delta > 80) handleSwipeUp()
  }, [phase, handleSwipeUp])

  const handleWheel = useCallback((e) => {
    if (phase !== 'swipePrompt') return
    if (e.deltaY < -30) handleSwipeUp()
  }, [phase, handleSwipeUp])

  useEffect(() => {
    if (phaseIndex !== 3) return
    const t = setTimeout(() => onEnterDesktop?.(), 1200)
    return () => clearTimeout(t)
  }, [phaseIndex, onEnterDesktop])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        if (phase === 'swipePrompt') {
          handleSwipeUp()
        } else if (phase === 'hello' || phase === 'welcome') {
          setPhaseIndex(2)
        } else if (phase !== 'transitioning') {
          onEnterDesktop?.()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, handleSwipeUp, onEnterDesktop])

  useEffect(() => {
    if (phase !== 'swipePrompt') return
    setShowMobileButton(false)
    const t = setTimeout(() => setShowMobileButton(true), 800)
    return () => clearTimeout(t)
  }, [phase])

  const handleMobileEnter = () => onEnterMobile?.()

  const isTransitioning = phase === 'transitioning'

  return (
    <div
      className={`pre-landing pre-landing--${phase} ${isTransitioning ? 'pre-landing--transitioning' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="pre-landing__bg" />
      <div className="pre-landing__content">
        {phase === 'hello' && (
          <div className="pre-landing__hello-wrap">
            <svg
              className="pre-landing__hello-svg"
              viewBox="0 0 320 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="helloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="25%" stopColor="#a0e0a0" />
                  <stop offset="50%" stopColor="#ffe066" />
                  <stop offset="75%" stopColor="#ff9966" />
                  <stop offset="100%" stopColor="#fff" />
                </linearGradient>
              </defs>
              <path
                className="pre-landing__hello-path"
                d="M60 85 Q75 55 95 75 Q115 95 105 70 Q95 45 115 70 Q135 95 125 75 Q115 55 135 80 L135 80 L155 80 L155 45 Q155 30 170 38 L185 48 L185 80 L205 80 Q205 55 222 55 Q240 55 240 80 Q240 105 222 105 Q205 105 205 80 L225 80 L225 45 Q225 30 240 38 L255 48 L255 80"
                stroke="url(#helloGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        {(phase === 'welcome' || phase === 'swipePrompt') && (
          <>
            <p className="pre-landing__welcome">Welcome to CNL</p>
            {phase === 'swipePrompt' && (
              <>
                <p className="pre-landing__swipe-hint" onClick={handleSwipeUp} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSwipeUp()}>
                  Swipe up or click to enter
                </p>
                <div className={`pre-landing__mobile-wrap ${showMobileButton ? 'pre-landing__mobile-wrap--visible' : ''}`}>
                  <button type="button" className="pre-landing__mobile-btn" onClick={handleMobileEnter}>
                    Mobile User
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
