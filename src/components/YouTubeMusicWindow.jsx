import { useState, useEffect, useCallback, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useMusicPlayer, searchYouTubeVideos, fetchRecommendedFromListening } from '../context/MusicPlayerContext'
import NowPlayingBar from './NowPlayingBar'
import './YouTubeMusicWindow.css'

const API_URL = import.meta.env.VITE_API_URL || ''
const HAS_YT_KEY = Boolean(import.meta.env.VITE_YOUTUBE_API_KEY)

const EXPLORE_GENRES = [
  { label: 'Pop', query: 'top pop music 2025' },
  { label: 'Rock', query: 'best rock songs 2025' },
  { label: 'K-Pop', query: 'kpop hits 2025' },
  { label: 'Hip-Hop', query: 'hip hop rap 2025' },
  { label: 'Lo-Fi', query: 'lofi hip hop chill beats' },
  { label: 'Indie', query: 'indie music 2025' },
  { label: 'J-Pop', query: 'jpop hits 2025' },
  { label: 'Electronic', query: 'electronic dance music 2025' },
]

const HISTORY_KEY = 'ytm-listen-history'

function loadListenHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const REBEL_FALLBACK = {
  title: 'Rebel',
  subtitle: 'Rock anthems',
  items: [
    { title: 'Moon on the Water', artist: 'Beat Crusaders', videoId: 'KFyiHJz502E' },
    { title: 'City of God', artist: 'Idaho', videoId: null },
    { title: "Don't Look Back in Anger", artist: 'Oasis', videoId: 'r8OipmKFDeM' },
    { title: 'Wonderwall', artist: 'Oasis', videoId: 'vU05Eksc_iM' },
    { title: 'Judas Syndrome', artist: 'Old English Sheep Dog', videoId: null },
  ],
}

