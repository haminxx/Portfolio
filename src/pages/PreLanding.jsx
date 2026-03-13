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
                d="M50 90 L50 40 L70 40 L70 60 L90 40 L110 40 L90 60 L110 80 L90 80 L70 60 L70 90 M130 65 C130 42 155 32 175 45 C195 58 195 82 175 92 C155 102 130 88 130 65 M175 65 C175 55 165 50 160 55 C155 60 160 72 175 72 M195 90 L195 40 L215 40 L215 68 C215 88 235 98 255 85 C275 72 275 48 255 38 C235 28 195 42 195 68 M255 65 C255 55 245 50 240 55 C235 60 240 72 255 72 M275 90 L275 40 L295 40 L295 90"
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
