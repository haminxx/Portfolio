import { useState, useRef, useEffect } from 'react'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import './NetflixWindow.css'

const WALTER_MITTY_SUMMARY = `A daydreamer escapes his anonymous life by disappearing into a world of fantasies filled with heroism, romance and action. When his job along with that of his co-worker are threatened, he takes action in the real world embarking on a global journey that turns into an adventure more extraordinary than anything he could have ever imagined.`

const ROWS = [
  { id: 'most-impactful', title: 'Most Impactful', count: 6 },
  { id: 'movies', title: 'Top 5 Movies', count: 6 },
  { id: 'tv', title: 'Top 5 TV Series', count: 6 },
  { id: 'anime', title: 'My Top 5 Animes', count: 5 },
  { id: 'recommended', title: 'Recommended Watch List', count: 6 },
]

export default function NetflixWindow() {
  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeNav, setActiveNav] = useState('home')
  const [hoverCard, setHoverCard] = useState(null)
  const [hoverRect, setHoverRect] = useState(null)
  const hoverTimerRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.preload = 'auto'
    video.load()
    video.play().catch(() => {})
  }, [])

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleMuteToggle = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleCardMouseEnter = (key, item, e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.()
    hoverTimerRef.current = setTimeout(() => {
      setHoverCard({ key, item })
      setHoverRect(rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null)
    }, 400)
  }

  const handleCardMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setHoverCard(null)
    setHoverRect(null)
  }

  useEffect(() => () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }, [])

  return (
    <div className="netflix-window">
      <nav className="netflix-window__nav">
        <div className="netflix-window__nav-logo">NETFLIX</div>
        <div className="netflix-window__nav-links">
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'home' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'movies' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('movies')}
          >
            Movies
          </button>
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'anime' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('anime')}
          >
            Anime
          </button>
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'tv' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('tv')}
          >
            TV Series
          </button>
        </div>
      </nav>
      <div className="netflix-window__hero">
        <video
          ref={videoRef}
          className="netflix-window__video"
          src="/videos/timeline-trailer.mp4"
          autoPlay
          loop
          playsInline
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <div className="netflix-window__hero-overlay" />
        <div className="netflix-window__hero-content">
          <div className="netflix-window__logo-wrap">
            <div className="netflix-window__logo">
              <span className="netflix-window__logo-line1">THE SECRET LIFE OF WALTER</span>
              <span className="netflix-window__logo-line2">MITTY</span>
            </div>
            <div className="netflix-window__hero-buttons">
              <button
                type="button"
                className="netflix-window__btn netflix-window__btn--play"
                onClick={handlePlayPause}
              >
                <Play size={20} fill="currentColor" />
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="netflix-window__btn netflix-window__btn--detail"
                onClick={() => setShowDetail(true)}
              >
                <Info size={20} />
                Detail
              </button>
            </div>
          </div>
          <button
            type="button"
            className="netflix-window__audio-btn"
            onClick={handleMuteToggle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
      </div>
      <main className="netflix-window__content">
        {ROWS.map((row) => (
          <section key={row.id} className="netflix-window__row">
            <h2 className="netflix-window__row-title">{row.title}</h2>
            <div className="netflix-window__cards">
              {Array.from({ length: row.count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="netflix-window__card"
                  onClick={() => setSelectedCard({ row: row.id, index: i })}
                  onMouseEnter={(e) => handleCardMouseEnter(row.id, { title: row.title }, e)}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="netflix-window__card-poster">
                    {row.id === 'most-impactful' && i === 0 && (
                      <span className="netflix-window__card-title-overlay">The Secret Life of Walter Mitty</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {hoverCard && (
        <div
          className="netflix-window__hover-popup"
          style={{
            pointerEvents: 'none',
            ...(hoverRect
              ? {
                  left: hoverRect.left,
                  top: hoverRect.top - 8,
                  transform: 'translateY(-100%)',
                  width: Math.min(320, Math.max(160, hoverRect.width * 1.2)),
                }
              : {
                  left: '50%',
                  top: 'auto',
                  bottom: 120,
                  transform: 'translateX(-50%)',
                  width: 320,
                }),
          }}
        >
          <div className="netflix-window__hover-video">
            <div className="netflix-window__hover-placeholder">
              <span>Trailer placeholder — add video URL</span>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div
          className="netflix-window__modal"
          role="dialog"
          aria-label="The Secret Life of Walter Mitty"
          onClick={() => setShowDetail(false)}
        >
          <div className="netflix-window__modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="netflix-window__modal-close"
              onClick={() => setShowDetail(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="netflix-window__modal-title">The Secret Life of Walter Mitty</h2>
            <p className="netflix-window__modal-summary">{WALTER_MITTY_SUMMARY}</p>
          </div>
        </div>
      )}
      {selectedCard && (
        <div
          className="netflix-window__modal"
          role="dialog"
          aria-label="Title details"
          onClick={() => setSelectedCard(null)}
        >
          <div className="netflix-window__modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="netflix-window__modal-close"
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="netflix-window__modal-placeholder">
              <p>Summary placeholder — add movies/TV via data array.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