export default function YouTubeMusicWindow() {
  const { t } = useLanguage()
  const { playTrack } = useMusicPlayer()
  const [curated, setCurated] = useState(null)
  const [recommendedForYou, setRecommendedForYou] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [view, setView] = useState('home')
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  // Explore tab state
  const [exploreGenre, setExploreGenre] = useState(null)
  const [exploreResults, setExploreResults] = useState([])
  const [exploreLoading, setExploreLoading] = useState(false)
  // Library tab state
  const [listenHistory, setListenHistory] = useState(loadListenHistory)

  const baseUrl = API_URL.replace(/\/$/, '')

  const fetchCurated = useCallback(async () => {
    if (!baseUrl) {
      setCurated([
        REBEL_FALLBACK,
        { title: 'Quick picks', subtitle: 'Based on your listening', items: [] },
        { title: 'Recommended for you', subtitle: null, items: [] },
      ])
      return
    }
    try {
      const res = await fetch(`${baseUrl}/api/ytmusic/curated`)
      if (res.ok) {
        const data = await res.json()
        setCurated(data.sections || [])
      } else {
        setCurated([])
      }
    } catch {
      setCurated([])
    }
  }, [baseUrl])

  const loadPersonalized = useCallback(async () => {
    if (!HAS_YT_KEY) {
      setRecommendedForYou([])
      return
    }
    try {
      const items = await fetchRecommendedFromListening(20)
      setRecommendedForYou(items)
    } catch {
      setRecommendedForYou([])
    }
  }, [])

  const fetchSearch = useCallback(
    async (q) => {
      if (!q.trim()) {
        setSearchResults(null)
        return
      }
      setSearchLoading(true)
      try {
        if (HAS_YT_KEY) {
          const items = await searchYouTubeVideos(q)
          setSearchResults(items)
          setSearchLoading(false)
          return
        }
        if (!baseUrl) {
          setSearchResults([])
          setSearchLoading(false)
          return
        }
        let res = await fetch(`${baseUrl}/api/youtube/search?q=${encodeURIComponent(q)}`)
        if (res.status === 503) {
          res = await fetch(`${baseUrl}/api/ytmusic/search?q=${encodeURIComponent(q)}`)
        }
        if (res.ok) {
          const data = await res.json()
          const items = (data.items || []).map((item) => ({
            ...item,
            videoId: item.videoId ?? item.id,
            url: item.url ?? (item.videoId || item.id ? `https://www.youtube.com/watch?v=${item.videoId || item.id}` : null),
            artist: item.artist ?? item.channelTitle,
          }))
          setSearchResults(items)
        } else {
          setSearchResults([])
        }
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    },
    [baseUrl]
  )

  useEffect(() => {
    fetchCurated()
  }, [fetchCurated])

  useEffect(() => {
    loadPersonalized()
  }, [loadPersonalized])

  useEffect(() => {
    const timer = setTimeout(() => fetchSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchSearch])

  const showSearch = searchQuery.trim().length > 0
  const sections = curated || []

  const handlePlayTrack = useCallback(
    (videoId, item = null) => {
      if (!videoId) return
      playTrack(videoId, item || { title: 'Unknown', artist: '', thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` })
      loadPersonalized()
    },
    [playTrack, loadPersonalized]
  )

  const fetchExploreGenre = useCallback(async (genre) => {
    setExploreGenre(genre.label)
    setExploreLoading(true)
    setExploreResults([])
    try {
      if (HAS_YT_KEY) {
        const items = await searchYouTubeVideos(genre.query)
        setExploreResults(items)
      } else if (baseUrl) {
        const res = await fetch(`${baseUrl}/api/youtube/search?q=${encodeURIComponent(genre.query)}`)
        if (res.ok) {
          const data = await res.json()
          setExploreResults((data.items || []).map((item) => ({
            ...item,
            videoId: item.videoId ?? item.id,
            artist: item.artist ?? item.channelTitle,
          })))
        }
      }
    } catch {
      setExploreResults([])
    } finally {
      setExploreLoading(false)
    }
  }, [baseUrl])

  // Reload history when view switches to library
  useEffect(() => {
    if (view === 'library') setListenHistory(loadListenHistory())
  }, [view])

  const handleClearHistory = useCallback(() => {
    try { localStorage.removeItem(HISTORY_KEY) } catch {}
    setListenHistory([])
  }, [])

  // Stats for library view
  const libraryStats = useMemo(() => {
    if (!listenHistory.length) return null
    const artistCounts = {}
    for (const h of listenHistory) {
      if (h.artist) artistCounts[h.artist] = (artistCounts[h.artist] || 0) + 1
    }
    const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]
    return { total: listenHistory.length, topArtist: topArtist?.[0] ?? null }
  }, [listenHistory])

  const mainContent = (
    <>
      <div className="ytmusic-window__search-bar">
        <input
          type="text"
          placeholder={t('ytmusic.searchPlaceholder')}
          className="ytmusic-window__search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showSearch ? (
        <section className="ytmusic-window__section">
          <h2 className="ytmusic-window__section-title">
            {t('ytmusic.searchResults')} {searchLoading && `(${t('ytmusic.loading')})`}
          </h2>
          <div className="ytmusic-window__grid">
            {searchLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="ytmusic-window__card ytmusic-window__card--loading">
                  <div className="ytmusic-window__card-art" />
                  <span className="ytmusic-window__card-title">...</span>
                </div>
              ))
            ) : searchResults?.length ? (
              searchResults.map((item, i) => (
                <button
                  key={item.videoId || i}
                  type="button"
                  className="ytmusic-window__card"
                  onClick={() => (item.videoId || item.id) && handlePlayTrack(item.videoId || item.id, { title: item.title, artist: item.artist, thumbnail: item.thumbnail })}
                >
                  <div className="ytmusic-window__card-art">
                    {item.thumbnail && <img src={item.thumbnail} alt="" className="ytmusic-window__card-img" />}
                  </div>
                  <span className="ytmusic-window__card-title">{item.title}</span>
                  <span className="ytmusic-window__card-artist">{item.artist}</span>
                </button>
              ))
            ) : (
              <p className="ytmusic-window__empty">{t('ytmusic.noResults')}</p>
            )}
          </div>
        </section>
      ) : selectedAlbum ? (
        <section className="ytmusic-window__album-view">
          <button type="button" className="ytmusic-window__back-btn" onClick={() => setSelectedAlbum(null)}>
            ← {t('ytmusic.back')}
          </button>
          <h2 className="ytmusic-window__album-title">{selectedAlbum.title}</h2>
          <p className="ytmusic-window__album-subtitle">{selectedAlbum.subtitle || t('ytmusic.yourMusic')}</p>
          <ul className="ytmusic-window__song-list">
            {(selectedAlbum.items || []).map((item, i) => (
              <li key={i} className="ytmusic-window__song-item">
                <button
                  type="button"
                  className="ytmusic-window__song-row"
                  onClick={() => item.videoId && handlePlayTrack(item.videoId, { title: item.title, artist: item.artist, thumbnail: `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg` })}
                  disabled={!item.videoId}
                >
                  <span className="ytmusic-window__song-play">{item.videoId ? '▶' : '—'}</span>
                  <span className="ytmusic-window__song-title">{item.title}</span>
                  <span className="ytmusic-window__song-artist">{item.artist}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {recommendedForYou && recommendedForYou.length > 0 && view === 'home' && (
            <section className="ytmusic-window__section ytmusic-window__section--rail">
              <h2 className="ytmusic-window__section-title">Recommended for you</h2>
              <p className="ytmusic-window__section-sub">Based on what you have played</p>
              <div className="ytmusic-window__rail">
                {recommendedForYou.map((item, i) => (
                  <button
                    key={`${item.videoId}-${i}`}
                    type="button"
                    className="ytmusic-window__card ytmusic-window__card--rail"
                    onClick={() => handlePlayTrack(item.videoId, item)}
                  >
                    <div className="ytmusic-window__card-art">
                      {item.thumbnail && <img src={item.thumbnail} alt="" className="ytmusic-window__card-img" />}
                    </div>
                    <span className="ytmusic-window__card-title">{item.title}</span>
                    <span className="ytmusic-window__card-artist">{item.artist}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {sections[0] && view === 'home' && (
            <button
              type="button"
              className="ytmusic-window__hero"
              onClick={() => setSelectedAlbum(sections[0])}
            >
              <div className="ytmusic-window__hero-art">
                <div className="ytmusic-window__play-circle">
                  <span className="ytmusic-window__play-icon">▶</span>
                </div>
              </div>
              <div className="ytmusic-window__hero-info">
                <h1 className="ytmusic-window__hero-title">{sections[0].title}</h1>
                <p className="ytmusic-window__hero-desc">{sections[0].subtitle || t('ytmusic.yourMusic')}</p>
              </div>
            </button>
          )}
          {view === 'home' &&
            sections.slice(1).map((section, idx) => (
              <section key={idx} className="ytmusic-window__section">
                <h2 className="ytmusic-window__section-title">{section.title}</h2>
                {section.subtitle && <p className="ytmusic-window__section-sub">{section.subtitle}</p>}
                <div className="ytmusic-window__grid">
                  {(section.items || []).map((item, i) => {
                    const thumb = item.thumbnail || (item.videoId ? `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg` : null)
                    return (
                      <button
                        key={i}
                        type="button"
                        className="ytmusic-window__card"
                        onClick={() => item.videoId && handlePlayTrack(item.videoId, { title: item.title, artist: item.artist, thumbnail: thumb })}
                        disabled={!item.videoId}
                      >
                        <div className="ytmusic-window__card-art">
                          {thumb && <img src={thumb} alt="" className="ytmusic-window__card-img" />}
                        </div>
                        <span className="ytmusic-window__card-title">{item.title}</span>
                        {item.artist && <span className="ytmusic-window__card-artist">{item.artist}</span>}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          {view === 'explore' && (
            <section className="ytmusic-window__section">
              <h2 className="ytmusic-window__section-title">{t('ytmusic.explore')}</h2>
              <div className="ytmusic-window__genre-pills">
                {EXPLORE_GENRES.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    className={`ytmusic-window__genre-pill ${exploreGenre === g.label ? 'ytmusic-window__genre-pill--active' : ''}`}
                    onClick={() => fetchExploreGenre(g)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {exploreGenre && (
                <div className="ytmusic-window__grid" style={{ marginTop: 16 }}>
                  {exploreLoading ? (
                    [1,2,3,4,5,6].map((i) => (
                      <div key={i} className="ytmusic-window__card ytmusic-window__card--loading">
                        <div className="ytmusic-window__card-art" />
                        <span className="ytmusic-window__card-title">…</span>
                      </div>
                    ))
                  ) : exploreResults.length > 0 ? (
                    exploreResults.map((item, i) => (
                      <button
                        key={item.videoId || i}
                        type="button"
                        className="ytmusic-window__card"
                        onClick={() => item.videoId && handlePlayTrack(item.videoId, { title: item.title, artist: item.artist, thumbnail: item.thumbnail })}
                        disabled={!item.videoId}
                      >
                        <div className="ytmusic-window__card-art">
                          {item.thumbnail && <img src={item.thumbnail} alt="" className="ytmusic-window__card-img" />}
                        </div>
                        <span className="ytmusic-window__card-title">{item.title}</span>
                        <span className="ytmusic-window__card-artist">{item.artist}</span>
                      </button>
                    ))
                  ) : (
                    <p className="ytmusic-window__empty">
                      {HAS_YT_KEY || baseUrl ? 'No results found.' : 'Add VITE_YOUTUBE_API_KEY to enable genre search.'}
                    </p>
                  )}
                </div>
              )}
              {!exploreGenre && (
                <p className="ytmusic-window__empty" style={{ marginTop: 16 }}>Select a genre above to discover music.</p>
              )}
            </section>
          )}
          {view === 'library' && (
            <section className="ytmusic-window__section">
              <div className="ytmusic-window__library-header">
                <h2 className="ytmusic-window__section-title">{t('ytmusic.library')}</h2>
                {listenHistory.length > 0 && (
                  <button
                    type="button"
                    className="ytmusic-window__clear-history-btn"
                    onClick={handleClearHistory}
                    title="Clear listening history"
                  >
                    <Trash2 size={14} /> Clear
                  </button>
                )}
              </div>
              {libraryStats && (
                <div className="ytmusic-window__library-stats">
                  <span>{libraryStats.total} tracks played</span>
                  {libraryStats.topArtist && <span>· Top artist: <strong>{libraryStats.topArtist}</strong></span>}
                </div>
              )}
              {listenHistory.length === 0 ? (
                <p className="ytmusic-window__empty">No listening history yet. Play some music!</p>
              ) : (
                <ul className="ytmusic-window__song-list">
                  {listenHistory.slice().reverse().map((h, i) => (
                    <li key={`${h.videoId}-${i}`} className="ytmusic-window__song-item">
                      <button
                        type="button"
                        className="ytmusic-window__song-row"
                        onClick={() => h.videoId && handlePlayTrack(h.videoId, { title: h.title, artist: h.artist, thumbnail: `https://img.youtube.com/vi/${h.videoId}/mqdefault.jpg` })}
                      >
                        <div className="ytmusic-window__song-thumb">
                          <img
                            src={`https://img.youtube.com/vi/${h.videoId}/default.jpg`}
                            alt=""
                            className="ytmusic-window__song-thumb-img"
                          />
                        </div>
                        <span className="ytmusic-window__song-title">{h.title || 'Unknown'}</span>
                        <span className="ytmusic-window__song-artist">{h.artist || ''}</span>
                        {h.at && (
                          <span className="ytmusic-window__song-time">
                            {new Date(h.at).toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="ytmusic-window">
      <aside className="ytmusic-window__sidebar">
        <div className="ytmusic-window__logo">
          <span className="ytmusic-window__logo-icon">▶</span>
          <span className="ytmusic-window__logo-text">YouTube Music</span>
        </div>
        <nav className="ytmusic-window__nav">
          <button
            type="button"
            className={`ytmusic-window__nav-item ${view === 'home' ? 'ytmusic-window__nav-item--active' : ''}`}
            onClick={() => setView('home')}
          >
            {t('ytmusic.home')}
          </button>
          <button
            type="button"
            className={`ytmusic-window__nav-item ${view === 'explore' ? 'ytmusic-window__nav-item--active' : ''}`}
            onClick={() => setView('explore')}
          >
            {t('ytmusic.explore')}
          </button>
          <button
            type="button"
            className={`ytmusic-window__nav-item ${view === 'library' ? 'ytmusic-window__nav-item--active' : ''}`}
            onClick={() => setView('library')}
          >
            {t('ytmusic.library')}
          </button>
        </nav>
      </aside>
      <div className="ytmusic-window__column">
        <div className="ytmusic-window__scroll">{mainContent}</div>
        <NowPlayingBar variant="embedded" />
      </div>
    </div>
  )
}
