import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Info, Volume2, VolumeX, Star } from 'lucide-react'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { useLanguage } from '../context/LanguageContext'
import { getFirebaseDb } from '../lib/firebase'
import {
  fetchTMDBTrending,
  fetchTMDBDiscover,
  fetchTMDBDetails,
  getTMDBPosterUrl,
  getTMDBBackdropUrl,
  getTrailerKey,
  hasTMDBKey,
} from '../lib/tmdb'
import NetflixMonochromeCarousel from './netflix/NetflixMonochromeCarousel'
import './NetflixWindow.css'

const CATEGORIES = [
  { value: 'movie', key: 'categoryMovie' },
  { value: 'tv', key: 'categoryTV' },
  { value: 'anime', key: 'categoryAnime' },
  { value: 'other', key: 'categoryOther' },
]

const CATEGORY_KEYS = { movie: 'categoryMovie', tv: 'categoryTV', anime: 'categoryAnime', other: 'categoryOther' }

const WALTER_MITTY_SUMMARY = `A daydreamer escapes his anonymous life by disappearing into a world of fantasies filled with heroism, romance and action. When his job along with that of his co-worker are threatened, he takes action in the real world embarking on a global journey that turns into an adventure more extraordinary than anything he could have ever imagined.`

// Placeholder skeleton cards when TMDB key is absent
function SkeletonCards({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="netflix-window__card netflix-window__card--skeleton">
      <div className="netflix-window__card-poster netflix-window__card-poster--empty" />
    </div>
  ))
}

// Single card with TMDB poster
function TMDBCard({ item, onSelect, onHoverEnter, onHoverLeave }) {
  const poster = getTMDBPosterUrl(item.poster_path, 'w342')
  const title = item.title || item.name || 'Untitled'
  return (
    <button
      type="button"
      className="netflix-window__card"
      onClick={() => onSelect(item)}
      onMouseEnter={(e) => onHoverEnter(item, e)}
      onMouseLeave={onHoverLeave}
    >
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="netflix-window__card-img"
          loading="lazy"
        />
      ) : (
        <div className="netflix-window__card-poster netflix-window__card-poster--empty">
          <span className="netflix-window__card-title-overlay">{title}</span>
        </div>
      )}
      {item.vote_average > 0 && (
        <span className="netflix-window__card-rating">
          <Star size={9} fill="currentColor" />
          {item.vote_average.toFixed(1)}
        </span>
      )}
    </button>
  )
}

