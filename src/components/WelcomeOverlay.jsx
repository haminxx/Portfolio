import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useDesktopBackground } from '../context/DesktopBackgroundContext'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { textToPaths } from '../lib/hersheyFont'
import './WelcomeOverlay.css'

const DesktopShaderBackground = lazy(() => import('./ui/DesktopShaderBackground'))

function WelcomeBackground() {
  const { color1, color2, speed } = useDesktopBackground()
  return (
    <Suspense fallback={<div className="wo__bg-fall" aria-hidden />}>
      <DesktopShaderBackground color1={color1} color2={color2} speed={speed} />
    </Suspense>
  )
}

/* ── Hershey stroke-draw SVG ── */
function HersheyDraw({ text, size = 72, duration = 2, overlap = 0.04, strokeWidth = 2.4, delay = 0, onDone }) {
  const { paths, width, height } = textToPaths(text, size)
  const svgRef = useRef(null)
  const [lengths, setLengths] = useState([])
  const doneRef = useRef(false)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const els = svg.querySelectorAll('.wo__hpath')
    const lens = Array.from(els).map((el) => el.getTotalLength())
    setLengths(lens)
  }, [text, size])

  const totalSegments = paths.length
  const segDuration = totalSegments > 0 ? duration / (totalSegments * (1 - overlap) + overlap) : duration

  useEffect(() => {
    if (!lengths.length || doneRef.current) return
    const totalTime = (delay + duration + 0.3) * 1000
    const t = setTimeout(() => { doneRef.current = true; onDone?.() }, totalTime)
    return () => clearTimeout(t)
  }, [lengths, delay, duration, onDone])

  return (
    <motion.svg
      ref={svgRef}
      className="wo__hsvg"
      viewBox={`-4 -4 ${width + 8} ${height + 8}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {paths.map((d, i) => {
        const len = lengths[i] || 200
        const segDelay = delay + i * segDuration * (1 - overlap)
        return (
          <path
            key={`${text}-${i}`}
            className="wo__hpath"
            d={d}
            style={{
              strokeDasharray: len,
              strokeDashoffset: len,
              animation: lengths.length
                ? `wo-draw ${segDuration}s cubic-bezier(0.65,0,0.35,1) ${segDelay}s forwards`
                : 'none',
            }}
          />
        )
      })}
    </motion.svg>
  )
}

/* ════════════════════════════════════════════ */
export default function WelcomeOverlay({ onComplete }) {
  const { unlockAutoplay } = useMusicPlayer()
  const [phase, setPhase] = useState('input')   // input → fadeInput → hello → name → exit
  const [name, setName] = useState('')
  const inputRef = useRef(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (phase === 'input') inputRef.current?.focus()
  }, [phase])

  const handleSubmit = useCallback((e) => {
    e?.preventDefault?.()
    const v = name.trim()
    if (!v) return
    setPhase('fadeInput')
  }, [name])

  /* fadeInput → hello */
  useEffect(() => {
    if (phase !== 'fadeInput') return
    const t = setTimeout(() => setPhase('hello'), 700)
    return () => clearTimeout(t)
  }, [phase])

  /* hello done → name */
  const onHelloDone = useCallback(() => {
    setPhase('name')
  }, [])

  /* name done → exit */
  const onNameDone = useCallback(() => {
    setTimeout(() => {
      unlockAutoplay()
      setPhase('exit')
    }, 600)
  }, [unlockAutoplay])

  /* exit → complete */
  useEffect(() => {
    if (phase !== 'exit') return
    const t = setTimeout(() => {
      if (finishedRef.current) return
      finishedRef.current = true
      try { localStorage.setItem('portfolio_welcome_done_v1', '1') } catch { /* */ }
      onComplete?.(name.trim())
    }, 800)
    return () => clearTimeout(t)
  }, [phase, onComplete, name])

  const isExiting = phase === 'exit'

  return (
    <motion.div
      className="wo"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: isExiting ? 0.8 : 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="wo__bg"><WelcomeBackground /></div>

      <div className="wo__center">
        {/* ── Name input (liquid glass) ── */}
        <AnimatePresence>
          {(phase === 'input' || phase === 'fadeInput') && (
            <motion.form
              className="wo__glass"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{
                opacity: phase === 'fadeInput' ? 0 : 1,
                y: phase === 'fadeInput' ? -12 : 0,
                scale: phase === 'fadeInput' ? 0.95 : 1,
              }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: phase === 'fadeInput' ? 0.6 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <input
                ref={inputRef}
                type="text"
                className="wo__glass-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="wo__glass-arrow"
                disabled={!name.trim()}
                aria-label="Continue"
              >
                <ChevronRight size={22} strokeWidth={2.5} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Hershey "hello," animation ── */}
        <AnimatePresence>
          {(phase === 'hello' || phase === 'name') && (
            <motion.div
              className="wo__anim-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <HersheyDraw
                text="hello,"
                size={80}
                duration={1.8}
                overlap={0.06}
                strokeWidth={2.8}
                delay={0.3}
                onDone={phase === 'hello' ? onHelloDone : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hershey name animation ── */}
        <AnimatePresence>
          {phase === 'name' && (
            <motion.div
              className="wo__anim-row wo__anim-row--name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <HersheyDraw
                text={name.trim()}
                size={72}
                duration={2}
                overlap={0.04}
                strokeWidth={2.4}
                delay={0.2}
                onDone={onNameDone}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
