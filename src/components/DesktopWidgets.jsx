import { useState, useEffect, useMemo, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import './DesktopWidgets.css'

const SD_LAT = 32.72
const SD_LON = -117.16

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function DesktopWidgets() {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState({ status: 'idle', days: [], error: null })
  const { currentTrack, isPlaying, togglePlay } = useMusicPlayer()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const loadWeather = useCallback(async () => {
    setWeather((w) => ({ ...w, status: 'loading', error: null }))
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', String(SD_LAT))
      url.searchParams.set('longitude', String(SD_LON))
      url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weathercode')
      url.searchParams.set('timezone', 'America/Los_Angeles')
      url.searchParams.set('forecast_days', '7')
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('forecast failed')
      const data = await res.json()
      const times = data.daily?.time || []
      const maxT = data.daily?.temperature_2m_max || []
      const minT = data.daily?.temperature_2m_min || []
      const days = times.map((t, i) => ({
        date: t,
        high: maxT[i],
        low: minT[i],
      }))
      setWeather({ status: 'ready', days, error: null })
    } catch (e) {
      setWeather({ status: 'error', days: [], error: e?.message || 'unavailable' })
    }
  }, [])

  useEffect(() => {
    loadWeather()
  }, [loadWeather])

  const cal = useMemo(() => {
    const y = now.getFullYear()
    const m = now.getMonth()
    return {
      label: now.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
      grid: buildMonthGrid(y, m),
      today: now.getDate(),
    }
  }, [now])

  const timeStr = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="desktop-widgets" aria-hidden>
      <div className="desktop-widgets__grid">
        <div className="desktop-widgets__card desktop-widgets__card--calendar">
          <div className="desktop-widgets__card-title">{cal.label}</div>
          <div className="desktop-widgets__week-row">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="desktop-widgets__weekday">
                {d}
              </span>
            ))}
          </div>
          <div className="desktop-widgets__cal-grid">
            {cal.grid.map((d, i) => (
              <span
                key={i}
                className={`desktop-widgets__cal-cell ${d === cal.today ? 'desktop-widgets__cal-cell--today' : ''} ${d == null ? 'desktop-widgets__cal-cell--empty' : ''}`}
              >
                {d ?? ''}
              </span>
            ))}
          </div>
        </div>

        <div className="desktop-widgets__card desktop-widgets__card--clock">
          <div className="desktop-widgets__clock-time">{timeStr}</div>
          <div className="desktop-widgets__clock-date">{dateStr}</div>
          <div className="desktop-widgets__clock-loc">San Diego</div>
        </div>

        <div className="desktop-widgets__card desktop-widgets__card--weather">
          <div className="desktop-widgets__card-title">San Diego</div>
          {weather.status === 'loading' && <p className="desktop-widgets__muted">Loading…</p>}
          {weather.status === 'error' && <p className="desktop-widgets__muted">{weather.error}</p>}
          {weather.status === 'ready' && (
            <div className="desktop-widgets__weather-strip">
              {weather.days.map((d) => {
                const label = new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
                const hi = d.high != null ? Math.round(d.high) : '—'
                return (
                  <div key={d.date} className="desktop-widgets__weather-day">
                    <span className="desktop-widgets__weather-dow">{label}</span>
                    <span className="desktop-widgets__weather-hi">{hi}°</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="desktop-widgets__card desktop-widgets__card--music">
          <div className="desktop-widgets__card-title">Music</div>
          {currentTrack ? (
            <div className="desktop-widgets__music-row">
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="desktop-widgets__music-art"
                width={40}
                height={40}
              />
              <div className="desktop-widgets__music-meta">
                <div className="desktop-widgets__music-title">{currentTrack.title}</div>
                <div className="desktop-widgets__music-artist">{currentTrack.artist || 'YouTube'}</div>
              </div>
              <button
                type="button"
                className="desktop-widgets__music-play"
                onClick={() => togglePlay()}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
          ) : (
            <p className="desktop-widgets__muted">Nothing playing</p>
          )}
        </div>
      </div>
    </div>
  )
}
