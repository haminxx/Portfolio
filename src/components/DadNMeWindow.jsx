import { useState, useRef, useCallback, useEffect } from 'react'
import './DadNMeWindow.css'

const SWF_URL = '/dadnme.swf'

export default function DadNMeWindow() {
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  const handleClickToPlay = useCallback(() => {
    if (typeof window === 'undefined') return
    setHasStarted(true)
  }, [])

  useEffect(() => {
    if (!hasStarted || typeof window === 'undefined') return
    const ruffle = window.RufflePlayer?.newest?.()
    if (!ruffle || !containerRef.current) return

    const player = ruffle.createPlayer()
    player.style.width = '100%'
    player.style.height = '100%'
    player.style.aspectRatio = '550 / 400'
    player.style.maxWidth = '550px'
    player.style.maxHeight = '400px'
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(player)

    player.ruffle().config = {
      scale: 'showAll',
      letterbox: 'on',
      autoplay: 'on',
    }
    player.ruffle().load(SWF_URL).catch((err) => {
      console.error('Dad n Me load error:', err)
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
      <div className="dadnme-window__container" style={{ aspectRatio: '550/400' }}>
        {!hasStarted ? (
          <button
            type="button"
            className="dadnme-window__overlay"
            onClick={handleClickToPlay}
          >
            <span className="dadnme-window__play-text">Click to Play</span>
          </button>
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
