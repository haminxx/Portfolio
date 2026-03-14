import { useState, useRef, useCallback, useEffect } from 'react'
import './DadNMeWindow.css'

const SWF_URL = '/dadnme.swf'

export default function DadNMeWindow() {
  const [hasStarted, setHasStarted] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  const handleClickToPlay = useCallback(() => {
    if (typeof window === 'undefined') return
    setHasStarted(true)
    setLoadError(false)
  }, [])

  useEffect(() => {
    if (!hasStarted || typeof window === 'undefined') return
    const ruffle = window.RufflePlayer?.newest?.()
    if (!ruffle || !containerRef.current) return

    const player = ruffle.createPlayer()
    player.style.width = '100%'
    player.style.height = '100%'
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(player)

    player.ruffle().config = {
      scale: 'showAll',
      letterbox: 'on',
      autoplay: 'on',
    }
    player.ruffle()
      .load(SWF_URL)
      .catch((err) => {
        console.error('Dad n Me load error:', err)
        setLoadError(true)
      })
    playerRef.current = player

    return () => {
      if (playerRef.current && playerRef.current.parentNode) {
        playerRef.current.parentNode.removeChild(playerRef.current)
      }
      playerRef.current = null
    }
  }, [hasStarted])

  return (
    <div className="dadnme-window">
      <div className="dadnme-window__container">
        {!hasStarted ? (
          <button
            type="button"
            className="dadnme-window__overlay"
            onClick={handleClickToPlay}
          >
            <span className="dadnme-window__play-text">Click to Play</span>
          </button>
        ) : loadError ? (
          <div className="dadnme-window__error">
            <p className="dadnme-window__error-title">Game file not found</p>
            <p className="dadnme-window__error-msg">
              Please add dadnme.swf to the public folder. The game &quot;Dad &#39;n Me&quot; by The Behemoth can be played via Ruffle when a valid SWF file is provided.
            </p>
            <a
              href="https://thebehemoth.com/games/dad-n-me/"
              target="_blank"
              rel="noopener noreferrer"
              className="dadnme-window__error-link"
            >
              Learn more about Dad &#39;n Me
            </a>
          </div>
        ) : (
          <div ref={containerRef} className="dadnme-window__player" />
        )}
      </div>
      <p className="dadnme-window__caption">
        Original game by The Behemoth. Powered by Ruffle.
      </p>
    </div>
  )
}
