import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'

const MusicPlayerContext = createContext(null)

let iframeApiPromise = null
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (iframeApiPromise) return iframeApiPromise
  iframeApiPromise = new Promise((resolve) => {
    const done = () => resolve()
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const t0 = Date.now()
      const id = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(id)
          done()
        } else if (Date.now() - t0 > 15000) {
          clearInterval(id)
          done()
        }
      }, 50)
      return
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      done()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
  })
  return iframeApiPromise
}

const HOST_ID = 'yt-music-hidden-player'

/** Default desktop playlist; first track matches YouTube Music link (Mu4HVN2-IRc). */
const STARTER_PLAYLIST = [
  {
    videoId: 'Mu4HVN2-IRc',
    title: 'I Gotta Feeling',
    artist: 'Black Eyed Peas',
    thumbnail: 'https://img.youtube.com/vi/Mu4HVN2-IRc/mqdefault.jpg',
  },
  {
    videoId: 'vU05Eksc_iM',
    title: 'Wonderwall',
    artist: 'Oasis',
    thumbnail: 'https://img.youtube.com/vi/vU05Eksc_iM/mqdefault.jpg',
  },
  {
    videoId: 'r8OipmKFDeM',
    title: "Don't Look Back in Anger",
    artist: 'Oasis',
    thumbnail: 'https://img.youtube.com/vi/r8OipmKFDeM/mqdefault.jpg',
  },
]

