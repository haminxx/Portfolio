import { useCallback, useRef } from 'react'
import { SkipBack, SkipForward, Play, Pause, X } from 'lucide-react'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import './NowPlayingBar.css'

function formatTime(sec) {
  if (!sec || Number.isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    progressSec,
    durationSec,
    togglePlay,
    stop,
    next,
    prev,
    seekTo,
  } = useMusicPlayer()
  const barRef = useRef(null)

  const onBarClick = useCallback(
    (e) => {
      if (!durationSec) return
      const rect = barRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      seekTo(ratio * durationSec)
    },
    [durationSec, seekTo]
  )

  if (!currentTrack) return null

  const pct = durationSec > 0 ? Math.min(100, (progressSec / durationSec) * 100) : 0

  return (
    <div className="now-playing-bar" role="region" aria-label="Now playing">
      <div className="now-playing-bar__thumb">
        <img src={currentTrack.thumbnail} alt="" className="now-playing-bar__thumb-img" />
      </div>
      <div className="now-playing-bar__meta">
        <span className="now-playing-bar__title">{currentTrack.title}</span>
        <span className="now-playing-bar__artist">{currentTrack.artist}</span>
      </div>
      <div className="now-playing-bar__controls">
        <button type="button" className="now-playing-bar__btn" aria-label="Previous" onClick={prev}>
          <SkipBack size={20} strokeWidth={2} />
        </button>
        <button type="button" className="now-playing-bar__btn now-playing-bar__btn--play" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay}>
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
        <button type="button" className="now-playing-bar__btn" aria-label="Next" onClick={next}>
          <SkipForward size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="now-playing-bar__progress-wrap">
        <span className="now-playing-bar__time">{formatTime(progressSec)}</span>
        <button
          type="button"
          ref={barRef}
          className="now-playing-bar__progress-track"
          onClick={onBarClick}
          aria-label="Seek"
        >
          <span className="now-playing-bar__progress-fill" style={{ width: `${pct}%` }} />
        </button>
        <span className="now-playing-bar__time">{formatTime(durationSec)}</span>
      </div>
      <button type="button" className="now-playing-bar__close" aria-label="Stop" onClick={stop}>
        <X size={18} strokeWidth={2} />
      </button>
    </div>
  )
}
