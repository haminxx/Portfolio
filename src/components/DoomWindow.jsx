import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import './DoomWindow.css'

const DOOM_BUNDLE_URL = 'https://cdn.dos.zone/custom/dos/doom.jsdos'
const DOOM_FALLBACK_URL = 'https://dos.zone/doom-dec-1993'

export default function DoomWindow() {
  const containerRef = useRef(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof window.Dos !== 'function') {
      setError(true)
      return
    }
    try {
      if (window.emulators) {
        window.emulators.pathPrefix = 'https://cdn.jsdelivr.net/npm/js-dos@7.4.7/dist/'
      }
      window.Dos(el, {
        withNetworkingApi: false,
        withExperimentalApi: false,
      }).run(DOOM_BUNDLE_URL)
    } catch (err) {
      console.error('Doom init error:', err)
      setError(true)
    }
  }, [])

  if (error) {
    return (
      <div className="doom-window doom-window--fallback">
        <div className="doom-window__card">
          <div className="doom-window__icon" aria-hidden>DOOM</div>
          <h2 className="doom-window__title">DOOM (1993)</h2>
          <p className="doom-window__desc">
            Play classic DOOM in your browser.
          </p>
          <a
            href={DOOM_FALLBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="doom-window__play-btn"
          >
            <ExternalLink size={18} />
            Play DOOM
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="doom-window">
      <div ref={containerRef} className="doom-window__container" />
    </div>
  )
}