export function MusicPlayerProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progressSec, setProgressSec] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const playerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const pendingVideoIdRef = useRef(null)
  const queueRef = useRef([])
  const currentIndexRef = useRef(0)
  const starterInitRef = useRef(false)
  /** Autoplay waits until 2s after first mount so the user “enters” the screen first. */
  const providerMountTimeRef = useRef(Date.now())
  const allowEarlyPlayRef = useRef(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      allowEarlyPlayRef.current = true
    }, 2000)
    return () => window.clearTimeout(t)
  }, [])

  const currentTrack = queue[currentIndex] ?? null
  queueRef.current = queue
  currentIndexRef.current = currentIndex

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const startProgressTimer = useCallback(() => {
    clearProgressTimer()
    progressTimerRef.current = setInterval(() => {
      const p = playerRef.current
      const YT = window.YT
      if (p?.getCurrentTime && p.getPlayerState?.() === YT?.PlayerState?.PLAYING) {
        setProgressSec(p.getCurrentTime() || 0)
        const d = p.getDuration?.()
        if (d && !Number.isNaN(d) && d > 0) setDurationSec(d)
      }
    }, 400)
  }, [clearProgressTimer])

  const kickPlayback = useCallback((p) => {
    if (!p?.playVideo) return
    const tryPlay = () => {
      try {
        p.playVideo()
      } catch {
        // ignore
      }
    }
    tryPlay()
    requestAnimationFrame(tryPlay)
    setTimeout(tryPlay, 80)
    setTimeout(tryPlay, 320)
  }, [])

  const kickPlaybackMaybeDelayed = useCallback(
    (p) => {
      if (!p?.playVideo) return
      const elapsed = Date.now() - providerMountTimeRef.current
      const wait = Math.max(0, 2000 - elapsed)
      if (wait <= 0) kickPlayback(p)
      else setTimeout(() => kickPlayback(p), wait)
    },
    [kickPlayback],
  )

  const loadVideo = useCallback(
    (videoId) => {
      if (!videoId) return
      const p = playerRef.current
      if (p?.loadVideoById) {
        try {
          p.loadVideoById(videoId)
          setIsPlaying(true)
          startProgressTimer()
          kickPlaybackMaybeDelayed(p)
        } catch {
          pendingVideoIdRef.current = videoId
        }
      } else {
        pendingVideoIdRef.current = videoId
      }
    },
    [startProgressTimer, kickPlaybackMaybeDelayed]
  )

  useEffect(() => {
    let destroyed = false
    let ytPlayer = null

    const run = async () => {
      await loadYouTubeIframeApi()
      if (destroyed) return
      const el = document.getElementById(HOST_ID)
      if (!el || !window.YT?.Player) return

      ytPlayer = new window.YT.Player(HOST_ID, {
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 0,
          mute: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            playerRef.current = ytPlayer
            const pending = pendingVideoIdRef.current
            if (pending) {
              pendingVideoIdRef.current = null
              try {
                ytPlayer.loadVideoById(pending)
                setIsPlaying(true)
                startProgressTimer()
                kickPlaybackMaybeDelayed(ytPlayer)
              } catch {
                // ignore
              }
            } else if (queueRef.current.length) {
              const idx = currentIndexRef.current
              const vid = queueRef.current[idx]?.videoId
              if (vid) {
                try {
                  ytPlayer.loadVideoById(vid)
                  setIsPlaying(true)
                  startProgressTimer()
                  kickPlaybackMaybeDelayed(ytPlayer)
                } catch {
                  // ignore
                }
              }
            }
          },
          onStateChange: (e) => {
            const YT = window.YT
            const p = playerRef.current
            if (e.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              startProgressTimer()
            } else if (e.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              clearProgressTimer()
            } else if (e.data === YT.PlayerState.CUED) {
              if (!allowEarlyPlayRef.current) return
              try {
                p?.playVideo?.()
              } catch {
                // ignore
              }
            } else if (e.data === YT.PlayerState.ENDED) {
              setIsPlaying(false)
              clearProgressTimer()
              setCurrentIndex((i) => {
                const q = queueRef.current
                if (!q.length || q.length <= 1) return i
                return (i + 1) % q.length
              })
              setProgressSec(0)
            }
          },
        },
      })
    }

    run()
    return () => {
      destroyed = true
      clearProgressTimer()
      try {
        ytPlayer?.destroy?.()
      } catch {
        // ignore
      }
      playerRef.current = null
    }
  }, [clearProgressTimer, startProgressTimer, kickPlaybackMaybeDelayed])

  useEffect(() => {
    if (currentTrack?.videoId) loadVideo(currentTrack.videoId)
  }, [currentTrack?.videoId, loadVideo])

  const appendListenHistory = useCallback((videoId, title, artist) => {
    if (!videoId) return
    try {
      const LISTEN_KEY = 'ytm-listen-history'
      const raw = localStorage.getItem(LISTEN_KEY)
      let arr = []
      try {
        arr = JSON.parse(raw || '[]')
      } catch {
        arr = []
      }
      if (!Array.isArray(arr)) arr = []
      arr.unshift({ videoId, title: title || '', artist: artist || '', at: Date.now() })
      const deduped = []
      const seen = new Set()
      for (const e of arr) {
        if (!e?.videoId || seen.has(e.videoId)) continue
        seen.add(e.videoId)
        deduped.push({ videoId: e.videoId, title: e.title || '', artist: e.artist || '' })
        if (deduped.length >= 50) break
      }
      localStorage.setItem(LISTEN_KEY, JSON.stringify(deduped))
    } catch {
      // ignore
    }
  }, [])

  const playTrack = useCallback(
    (videoId, meta = {}) => {
      if (!videoId) return
      const thumb = meta.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      const entry = {
        videoId,
        title: meta.title || 'Unknown',
        artist: meta.artist || '',
        thumbnail: thumb,
      }
      appendListenHistory(videoId, entry.title, entry.artist)
      setQueue([entry])
      setCurrentIndex(0)
      setProgressSec(0)
      setDurationSec(0)
    },
    [appendListenHistory]
  )

  const playQueue = useCallback(
    (tracks, startIndex = 0) => {
      const normalized = tracks
        .filter((t) => t.videoId)
        .map((t) => ({
          videoId: t.videoId,
          title: t.title || 'Unknown',
          artist: t.artist || '',
          thumbnail: t.thumbnail || `https://img.youtube.com/vi/${t.videoId}/mqdefault.jpg`,
        }))
      if (!normalized.length) return
      const i = Math.min(Math.max(0, startIndex), normalized.length - 1)
      const cur = normalized[i]
      appendListenHistory(cur.videoId, cur.title, cur.artist)
      setQueue(normalized)
      setCurrentIndex(i)
      setProgressSec(0)
      setDurationSec(0)
    },
    [appendListenHistory]
  )

  useEffect(() => {
    if (starterInitRef.current) return
    starterInitRef.current = true
    playQueue(STARTER_PLAYLIST, 0)
  }, [playQueue])

  const pause = useCallback(() => {
    try {
      playerRef.current?.pauseVideo?.()
    } catch {
      // ignore
    }
    setIsPlaying(false)
    clearProgressTimer()
  }, [clearProgressTimer])

  const resume = useCallback(() => {
    try {
      playerRef.current?.playVideo?.()
    } catch {
      // ignore
    }
    setIsPlaying(true)
    startProgressTimer()
  }, [startProgressTimer])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else resume()
  }, [isPlaying, pause, resume])

  const stop = useCallback(() => {
    try {
      playerRef.current?.stopVideo?.()
    } catch {
      // ignore
    }
    setQueue([])
    setCurrentIndex(0)
    setIsPlaying(false)
    setProgressSec(0)
    setDurationSec(0)
    clearProgressTimer()
  }, [clearProgressTimer])

  const next = useCallback(() => {
    setCurrentIndex((i) => {
      if (queue.length <= 1) return i
      return (i + 1) % queue.length
    })
  }, [queue.length])

  const prev = useCallback(() => {
    setCurrentIndex((i) => {
      if (queue.length <= 1) return i
      return (i - 1 + queue.length) % queue.length
    })
  }, [queue.length])

  const seekTo = useCallback((seconds) => {
    try {
      playerRef.current?.seekTo?.(seconds, true)
      setProgressSec(seconds)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo(
    () => ({
      currentTrack,
      queue,
      currentIndex,
      isPlaying,
      progressSec,
      durationSec,
      playTrack,
      playQueue,
      pause,
      resume,
      togglePlay,
      stop,
      next,
      prev,
      seekTo,
    }),
    [
      currentTrack,
      queue,
      currentIndex,
      isPlaying,
      progressSec,
      durationSec,
      playTrack,
      playQueue,
      pause,
      resume,
      togglePlay,
      stop,
      next,
      prev,
      seekTo,
    ]
  )

  return (
    <MusicPlayerContext.Provider value={value}>
      <div id={HOST_ID} className="music-player__hidden-host" aria-hidden="true" />
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) {
    return {
      currentTrack: null,
      queue: [],
      isPlaying: false,
      progressSec: 0,
      durationSec: 0,
      playTrack: () => {},
      playQueue: () => {},
      pause: () => {},
      resume: () => {},
      togglePlay: () => {},
      stop: () => {},
      next: () => {},
      prev: () => {},
      seekTo: () => {},
    }
  }
  return ctx
}

const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''

function mapSearchItems(items) {
  return (items || [])
    .map((it) => {
      const sn = it.snippet || {}
      const vid = it.id?.videoId
      return {
        videoId: vid,
        title: sn.title,
        artist: sn.channelTitle,
        thumbnail: sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url,
      }
    })
    .filter((x) => x.videoId)
}

export async function searchYouTubeVideos(query) {
  if (!query?.trim() || !YOUTUBE_KEY) return []
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '24')
  url.searchParams.set('q', query.trim())
  url.searchParams.set('key', YOUTUBE_KEY)
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json()
  return mapSearchItems(data.items)
}

const LISTEN_KEY = 'ytm-listen-history'

/** Related + keyword search from recent plays (requires VITE_YOUTUBE_API_KEY). */
export async function fetchRecommendedFromListening(maxTotal = 20) {
  if (!YOUTUBE_KEY) return []
  let history = []
  try {
    history = JSON.parse(localStorage.getItem(LISTEN_KEY) || '[]')
  } catch {
    return []
  }
  if (!Array.isArray(history) || !history.length) return []

  const seen = new Set()
  const out = []

  const pushMapped = (items) => {
    for (const it of mapSearchItems(items)) {
      if (seen.has(it.videoId)) continue
      seen.add(it.videoId)
      out.push(it)
      if (out.length >= maxTotal) return true
    }
    return false
  }

  const lastWithId = history.find((h) => h?.videoId)
  if (lastWithId) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('type', 'video')
      url.searchParams.set('maxResults', '12')
      url.searchParams.set('relatedToVideoId', lastWithId.videoId)
      url.searchParams.set('key', YOUTUBE_KEY)
      const res = await fetch(url.toString())
      if (res.ok) {
        const data = await res.json()
        if (pushMapped(data.items)) return out
      }
    } catch {
      // ignore
    }
  }

  const artists = [...new Set(history.slice(0, 8).map((h) => h?.artist).filter(Boolean))]
  for (const artist of artists.slice(0, 3)) {
    if (out.length >= maxTotal) break
    try {
      const q = `${artist} music`
      const url = new URL('https://www.googleapis.com/youtube/v3/search')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('type', 'video')
      url.searchParams.set('maxResults', '8')
      url.searchParams.set('q', q)
      url.searchParams.set('key', YOUTUBE_KEY)
      const res = await fetch(url.toString())
      if (res.ok) {
        const data = await res.json()
        if (pushMapped(data.items)) break
      }
    } catch {
      // ignore
    }
  }

  return out
}
