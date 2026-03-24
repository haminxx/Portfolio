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

export function MusicPlayerProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progressSec, setProgressSec] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const playerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const pendingVideoIdRef = useRef(null)

  const currentTrack = queue[currentIndex] ?? null

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

  const loadVideo = useCallback(
    (videoId) => {
      if (!videoId) return
      const p = playerRef.current
      if (p?.loadVideoById) {
        try {
          p.loadVideoById(videoId)
          setIsPlaying(true)
          startProgressTimer()
        } catch {
          pendingVideoIdRef.current = videoId
        }
      } else {
        pendingVideoIdRef.current = videoId
      }
    },
    [startProgressTimer]
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
          autoplay: 1,
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
              } catch {
                // ignore
              }
            }
          },
          onStateChange: (e) => {
            const YT = window.YT
            if (e.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              startProgressTimer()
            } else if (e.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              clearProgressTimer()
            } else if (e.data === YT.PlayerState.ENDED) {
              setIsPlaying(false)
              clearProgressTimer()
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
  }, [clearProgressTimer, startProgressTimer])

  useEffect(() => {
    if (currentTrack?.videoId) loadVideo(currentTrack.videoId)
  }, [currentTrack?.videoId, loadVideo])

  const playTrack = useCallback((videoId, meta = {}) => {
    if (!videoId) return
    const thumb = meta.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    const entry = {
      videoId,
      title: meta.title || 'Unknown',
      artist: meta.artist || '',
      thumbnail: thumb,
    }
    setQueue([entry])
    setCurrentIndex(0)
    setProgressSec(0)
    setDurationSec(0)
  }, [])

  const playQueue = useCallback((tracks, startIndex = 0) => {
    const normalized = tracks
      .filter((t) => t.videoId)
      .map((t) => ({
        videoId: t.videoId,
        title: t.title || 'Unknown',
        artist: t.artist || '',
        thumbnail: t.thumbnail || `https://img.youtube.com/vi/${t.videoId}/mqdefault.jpg`,
      }))
    if (!normalized.length) return
    setQueue(normalized)
    setCurrentIndex(Math.min(Math.max(0, startIndex), normalized.length - 1))
    setProgressSec(0)
    setDurationSec(0)
  }, [])

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
  const items = data.items || []
  return items
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
