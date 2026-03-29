import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppleHelloEnglishEffect } from '@/components/ui/apple-hello-effect'
import { VisitorNameReveal } from '@/components/ui/visitor-name-reveal'
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
 * Full-screen welcome: Apple-style "hello" stroke, name prompt, personalized greeting,
 * then fade out + fullscreen + hand off to the desktop.
 */
export default function WelcomeOverlay({ onComplete }) {
  const { color2 } = useDesktopBackground()
  const { unlockAutoplay } = useMusicPlayer()
  const [phase, setPhase] = useState('hello')
  const [visitorName, setVisitorName] = useState('')
  const [inputValue, setInputValue] = useState('')
  const finishedRef = useRef(false)
  const helloAdvancedRef = useRef(false)

  const handleHelloDone = useCallback(() => {
    if (helloAdvancedRef.current) return
    helloAdvancedRef.current = true
    setPhase('name')
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleNameSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const trimmed = inputValue.trim()
      const name = trimmed || 'friend'
      setVisitorName(name)
      setPhase('greeting')
    },
    [inputValue],
  )

  useEffect(() => {
    if (phase !== 'greeting') return undefined
    const t = setTimeout(() => {
      unlockAutoplay()
      tryEnterFullscreen()
      setPhase('exit')
    }, 2000)
    return () => clearTimeout(t)
  }, [phase, unlockAutoplay])

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
          {phase === 'hello' && (
            <motion.div
              key="hello"
              className="welcome-overlay__stack welcome-overlay__stack--hello"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <AppleHelloEnglishEffect
                speed={1.1}
                className={helloSvgClass}
                style={{ color: 'rgba(255,255,255,0.95)' }}
                onAnimationComplete={handleHelloDone}
              />
            </motion.div>
          )}

          {phase === 'name' && (
            <motion.div
              key="name"
              className="welcome-overlay__stack welcome-overlay__stack--name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="welcome-overlay__hello-block"
                initial={{ y: 28, opacity: 0.85 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <AppleHelloEnglishEffect
                  drawn
                  speed={1}
                  className={`${helloSvgClass} welcome-overlay__hello-svg--compact`}
                  style={{ color: 'rgba(255,255,255,0.95)' }}
                />
                <motion.div
                  className="welcome-overlay__hello-underline"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                />
              </motion.div>
              <p className="welcome-overlay__prompt mb-1 text-center text-base text-zinc-400 md:text-lg">
                What&apos;s your name?
              </p>
              <form onSubmit={handleNameSubmit} className="flex w-full max-w-md flex-col items-center gap-4">
                <input
                  type="text"
                  className="welcome-overlay__input"
                  placeholder="Your name"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoComplete="given-name"
                  autoFocus
                  maxLength={48}
                  aria-label="Your name"
                />
                <button type="submit" className="welcome-overlay__submit" style={{ borderColor: color2 }}>
                  Continue
                </button>
              </form>
            </motion.div>
          )}

          {(phase === 'greeting' || phase === 'exit') && (
            <motion.div
              key="greeting"
              className="welcome-overlay__stack welcome-overlay__greeting-split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <motion.div
                className="welcome-overlay__name-reveal-wrap"
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              >
                <VisitorNameReveal name={visitorName} accentColor={color2} />
              </motion.div>
              <motion.div
                className="welcome-overlay__name-outro"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
              >
                <AppleHelloEnglishEffect
                  drawn
                  speed={1}
                  className={`${helloSvgClass} welcome-overlay__hello-svg--compact`}
                  style={{ color: 'rgba(255,255,255,0.95)' }}
                />
                <div className="welcome-overlay__hello-underline" style={{ transform: 'scaleX(1)' }} />
                <p className="welcome-overlay__prompt--ghost">What&apos;s your name?</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
