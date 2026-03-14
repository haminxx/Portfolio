import { useState, useEffect, useRef } from 'react'
import './AboutPage.css'

const NAME_FULL = 'Christian Lee'
const NAME_ABBREV = 'C&L'
const NAME_FINAL = 'CNL'
const RANDOM_CHARS = '$^&$%^&$@#!*'

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const parent = el.closest('.chrome-landing__content') || document.documentElement
    const handleScroll = () => {
      const rect = el.getBoundingClientRect()
      const viewHeight = window.innerHeight
      const triggerStart = viewHeight * 0.3
      const triggerEnd = viewHeight * 0.1
      let p = 0
      if (rect.top < triggerStart) {
        p = Math.min(1, (triggerStart - rect.top) / (triggerStart - triggerEnd))
      }
      setProgress(p)
    }
    parent.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => parent.removeEventListener('scroll', handleScroll)
  }, [])

  return [progress, containerRef]
}

function AnimatedName({ progress }) {
  const [displayText, setDisplayText] = useState(NAME_FULL)

  useEffect(() => {
    if (progress < 0.15) {
      setDisplayText(NAME_FULL)
      return
    }
    if (progress < 0.5) {
      setDisplayText(NAME_FULL.split('').map(() =>
        RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]
      ).join(''))
      return
    }
    if (progress < 0.75) {
      setDisplayText(NAME_ABBREV)
      return
    }
    setDisplayText(NAME_FINAL)
  }, [progress])

  useEffect(() => {
    if (progress < 0.15 || progress >= 0.5) return
    const id = setInterval(() => {
      setDisplayText((prev) =>
        prev.split('').map(() =>
          RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]
        ).join('')
      )
    }, 60)
    return () => clearInterval(id)
  }, [progress])

  return <span className="about-page__name">{displayText}</span>
}

export default function AboutPage() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [activityOpen, setActivityOpen] = useState(false)
  const [networkOpen, setNetworkOpen] = useState(false)
  const canvasRef = useRef(null)
  const [scrollProgress, contentRef] = useScrollProgress()

  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      if (!w || !h) {
        raf = requestAnimationFrame(draw)
        return
      }
      const cx = mousePos.x * w
      const cy = mousePos.y * h
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6)
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
      gradient.addColorStop(0.4, 'rgba(34, 197, 94, 0.15)')
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [mousePos])

  return (
    <div className="about-page" ref={contentRef}>
      <canvas ref={canvasRef} className="about-page__gradient" aria-hidden="true" />
      <div className="about-page__name-wrap">
        <AnimatedName progress={scrollProgress} />
      </div>
      <div className="about-page__menus">
        <div className="about-page__menu-wrap">
          <button
            type="button"
            className="about-page__menu-btn"
            onClick={() => { setActivityOpen((o) => !o); setNetworkOpen(false) }}
          >
            Activity
          </button>
          {activityOpen && (
            <div className="about-page__dropdown">
              <ul>
                <li>Road trip</li>
                <li>Local social events</li>
                <li>Hiking</li>
                <li>Meetups</li>
              </ul>
            </div>
          )}
        </div>
        <div className="about-page__menu-wrap">
          <button
            type="button"
            className="about-page__menu-btn"
            onClick={() => { setNetworkOpen((o) => !o); setActivityOpen(false) }}
          >
            Network
          </button>
          {networkOpen && (
            <div className="about-page__dropdown">
              <ul>
                <li>Work networking</li>
                <li>Business events</li>
                <li>Tech conferences</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="about-page__content">
        <h1 className="about-page__title">About</h1>
        <p className="about-page__bio">
          Software developer with a passion for building clean, user-focused applications.
          Experienced in full-stack development, UI/UX design, and cloud technologies.
        </p>
        <section className="about-page__section">
          <h2>Skills</h2>
          <ul>
            <li>JavaScript, TypeScript, React</li>
            <li>Node.js, Express</li>
            <li>CSS, Tailwind, Responsive Design</li>
            <li>Git, CI/CD</li>
          </ul>
        </section>
        <section className="about-page__section">
          <h2>Interests</h2>
          <p>Open source, web performance, accessibility, and exploring new technologies.</p>
        </section>
      </div>
    </div>
  )
}
