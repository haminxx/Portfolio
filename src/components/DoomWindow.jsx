import { useEffect, useRef, useState, useCallback } from 'react'
import { ExternalLink, RotateCcw } from 'lucide-react'
import './DoomWindow.css'

// Use proxy in dev (avoids CORS); in production use self-hosted /doom.jsdos (add to public/)
const DOOM_BUNDLE_URL = import.meta.env.DEV
  ? '/api/dos-proxy/custom/dos/doom.jsdos'
  : '/doom.jsdos'
const DOOM_FALLBACK_URL = 'https://dos.zone/doom-dec-1993'

export default function DoomWindow() {
  const containerRef = useRef(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const runDoom = useCallback(() => {
    const el = containerRef.current
    if (!el || typeof window.Dos !== 'function') {
      setError(true)
      return
    }
    try {
      if (window.emulators) {
        window.emulators.pathPrefix = 'https://cdn.jsdelivr.net/npm/js-dos@7.4.7/dist/'
      }
      setError(false)
      window.Dos(el, {
        withNetworkingApi: false,
        withExperimentalApi: false,
      })
        .run(DOOM_BUNDLE_URL)
        .catch((err) => {
          console.error('Doom init error:', err)
          setError(true)
        })
    } catch (err) {
      console.error('Doom init error:', err)
      setError(true)
    }
  }, [])

  useEffect(() => {
    runDoom()
  }, [runDoom, retryKey])

  const handleRetry = useCallback(() => {
    setError(false)
    setRetryKey((k) => k + 1)
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
          <div className="doom-window__actions">
            <button
              type="button"
              className="doom-window__play-btn doom-window__play-btn--retry"
              onClick={handleRetry}
            >
              <RotateCcw size={18} />
              Retry
            </button>
            <a
              href={DOOM_FALLBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="doom-window__play-btn doom-window__play-btn--link"
            >
              <ExternalLink size={18} />
              Play on dos.zone
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="doom-window">
      <div key={retryKey} ref={containerRef} className="doom-window__container" />
    </div>
  )
}
