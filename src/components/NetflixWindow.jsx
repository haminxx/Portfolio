import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { useLanguage } from '../context/LanguageContext'
import { getFirebaseDb } from '../lib/firebase'
import './NetflixWindow.css'

const CATEGORIES = [
  { value: 'movie', key: 'categoryMovie' },
  { value: 'tv', key: 'categoryTV' },
  { value: 'anime', key: 'categoryAnime' },
  { value: 'other', key: 'categoryOther' },
]

const CATEGORY_KEYS = { movie: 'categoryMovie', tv: 'categoryTV', anime: 'categoryAnime', other: 'categoryOther' }

const WALTER_MITTY_SUMMARY = `A daydreamer escapes his anonymous life by disappearing into a world of fantasies filled with heroism, romance and action. When his job along with that of his co-worker are threatened, he takes action in the real world embarking on a global journey that turns into an adventure more extraordinary than anything he could have ever imagined.`

const ROW_KEYS = [
  { id: 'most-impactful', key: 'mostImpactful', count: 6 },
  { id: 'movies', key: 'top5Movies', count: 6 },
  { id: 'tv', key: 'top5TVSeries', count: 6 },
  { id: 'anime', key: 'myTop5Animes', count: 5 },
  { id: 'recommended', key: 'recommendedWatchList', count: 6 },
]

