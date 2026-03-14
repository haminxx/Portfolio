import { useState, useRef, useEffect } from 'react'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import './NetflixWindow.css'

const WALTER_MITTY_SUMMARY = `A daydreamer escapes his anonymous life by disappearing into a world of fantasies filled with heroism, romance and action. When his job along with that of his co-worker are threatened, he takes action in the real world embarking on a global journey that turns into an adventure more extraordinary than anything he could have ever imagined.`

const MOST_IMPACTFUL = [
  { title: 'The Secret Life of Walter Mitty', poster: '/videos/timeline-trailer.mp4' },
  { title: 'Title 2', poster: null },
  { title: 'Title 3', poster: null },
  { title: 'Title 4', poster: null },
  { title: 'Title 5', poster: null },
]

const TOP_5_MOVIES = [
  { title: 'Movie 1', trailerUrl: null },
  { title: 'Movie 2', trailerUrl: null },
  { title: 'Movie 3', trailerUrl: null },
  { title: 'Movie 4', trailerUrl: null },
  { title: 'Movie 5', trailerUrl: null },
]

const TOP_5_TV_SERIES = [
  { title: 'TV Series 1', trailerUrl: null },
  { title: 'TV Series 2', trailerUrl: null },
  { title: 'TV Series 3', trailerUrl: null },
  { title: 'TV Series 4', trailerUrl: null },
  { title: 'TV Series 5', trailerUrl: null },
]

const MY_TOP_5_ANIMES = [
  { title: 'Anime 1', trailerUrl: null },
  { title: 'Anime 2', trailerUrl: null },
  { title: 'Anime 3', trailerUrl: null },
  { title: 'Anime 4', trailerUrl: null },
  { title: 'Anime 5', trailerUrl: null },
]

const RECOMMENDED = Array.from({ length: 6 }, (_, i) => ({ title: `Recommended ${i + 1}` }))

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'movies', label: 'Movies' },
  { id: 'anime', label: 'Anime' },
  { id: 'tv', label: 'TV Series' },
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
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`netflix-window__nav-link ${activeNav === item.id ? 'netflix-window__nav-link--active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              {item.label}
            </button>
          ))}
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
        <section className="netflix-window__row netflix-window__row--top5">
          <h2 className="netflix-window__row-title">Most Impactful</h2>
          <div className="netflix-window__top5-cards">
            {MOST_IMPACTFUL.map((item, i) => (
              <div key={i} className="netflix-window__top5-item">
                <span className="netflix-window__top5-num">{i + 1}</span>
                <button
                  type="button"
                  className="netflix-window__card netflix-window__card--vertical"
                  onClick={() => setSelectedCard({ key: 'most-impactful', index: i, item })}
                  onMouseEnter={(e) => handleCardMouseEnter('most-impactful', item, e)}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="netflix-window__card-poster">
                    {i === 0 && (
                      <span className="netflix-window__card-title-overlay">The Secret Life of Walter Mitty</span>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="netflix-window__row netflix-window__row--top5">
          <h2 className="netflix-window__row-title">Top 5 Movies</h2>
          <div className="netflix-window__top5-cards">
            {TOP_5_MOVIES.map((item, i) => (
              <div key={i} className="netflix-window__top5-item">
                <span className="netflix-window__top5-num">{i + 1}</span>
                <button
                  type="button"
                  className="netflix-window__card netflix-window__card--vertical"
                  onClick={() => setSelectedCard({ key: 'movies', index: i, item })}
                  onMouseEnter={(e) => handleCardMouseEnter('movies', item, e)}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="netflix-window__card-poster" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="netflix-window__row netflix-window__row--top5">
          <h2 className="netflix-window__row-title">Top 5 TV Series</h2>
          <div className="netflix-window__top5-cards">
            {TOP_5_TV_SERIES.map((item, i) => (
              <div key={i} className="netflix-window__top5-item">
                <span className="netflix-window__top5-num">{i + 1}</span>
                <button
                  type="button"
                  className="netflix-window__card netflix-window__card--vertical"
                  onClick={() => setSelectedCard({ key: 'tv', index: i, item })}
                  onMouseEnter={(e) => handleCardMouseEnter('tv', item, e)}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="netflix-window__card-poster" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="netflix-window__row netflix-window__row--top5">
          <h2 className="netflix-window__row-title">My Top 5 Animes</h2>
          <div className="netflix-window__top5-cards">
            {MY_TOP_5_ANIMES.map((item, i) => (
              <div key={i} className="netflix-window__top5-item">
                <span className="netflix-window__top5-num">{i + 1}</span>
                <button
                  type="button"
                  className="netflix-window__card netflix-window__card--vertical"
                  onClick={() => setSelectedCard({ key: 'anime', index: i, item })}
                  onMouseEnter={(e) => handleCardMouseEnter('anime', item, e)}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="netflix-window__card-poster" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="netflix-window__row">
          <h2 className="netflix-window__row-title">Recommended Watch List</h2>
          <div className="netflix-window__cards netflix-window__cards--horizontal">
            {RECOMMENDED.map((item, i) => (
              <button
                key={i}
                type="button"
                className="netflix-window__card netflix-window__card--horizontal"
                onClick={() => setSelectedCard({ key: 'recommended', index: i, item })}
                onMouseEnter={(e) => handleCardMouseEnter('recommended', item, e)}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="netflix-window__card-poster" />
              </button>
            ))}
          </div>
        </section>
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
            {hoverCard.item?.trailerUrl || hoverCard.item?.poster ? (
              <video
                src={hoverCard.item.trailerUrl || hoverCard.item.poster}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="netflix-window__hover-placeholder">
                <span>Trailer placeholder — add video URL</span>
              </div>
            )}
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
              <p>{selectedCard.item?.title ?? 'Summary placeholder — add movies/TV via data array.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
