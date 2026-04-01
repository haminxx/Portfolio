import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { AppleHelloEnglishEffect } from '@/components/ui/apple-hello-effect'
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
 * Full-screen welcome: Apple-style "hello" stroke draw, then fade to desktop.
 */
export default function WelcomeOverlay({ onComplete }) {
  const { unlockAutoplay } = useMusicPlayer()
  const [phase, setPhase] = useState('hello')
  const finishedRef = useRef(false)
  const helloDoneRef = useRef(false)

  const goExit = useCallback(() => {
    unlockAutoplay()
    tryEnterFullscreen()
    setPhase('exit')
  }, [unlockAutoplay])

  const handleHelloDrawDone = useCallback(() => {
    if (helloDoneRef.current) return
    helloDoneRef.current = true
    window.setTimeout(goExit, 420)
  }, [goExit])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleExitComplete = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    try {
      localStorage.setItem('portfolio_welcome_done_v1', '1')
    } catch {
      /* ignore */
    }
    onComplete?.('')
  }, [onComplete])

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
        {phase === 'hello' && (
          <div className="welcome-overlay__stack welcome-overlay__stack--intro welcome-overlay__stack--hello-only">
            <AppleHelloEnglishEffect
              speed={1.1}
              className={helloSvgClass}
              style={{ color: 'rgba(255,255,255,0.95)' }}
              onAnimationComplete={handleHelloDrawDone}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
