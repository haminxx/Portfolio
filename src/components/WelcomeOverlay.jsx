import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { AppleHelloEnglishEffect } from '@/components/ui/apple-hello-effect'
import { DynamicCursiveText } from '@/components/ui/dynamic-cursive-text'
import { useDesktopBackground } from '../context/DesktopBackgroundContext'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import './WelcomeOverlay.css'

const DesktopShaderBackground = lazy(() => import('./ui/DesktopShaderBackground'))

function WelcomeBackground() {
  const { color1, color2, speed } = useDesktopBackground()
  return (
    <Suspense fallback={<div className="welcome-overlay__bg-fallback" aria-hidden />}>
      <DesktopShaderBackground color1={color1} color2={color2} speed={speed} />
    </Suspense>
  )
}

function tryEnterFullscreen() {
  const el = document.documentElement
  try {
    const p = el.requestFullscreen?.()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  } catch {
    /* ignore */
  }
  try {
    if (typeof el.webkitRequestFullscreen === 'function') el.webkitRequestFullscreen()
  } catch {
    /* ignore */
  }
}

/**
 * Full-screen welcome: Apple-style "hello" stroke, underline, lift, name field with underbar,
 * then path-based cursive name (DynamicCursiveText), fade out + fullscreen + desktop.
 */
export default function WelcomeOverlay({ onComplete }) {
  const { color2 } = useDesktopBackground()
  const { unlockAutoplay } = useMusicPlayer()
  const [phase, setPhase] = useState('intro')
  /** draw → underline (under hello) → name (lift + form) */
  const [introStep, setIntroStep] = useState('draw')
  const [visitorName, setVisitorName] = useState('')
  const [inputValue, setInputValue] = useState('')
  const finishedRef = useRef(false)
  const helloDoneRef = useRef(false)
  const greetingExitTimerRef = useRef(null)
  const greetingExitOnceRef = useRef(false)

  const handleHelloDrawDone = useCallback(() => {
    if (helloDoneRef.current) return
    helloDoneRef.current = true
    setIntroStep('underline')
  }, [])

  const handleHelloUnderlineDone = useCallback(() => {
    setIntroStep('name')
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const goToGreeting = useCallback(() => {
    const trimmed = inputValue.trim()
    setVisitorName(trimmed || 'friend')
    setPhase('greeting')
  }, [inputValue])

  const handleNameSubmit = useCallback(
    (e) => {
      e.preventDefault()
      goToGreeting()
    },
    [goToGreeting],
  )

  const scheduleGreetingExit = useCallback(() => {
    if (greetingExitOnceRef.current) return
    greetingExitOnceRef.current = true
    if (greetingExitTimerRef.current) {
      clearTimeout(greetingExitTimerRef.current)
      greetingExitTimerRef.current = null
    }
    greetingExitTimerRef.current = window.setTimeout(() => {
      greetingExitTimerRef.current = null
      unlockAutoplay()
      tryEnterFullscreen()
      setPhase('exit')
    }, 650)
  }, [unlockAutoplay])

  useEffect(() => {
    if (phase !== 'greeting') return undefined
    greetingExitOnceRef.current = false
    const fallbackMs = 4800
    const id = window.setTimeout(() => scheduleGreetingExit(), fallbackMs)
    return () => clearTimeout(id)
  }, [phase, visitorName, scheduleGreetingExit])

  const handleNameStrokeComplete = useCallback(() => {
    if (phase !== 'greeting') return
    scheduleGreetingExit()
  }, [phase, scheduleGreetingExit])

  const handleExitComplete = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    try {
      localStorage.setItem('portfolio_welcome_done_v1', '1')
      localStorage.setItem('portfolio_visitor_name', visitorName)
    } catch {
      /* ignore */
    }
    onComplete?.(visitorName)
  }, [onComplete, visitorName])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const t = setTimeout(handleExitComplete, 780)
    return () => clearTimeout(t)
  }, [phase, handleExitComplete])

  useEffect(() => {
    return () => {
      if (greetingExitTimerRef.current) clearTimeout(greetingExitTimerRef.current)
    }
  }, [])

  const helloSvgClass =
    'welcome-overlay__hello-svg text-white drop-shadow-sm [color:rgba(255,255,255,0.95)]'

  return (
    <motion.div
      className="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'exit' ? 0 : 1 }}
      transition={{ duration: phase === 'exit' ? 0.75 : 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="welcome-overlay__bg">
        <WelcomeBackground />
      </div>

      <div className="welcome-overlay__content">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              className="welcome-overlay__stack welcome-overlay__stack--intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {introStep === 'draw' && (
                <div className="welcome-overlay__stack welcome-overlay__stack--hello">
                  <AppleHelloEnglishEffect
                    speed={1.1}
                    className={helloSvgClass}
                    style={{ color: 'rgba(255,255,255,0.95)' }}
                    onAnimationComplete={handleHelloDrawDone}
                  />
                </div>
              )}

              {(introStep === 'underline' || introStep === 'name') && (
                <motion.div
                  className="welcome-overlay__hello-block"
                  animate={{ y: introStep === 'name' ? -28 : 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AppleHelloEnglishEffect
                    drawn
                    speed={1}
                    className={`${helloSvgClass} welcome-overlay__hello-svg--compact`}
                    style={{ color: 'rgba(255,255,255,0.95)' }}
                  />
                  {introStep === 'underline' ? (
                    <motion.div
                      className="welcome-overlay__hello-underline"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                      onAnimationComplete={handleHelloUnderlineDone}
                    />
                  ) : null}
                </motion.div>
              )}

              {introStep === 'name' && (
                <motion.div
                  className="welcome-overlay__name-entry"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                >
                  <form onSubmit={handleNameSubmit} className="welcome-overlay__name-form">
                    <div className="welcome-overlay__name-row">
                      <input
                        type="text"
                        className="welcome-overlay__input welcome-overlay__input--name-row"
                        placeholder="Your name"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoComplete="given-name"
                        autoFocus
                        maxLength={48}
                        aria-label="Your name"
                      />
                      <button
                        type="submit"
                        className="welcome-overlay__name-arrow"
                        aria-label="Continue"
                        style={{ color: color2, borderColor: color2 }}
                      >
                        <ArrowRight size={22} strokeWidth={2.25} aria-hidden />
                      </button>
                    </div>
                    <motion.div
                      className="welcome-overlay__name-underbar"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                      style={{ transformOrigin: 'left center' }}
                      aria-hidden
                    />
                  </form>
                </motion.div>
              )}
            </motion.div>
          )}

          {(phase === 'greeting' || phase === 'exit') && (
            <motion.div
              key="greeting"
              className="welcome-overlay__stack welcome-overlay__greeting-single welcome-overlay__greeting-hello-and-name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="welcome-overlay__hello-block welcome-overlay__hello-block--greeting">
                <AppleHelloEnglishEffect
                  drawn
                  speed={1}
                  className={`${helloSvgClass} welcome-overlay__hello-svg--compact`}
                  style={{ color: 'rgba(255,255,255,0.95)' }}
                />
                <div
                  className="welcome-overlay__hello-underline"
                  style={{ transform: 'scaleX(1)' }}
                  aria-hidden
                />
              </div>
              <DynamicCursiveText
                key={visitorName}
                text={visitorName.trim() || 'friend'}
                speed={1}
                style={{ color: color2 }}
                className="welcome-overlay__name-stroke drop-shadow-sm"
                onAnimationComplete={handleNameStrokeComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