export default function NetflixWindow() {
  const { t } = useLanguage()
  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeNav, setActiveNav] = useState('home')
  const [hoverCard, setHoverCard] = useState(null)
  const [hoverRect, setHoverRect] = useState(null)
  const hoverTimerRef = useRef(null)
  const videoRef = useRef(null)
  const [recommendations, setRecommendations] = useState([])
  const [recommendForm, setRecommendForm] = useState({ title: '', category: 'movie' })
  const [submitStatus, setSubmitStatus] = useState(null)

  const fetchRecommendations = useCallback(async () => {
    const db = getFirebaseDb()
    if (!db) return
    try {
      const snap = await getDocs(collection(db, 'recommendations'))
      const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
      const counts = {}
      docs.forEach((doc) => {
        const key = `${doc.title}|${doc.category}`
        counts[key] = (counts[key] || 0) + 1
      })
      const top = Object.entries(counts)
        .map(([key, count]) => {
          const [title, category] = key.split('|')
          return { title, category, count }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      setRecommendations(top)
    } catch {
      setRecommendations([])
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const handleRecommendSubmit = async (e) => {
    e.preventDefault()
    const db = getFirebaseDb()
    if (!db) {
      setSubmitStatus('error')
      return
    }
    const title = recommendForm.title.trim()
    if (!title) return
    try {
      await addDoc(collection(db, 'recommendations'), {
        title,
        category: recommendForm.category,
        createdAt: serverTimestamp(),
      })
      setRecommendForm({ title: '', category: 'movie' })
      setSubmitStatus('success')
      fetchRecommendations()
      setTimeout(() => setSubmitStatus(null), 3000)
    } catch {
      setSubmitStatus('error')
    }
  }

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
            {t('netflix.home')}
          </button>
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'movies' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('movies')}
          >
            {t('netflix.movies')}
          </button>
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'anime' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('anime')}
          >
            {t('netflix.anime')}
          </button>
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'tv' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('tv')}
          >
            {t('netflix.tvSeries')}
          </button>
          <button
            type="button"
            className={`netflix-window__nav-link ${activeNav === 'recommend' ? 'netflix-window__nav-link--active' : ''}`}
            onClick={() => setActiveNav('recommend')}
          >
            {t('netflix.recommendMe')}
          </button>
        </div>
      </nav>
      {activeNav !== 'recommend' && (
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
                {isPlaying ? t('netflix.pause') : t('netflix.play')}
              </button>
              <button
                type="button"
                className="netflix-window__btn netflix-window__btn--detail"
                onClick={() => setShowDetail(true)}
              >
                <Info size={20} />
                {t('netflix.detail')}
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
      )}
      {activeNav === 'recommend' ? (
        <div className="netflix-window__recommend">
          <form className="netflix-window__recommend-form" onSubmit={handleRecommendSubmit}>
            <h2 className="netflix-window__recommend-title">{t('netflix.formTitle')}</h2>
            <label className="netflix-window__recommend-label">
              {t('netflix.titleLabel')}
              <input
                type="text"
                className="netflix-window__recommend-input"
                value={recommendForm.title}
                onChange={(e) => setRecommendForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. The Secret Life of Walter Mitty"
              />
            </label>
            <label className="netflix-window__recommend-label">
              {t('netflix.categoryLabel')}
              <select
                className="netflix-window__recommend-select"
                value={recommendForm.category}
                onChange={(e) => setRecommendForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{t(`netflix.${c.key}`)}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="netflix-window__btn netflix-window__btn--play">
              {t('netflix.submit')}
            </button>
            {submitStatus === 'success' && (
              <p className="netflix-window__recommend-success">{t('netflix.submitSuccess')}</p>
            )}
            {submitStatus === 'error' && (
              <p className="netflix-window__recommend-error">Firebase not configured. Add VITE_FIREBASE_* env vars.</p>
            )}
          </form>
          <section className="netflix-window__row">
            <h2 className="netflix-window__row-title">{t('netflix.recommendedWatchList')}</h2>
            <div className="netflix-window__cards netflix-window__cards--recommend">
              {recommendations.length ? (
                recommendations.map((r, i) => (
                  <div key={`${r.title}-${r.category}-${i}`} className="netflix-window__card netflix-window__card--recommend">
                    <div className="netflix-window__card-poster" />
                    <span className="netflix-window__card-title-overlay">{r.title}</span>
                    <span className="netflix-window__card-category">{t(`netflix.${CATEGORY_KEYS[r.category] || 'categoryOther'}`)}</span>
                    <span className="netflix-window__card-count">{r.count} {r.count === 1 ? 'vote' : 'votes'}</span>
                  </div>
                ))
              ) : (
                <p className="netflix-window__recommend-empty">No recommendations yet. Be the first!</p>
              )}
            </div>
          </section>
        </div>
      ) : (
      <main className="netflix-window__content">
        {ROW_KEYS.map((row) => (
          <section key={row.id} className="netflix-window__row">
            <h2 className="netflix-window__row-title">{t(`netflix.${row.key}`)}</h2>
            <div className={`netflix-window__cards ${row.id === 'recommended' ? 'netflix-window__cards--recommend' : ''}`}>
              {row.id === 'recommended' ? (
                recommendations.length ? (
                  recommendations.map((r, i) => (
                    <div key={`${r.title}-${r.category}-${i}`} className="netflix-window__card netflix-window__card--recommend">
                      <div className="netflix-window__card-poster" />
                      <span className="netflix-window__card-title-overlay">{r.title}</span>
                      <span className="netflix-window__card-category">{t(`netflix.${CATEGORY_KEYS[r.category] || 'categoryOther'}`)}</span>
                      <span className="netflix-window__card-count">{r.count} {r.count === 1 ? 'vote' : 'votes'}</span>
                    </div>
                  ))
                ) : (
                  Array.from({ length: row.count }, (_, i) => (
                    <div key={i} className="netflix-window__card netflix-window__card--recommend">
                      <div className="netflix-window__card-poster" />
                      <span className="netflix-window__card-title-overlay">—</span>
                    </div>
                  ))
                )
              ) : (
                Array.from({ length: row.count }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className="netflix-window__card"
                    onClick={() => setSelectedCard({ row: row.id, index: i })}
                    onMouseEnter={(e) => handleCardMouseEnter(row.id, { title: t(`netflix.${row.key}`) }, e)}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className="netflix-window__card-poster">
                      {row.id === 'most-impactful' && i === 0 && (
                        <span className="netflix-window__card-title-overlay">The Secret Life of Walter Mitty</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        ))}
      </main>
      )}

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
              aria-label={t('netflix.close')}
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
              aria-label={t('netflix.close')}
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