export default function NetflixWindow() {
  const { t } = useLanguage()
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeNav, setActiveNav] = useState('home')
  const [hoverItem, setHoverItem] = useState(null)
  const [hoverRect, setHoverRect] = useState(null)
  const hoverTimerRef = useRef(null)
  const videoRef = useRef(null)
  const [recommendations, setRecommendations] = useState([])
  const [recommendForm, setRecommendForm] = useState({ title: '', category: 'movie' })
  const [submitStatus, setSubmitStatus] = useState(null)

  // TMDB data rows
  const [tmdbRows, setTmdbRows] = useState({
    trending: [],
    movies: [],
    tv: [],
    anime: [],
  })
  const [tmdbLoading, setTmdbLoading] = useState(false)
  const tmdbFetched = useRef(false)

  const fetchTMDBRows = useCallback(async () => {
    if (tmdbFetched.current || !hasTMDBKey()) return
    tmdbFetched.current = true
    setTmdbLoading(true)
    const [trending, movies, tv, anime] = await Promise.all([
      fetchTMDBTrending('all', 'week'),
      fetchTMDBTrending('movie', 'week'),
      fetchTMDBTrending('tv', 'week'),
      fetchTMDBDiscover(16, 'tv'), // genre 16 = Animation
    ])
    setTmdbRows({ trending, movies, tv, anime })
    setTmdbLoading(false)
  }, [])

  useEffect(() => { fetchTMDBRows() }, [fetchTMDBRows])

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

  useEffect(() => { fetchRecommendations() }, [fetchRecommendations])

  const handleRecommendSubmit = async (e) => {
    e.preventDefault()
    const db = getFirebaseDb()
    if (!db) { setSubmitStatus('error'); return }
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
    video.muted = true
    const kick = () => { video.play().catch(() => {}) }
    video.addEventListener('loadeddata', kick)
    video.addEventListener('canplay', kick)
    video.load()
    kick()
    return () => {
      video.removeEventListener('loadeddata', kick)
      video.removeEventListener('canplay', kick)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (video) video.muted = isMuted
  }, [isMuted])

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play(); setIsPlaying(true) }
    else { video.pause(); setIsPlaying(false) }
  }

  const handleMuteToggle = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleCardHoverEnter = (item, e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.()
    hoverTimerRef.current = setTimeout(() => {
      setHoverItem(item)
      setHoverRect(rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null)
    }, 500)
  }

  const handleCardHoverLeave = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
    setHoverItem(null)
    setHoverRect(null)
  }

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current) }, [])

  const handleSelectItem = async (item) => {
    setSelectedItem(item)
    setSelectedDetail(null)
    // Fetch full details with trailers
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie')
    const detail = await fetchTMDBDetails(item.id, mediaType)
    setSelectedDetail(detail)
  }

  // Determine rows based on active nav
  const rows = (() => {
    if (activeNav === 'movies') return [{ label: t('netflix.top5Movies'), items: tmdbRows.movies }]
    if (activeNav === 'tv') return [{ label: t('netflix.top5TVSeries'), items: tmdbRows.tv }]
    if (activeNav === 'anime') return [{ label: t('netflix.myTop5Animes'), items: tmdbRows.anime }]
    // home — show all rows
    return [
      { label: t('netflix.mostImpactful'), items: tmdbRows.trending },
      { label: t('netflix.top5Movies'), items: tmdbRows.movies },
      { label: t('netflix.top5TVSeries'), items: tmdbRows.tv },
      { label: t('netflix.myTop5Animes'), items: tmdbRows.anime },
      { label: t('netflix.recommendedWatchList'), items: [], isRecommend: true },
    ]
  })()

  return (
    <div className="netflix-window">
      <nav className="netflix-window__nav">
        <div className="netflix-window__nav-logo">NETFLIX</div>
        <div className="netflix-window__nav-links">
          {['home', 'movies', 'anime', 'tv', 'recommend', 'collection'].map((nav) => (
            <button
              key={nav}
              type="button"
              className={`netflix-window__nav-link ${activeNav === nav ? 'netflix-window__nav-link--active' : ''}`}
              onClick={() => setActiveNav(nav)}
            >
              {nav === 'home' ? t('netflix.home')
                : nav === 'movies' ? t('netflix.movies')
                : nav === 'anime' ? t('netflix.anime')
                : nav === 'tv' ? t('netflix.tvSeries')
                : nav === 'recommend' ? t('netflix.recommendMe')
                : 'Collection'}
            </button>
          ))}
        </div>
        {!hasTMDBKey() && activeNav !== 'recommend' && activeNav !== 'collection' && (
          <span className="netflix-window__tmdb-hint">Add VITE_TMDB_API_KEY for real content</span>
        )}
      </nav>

      {activeNav === 'collection' && <NetflixMonochromeCarousel />}

      {activeNav !== 'collection' && activeNav !== 'recommend' && (
        <div className="netflix-window__hero">
          <video
            ref={videoRef}
            className="netflix-window__video"
            src="/videos/timeline-trailer.mp4"
            autoPlay
            muted={isMuted}
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
                <button type="button" className="netflix-window__btn netflix-window__btn--play" onClick={handlePlayPause}>
                  <Play size={20} fill="currentColor" />
                  {isPlaying ? t('netflix.pause') : t('netflix.play')}
                </button>
                <button type="button" className="netflix-window__btn netflix-window__btn--detail" onClick={() => setShowDetail(true)}>
                  <Info size={20} />
                  {t('netflix.detail')}
                </button>
              </div>
            </div>
            <button type="button" className="netflix-window__audio-btn" onClick={handleMuteToggle} aria-label={isMuted ? 'Unmute' : 'Mute'}>
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
            <button type="submit" className="netflix-window__btn netflix-window__btn--play">{t('netflix.submit')}</button>
            {submitStatus === 'success' && <p className="netflix-window__recommend-success">{t('netflix.submitSuccess')}</p>}
            {submitStatus === 'error' && <p className="netflix-window__recommend-error">Firebase not configured. Add VITE_FIREBASE_* env vars.</p>}
          </form>
          <section className="netflix-window__row">
            <h2 className="netflix-window__row-title">{t('netflix.recommendedWatchList')}</h2>
            <div className="netflix-window__cards netflix-window__cards--recommend">
              {recommendations.length ? (
                recommendations.map((r, i) => (
                  <div key={`${r.title}-${i}`} className="netflix-window__card netflix-window__card--recommend">
                    <div className="netflix-window__card-poster netflix-window__card-poster--empty" />
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
      ) : activeNav !== 'collection' ? (
        <main className="netflix-window__content">
          {rows.map((row) => (
            <section key={row.label} className="netflix-window__row">
              <h2 className="netflix-window__row-title">{row.label}</h2>
              <div className={`netflix-window__cards ${row.isRecommend ? 'netflix-window__cards--recommend' : ''}`}>
                {row.isRecommend ? (
                  recommendations.length ? (
                    recommendations.map((r, i) => (
                      <div key={`${r.title}-${i}`} className="netflix-window__card netflix-window__card--recommend">
                        <div className="netflix-window__card-poster netflix-window__card-poster--empty" />
                        <span className="netflix-window__card-title-overlay">{r.title}</span>
                        <span className="netflix-window__card-category">{t(`netflix.${CATEGORY_KEYS[r.category] || 'categoryOther'}`)}</span>
                        <span className="netflix-window__card-count">{r.count} {r.count === 1 ? 'vote' : 'votes'}</span>
                      </div>
                    ))
                  ) : (
                    <p className="netflix-window__recommend-empty">Submit recommendations via the "Recommend Me" tab.</p>
                  )
                ) : tmdbLoading || (!hasTMDBKey() && row.items.length === 0) ? (
                  <SkeletonCards count={6} />
                ) : row.items.length > 0 ? (
                  row.items.slice(0, 12).map((item) => (
                    <TMDBCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectItem}
                      onHoverEnter={handleCardHoverEnter}
                      onHoverLeave={handleCardHoverLeave}
                    />
                  ))
                ) : (
                  <SkeletonCards count={6} />
                )}
              </div>
            </section>
          ))}
        </main>
      ) : null}

      {/* Hover popup with backdrop */}
      {hoverItem && hoverRect && (
        <div
          className="netflix-window__hover-popup"
          style={{
            left: Math.min(hoverRect.left, window.innerWidth - 320 - 16),
            top: hoverRect.top - 8,
            transform: 'translateY(-100%)',
            width: Math.min(320, Math.max(160, hoverRect.width * 1.2)),
            pointerEvents: 'none',
          }}
        >
          {getTMDBBackdropUrl(hoverItem.backdrop_path) ? (
            <img
              src={getTMDBBackdropUrl(hoverItem.backdrop_path, 'w300')}
              alt=""
              className="netflix-window__hover-backdrop"
            />
          ) : (
            <div className="netflix-window__hover-video">
              <div className="netflix-window__hover-placeholder">
                <span>{hoverItem.title || hoverItem.name || '...'}</span>
              </div>
            </div>
          )}
          <div className="netflix-window__hover-info">
            <span className="netflix-window__hover-title">{hoverItem.title || hoverItem.name}</span>
            {hoverItem.vote_average > 0 && (
              <span className="netflix-window__hover-rating">
                <Star size={10} fill="currentColor" /> {hoverItem.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Walter Mitty detail modal */}
      {showDetail && (
        <div className="netflix-window__modal" role="dialog" onClick={() => setShowDetail(false)}>
          <div className="netflix-window__modal-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="netflix-window__modal-close" onClick={() => setShowDetail(false)}>×</button>
            <h2 className="netflix-window__modal-title">The Secret Life of Walter Mitty</h2>
            <p className="netflix-window__modal-summary">{WALTER_MITTY_SUMMARY}</p>
          </div>
        </div>
      )}

      {/* TMDB item detail modal */}
      {selectedItem && (
        <div className="netflix-window__modal" role="dialog" onClick={() => { setSelectedItem(null); setSelectedDetail(null) }}>
          <div className="netflix-window__modal-inner netflix-window__modal-inner--tmdb" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="netflix-window__modal-close"
              onClick={() => { setSelectedItem(null); setSelectedDetail(null) }}
              aria-label={t('netflix.close')}
            >×</button>
            {/* Backdrop */}
            {getTMDBBackdropUrl(selectedItem.backdrop_path) && (
              <div className="netflix-window__modal-backdrop">
                <img src={getTMDBBackdropUrl(selectedItem.backdrop_path, 'w780')} alt="" />
                <div className="netflix-window__modal-backdrop-fade" />
              </div>
            )}
            <div className="netflix-window__modal-body">
              {getTMDBPosterUrl(selectedItem.poster_path) && (
                <img
                  src={getTMDBPosterUrl(selectedItem.poster_path, 'w185')}
                  alt=""
                  className="netflix-window__modal-poster"
                />
              )}
              <div className="netflix-window__modal-text">
                <h2 className="netflix-window__modal-title">
                  {selectedItem.title || selectedItem.name}
                </h2>
                <div className="netflix-window__modal-meta">
                  {selectedItem.release_date?.slice(0, 4) || selectedItem.first_air_date?.slice(0, 4)}
                  {selectedItem.vote_average > 0 && (
                    <span className="netflix-window__modal-rating">
                      <Star size={12} fill="#f5c518" color="#f5c518" /> {selectedItem.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="netflix-window__modal-summary">
                  {selectedItem.overview || 'No description available.'}
                </p>
                {selectedDetail && (
                  <>
                    {selectedDetail.genres?.length > 0 && (
                      <div className="netflix-window__modal-genres">
                        {selectedDetail.genres.map((g) => (
                          <span key={g.id} className="netflix-window__modal-genre-tag">{g.name}</span>
                        ))}
                      </div>
                    )}
                    {getTrailerKey(selectedDetail.videos) && (
                      <a
                        href={`https://www.youtube.com/watch?v=${getTrailerKey(selectedDetail.videos)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="netflix-window__btn netflix-window__btn--play netflix-window__modal-trailer-btn"
                      >
                        <Play size={16} fill="currentColor" /> Watch Trailer
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
