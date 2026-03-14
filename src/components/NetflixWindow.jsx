import { useState, useRef, useEffect } from 'react'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import './NetflixWindow.css'

const ROWS = [
  { id: 'trending', title: 'My Top 5', count: 6 },
  { id: 'mylist', title: 'Movies', count: 6 },
  { id: 'continue', title: 'Anime', count: 5 },
  { id: 'popular', title: 'Recommended Watch List', count: 6 },
]

const WALTER_MITTY_SUMMARY = `A daydreamer escapes his anonymous life by disappearing into a world of fantasies filled with heroism, romance and action. When his job along with that of his co-worker are threatened, he takes action in the real world embarking on a global journey that turns into an adventure more extraordinary than anything he could have ever imagined.`

export default function NetflixWindow() {
  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    setIsMuted(true)
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

  return (
    <div className="netflix-window">
      <div className="netflix-window__hero">
        <video
          ref={videoRef}
          className="netflix-window__video"
          src="/videos/walter-mitty-trailer.mp4"
          autoPlay
          loop
          muted
          playsInline
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
                >
                  <div className="netflix-window__card-poster" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>
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
