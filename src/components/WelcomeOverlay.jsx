import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppleHelloEnglishEffect } from '@/components/ui/apple-hello-effect'
import { useDesktopBackground } from '../context/DesktopBackgroundContext'
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
      tryEnterFullscreen()
      setPhase('exit')
    }, 2000)
    return () => clearTimeout(t)
  }, [phase])

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
              className="welcome-overlay__stack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <AppleHelloEnglishEffect
                speed={1.1}
                className="welcome-overlay__hello-svg text-white drop-shadow-sm"
                style={{ color: 'rgba(255,255,255,0.95)' }}
                onAnimationComplete={handleHelloDone}
              />
            </motion.div>
          )}

          {phase === 'name' && (
            <motion.div
              key="name"
              className="welcome-overlay__stack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="welcome-overlay__prompt mb-3 text-center text-base text-zinc-400 md:text-lg">
                What&apos;s your name?
              </p>
              <motion.div
                className="welcome-overlay__underline mb-8 h-0.5 w-full max-w-[min(18rem,85vw)] origin-left bg-zinc-500/80"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              />
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
              className="welcome-overlay__stack welcome-overlay__greeting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              <motion.p
                className="welcome-overlay__hello-label text-2xl font-light text-white/90 md:text-3xl"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Hello,
              </motion.p>
              <motion.p
                className="welcome-overlay__name mt-2 text-4xl font-semibold tracking-tight text-white md:text-6xl"
                style={{ color: color2 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                {visitorName}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
