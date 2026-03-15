import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './YouTubeMusicWindow.css'

const API_URL = import.meta.env.VITE_API_URL || ''

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
  const [curated, setCurated] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [view, setView] = useState('home')
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [playingVideoId, setPlayingVideoId] = useState(null)

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

  const fetchSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults(null)
      return
    }
    if (!baseUrl) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
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
  }, [baseUrl])

  useEffect(() => {
    fetchCurated()
  }, [fetchCurated])

  useEffect(() => {
    const t = setTimeout(() => fetchSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery, fetchSearch])

  const showSearch = searchQuery.trim().length > 0
  const sections = curated || []

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
      <main className="ytmusic-window__main">
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
                    key={i}
                    type="button"
                    className="ytmusic-window__card"
                    onClick={() => (item.videoId || item.id) && setPlayingVideoId(item.videoId || item.id)}
                  >
                    <div className="ytmusic-window__card-art">
                      {item.thumbnail && (
                        <img src={item.thumbnail} alt="" className="ytmusic-window__card-img" />
                      )}
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
            <button
              type="button"
              className="ytmusic-window__back-btn"
              onClick={() => setSelectedAlbum(null)}
            >
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
                    onClick={() => item.videoId && setPlayingVideoId(item.videoId)}
                    disabled={!item.videoId}
                  >
                    <span className="ytmusic-window__song-play">
                      {item.videoId ? '▶' : '—'}
                    </span>
                    <span className="ytmusic-window__song-title">{item.title}</span>
                    <span className="ytmusic-window__song-artist">{item.artist}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <>
            {sections[0] && (
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
            {sections.slice(1).map((section, idx) => (
              <section key={idx} className="ytmusic-window__section">
                <h2 className="ytmusic-window__section-title">{section.title}</h2>
                <div className="ytmusic-window__grid">
                  {(section.items || []).map((item, i) => {
                    const thumb = item.thumbnail || (item.videoId ? `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg` : null)
                    return (
                    <button
                      key={i}
                      type="button"
                      className="ytmusic-window__card"
                      onClick={() => item.videoId && setPlayingVideoId(item.videoId)}
                      disabled={!item.videoId}
                    >
                      <div className="ytmusic-window__card-art">
                        {thumb && (
                          <img src={thumb} alt="" className="ytmusic-window__card-img" />
                        )}
                      </div>
                      <span className="ytmusic-window__card-title">{item.title}</span>
                      {item.artist && (
                        <span className="ytmusic-window__card-artist">{item.artist}</span>
                      )}
                    </button>
                  )})}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
      {playingVideoId && (
        <div className="ytmusic-window__player">
          <button
            type="button"
            className="ytmusic-window__player-close"
            onClick={() => setPlayingVideoId(null)}
            aria-label="Close player"
          >
            ×
          </button>
          <iframe
            src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
            title="YouTube player"
            className="ytmusic-window__player-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}
