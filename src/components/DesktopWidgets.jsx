import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Play,
  Pause,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  ImageIcon,
  LayoutGrid,
} from 'lucide-react'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import './DesktopWidgets.css'

const SD_LAT = 32.72
const SD_LON = -117.16
const LAYOUT_KEY = 'desktop-widget-layout'
const CELL = 40

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const PHOTO_IDS = ['photoA', 'photoB', 'photoC']

const PHOTO_SIZE_PRESETS = [
  { gridW: 2, gridH: 2, label: '2×2' },
  { gridW: 2, gridH: 4, label: '2×4' },
  { gridW: 4, gridH: 2, label: '4×2' },
  { gridW: 4, gridH: 4, label: '4×4' },
  { gridW: 4, gridH: 8, label: '4×8' },
  { gridW: 8, gridH: 4, label: '8×4' },
  { gridW: 8, gridH: 8, label: '8×8' },
]

const WIDGET_IDS = ['calendar', 'clock', 'weather', 'music', ...PHOTO_IDS]

const STATIC_SIZES = {
  calendar: { w: 200, h: 220 },
  clock: { w: 200, h: 120 },
  weather: { w: 200, h: 130 },
  music: { w: 200, h: 120 },
}

const DEFAULT_LAYOUT = {
  calendar: { x: 20, y: 56 },
  clock: { x: 240, y: 56 },
  weather: { x: 20, y: 300 },
  music: { x: 240, y: 300 },
  photoA: { x: 480, y: 56, gridW: 4, gridH: 4 },
  photoB: { x: 680, y: 56, gridW: 4, gridH: 4 },
  photoC: { x: 480, y: 280, gridW: 4, gridH: 4 },
}

function getBoxSize(id, entry) {
  if (PHOTO_IDS.includes(id)) {
    const gw = entry?.gridW ?? 4
    const gh = entry?.gridH ?? 4
    return { w: gw * CELL, h: gh * CELL }
  }
  return STATIC_SIZES[id] || { w: 200, h: 150 }
}

function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return { ...DEFAULT_LAYOUT }
    const parsed = JSON.parse(raw)
    const out = { ...DEFAULT_LAYOUT }
    for (const id of WIDGET_IDS) {
      if (parsed[id]?.x != null && parsed[id]?.y != null) {
        out[id] = {
          ...out[id],
          x: parsed[id].x,
          y: parsed[id].y,
        }
        if (PHOTO_IDS.includes(id)) {
          if (parsed[id].gridW != null) out[id].gridW = parsed[id].gridW
          if (parsed[id].gridH != null) out[id].gridH = parsed[id].gridH
        }
      }
    }
    return out
  } catch {
    return { ...DEFAULT_LAYOUT }
  }
}

function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch {
    // ignore
  }
}

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

function weatherCodeToIcon(code) {
  if (code == null || Number.isNaN(code)) return Cloud
  const c = code
  if (c === 0) return Sun
  if (c === 1) return CloudSun
  if (c === 2) return CloudSun
  if (c === 3) return Cloud
  if (c === 45 || c === 48) return CloudFog
  if (c >= 51 && c <= 57) return CloudDrizzle
  if (c >= 61 && c <= 67) return CloudRain
  if (c >= 71 && c <= 77) return CloudSnow
  if (c >= 80 && c <= 82) return CloudRain
  if (c >= 95) return CloudLightning
  return Cloud
}

export default function DesktopWidgets() {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState({ status: 'idle', days: [], error: null })
  const [layout, setLayout] = useState(loadLayout)
  const [calCursor, setCalCursor] = useState(null)
  const [sizeMenuFor, setSizeMenuFor] = useState(null)
  const dragRef = useRef(null)
  const containerRef = useRef(null)
  const sizePopoverRef = useRef(null)
  const { currentTrack, isPlaying, togglePlay } = useMusicPlayer()

  const calYM = calCursor ?? { y: now.getFullYear(), m: now.getMonth() }

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!sizeMenuFor) return
    const onDoc = (e) => {
      if (sizePopoverRef.current?.contains(e.target)) return
      setSizeMenuFor(null)
    }
    document.addEventListener('pointerdown', onDoc, true)
    return () => document.removeEventListener('pointerdown', onDoc, true)
  }, [sizeMenuFor])

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
      const codes = data.daily?.weathercode || []
      const days = times.map((t, i) => ({
        date: t,
        high: maxT[i],
        low: minT[i],
        code: codes[i],
      }))
      setWeather({ status: 'ready', days, error: null })
    } catch (e) {
      setWeather({ status: 'error', days: [], error: e?.message || 'unavailable' })
    }
  }, [])

  useEffect(() => {
    loadWeather()
  }, [loadWeather])

  const clampPos = useCallback((id, x, y, layoutMap) => {
    const el = containerRef.current
    if (!el) return { x, y }
    const rect = el.getBoundingClientRect()
    const entry = layoutMap[id] || DEFAULT_LAYOUT[id]
    const { w, h } = getBoxSize(id, entry)
    const maxX = Math.max(0, rect.width - w)
    const maxY = Math.max(0, rect.height - h)
    const clamp = (v, max) => Math.max(0, Math.min(max, v))
    return {
      x: clamp(x, maxX),
      y: clamp(y, maxY),
    }
  }, [])

  const handleGripPointerDown = useCallback(
    (e, id) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()
      const el = containerRef.current
      if (!el) return
      const pos = layout[id]
      const gripEl = e.currentTarget
      const pointerId = e.pointerId
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
        gripEl,
        pointerId,
      }
      try {
        gripEl.setPointerCapture(pointerId)
      } catch {
        // ignore
      }

      const onMove = (ev) => {
        const d = dragRef.current
        if (!d) return
        const dx = ev.clientX - d.startX
        const dy = ev.clientY - d.startY
        setLayout((prev) => {
          const nextPos = clampPos(d.id, d.origX + dx, d.origY + dy, prev)
          return { ...prev, [d.id]: { ...prev[d.id], ...nextPos } }
        })
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        const d = dragRef.current
        try {
          d?.gripEl?.releasePointerCapture?.(d.pointerId)
        } catch {
          // ignore
        }
        dragRef.current = null
        setLayout((prev) => {
          saveLayout(prev)
          return prev
        })
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [layout, clampPos],
  )

  const applyPhotoGrid = useCallback(
    (id, gridW, gridH) => {
      setLayout((prev) => {
        const base = { ...prev[id], gridW, gridH }
        const pos = clampPos(id, base.x, base.y, { ...prev, [id]: base })
        const next = { ...prev, [id]: { ...base, ...pos } }
        saveLayout(next)
        return next
      })
      setSizeMenuFor(null)
    },
    [clampPos],
  )

  const cal = useMemo(() => {
    const y = calYM.y
    const m = calYM.m
    return {
      label: new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
      grid: buildMonthGrid(y, m),
      today: now.getDate(),
      isCurrentMonth: y === now.getFullYear() && m === now.getMonth(),
    }
  }, [calYM, now])

  const shiftCal = (delta) => {
    setCalCursor((prev) => {
      const base = prev ?? { y: now.getFullYear(), m: now.getMonth() }
      let { y, m } = base
      m += delta
      if (m < 0) {
        m = 11
        y -= 1
      } else if (m > 11) {
        m = 0
        y += 1
      }
      return { y, m }
    })
  }

  const timeStr = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateUpper = now
    .toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()

  const cardStyle = (id) => {
    const p = layout[id] || DEFAULT_LAYOUT[id]
    const { w, h } = getBoxSize(id, p)
    return { left: p.x, top: p.y, width: w, height: h }
  }

  return (
    <div ref={containerRef} className="desktop-widgets" aria-hidden>
      <div className="desktop-widgets__card desktop-widgets__card--calendar" style={cardStyle('calendar')}>
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move calendar widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'calendar')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="desktop-widgets__cal-header">
          <button type="button" className="desktop-widgets__cal-nav" aria-label="Previous month" onClick={() => shiftCal(-1)}>
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <div className="desktop-widgets__card-title desktop-widgets__card-title--cal">{cal.label}</div>
          <button type="button" className="desktop-widgets__cal-nav" aria-label="Next month" onClick={() => shiftCal(1)}>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
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
              className={`desktop-widgets__cal-cell ${cal.isCurrentMonth && d === cal.today ? 'desktop-widgets__cal-cell--today' : ''} ${d == null ? 'desktop-widgets__cal-cell--empty' : ''}`}
            >
              {d ?? ''}
            </span>
          ))}
        </div>
      </div>

      <div className="desktop-widgets__card desktop-widgets__card--clock" style={cardStyle('clock')}>
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move clock widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'clock')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="desktop-widgets__clock-split">
          <div className="desktop-widgets__clock-accent" aria-hidden />
          <div className="desktop-widgets__clock-main">
            <div className="desktop-widgets__clock-date-upper">{dateUpper}</div>
            <div className="desktop-widgets__clock-time">{timeStr}</div>
            <div className="desktop-widgets__clock-loc">San Diego</div>
          </div>
        </div>
      </div>

      <div className="desktop-widgets__card desktop-widgets__card--weather" style={cardStyle('weather')}>
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move weather widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'weather')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="desktop-widgets__card-title desktop-widgets__weather-city">San Diego</div>
        {weather.status === 'loading' && <p className="desktop-widgets__muted">Loading…</p>}
        {weather.status === 'error' && <p className="desktop-widgets__muted">{weather.error}</p>}
        {weather.status === 'ready' && (
          <div className="desktop-widgets__weather-strip">
            {weather.days.map((d, i) => {
              const label = new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
              const hi = d.high != null ? Math.round(d.high) : '—'
              const Ico = weatherCodeToIcon(d.code)
              return (
                <div
                  key={d.date}
                  className={`desktop-widgets__weather-day ${i === 0 ? 'desktop-widgets__weather-day--active' : ''}`}
                >
                  <span className="desktop-widgets__weather-dow">{label}</span>
                  <span className="desktop-widgets__weather-icon" aria-hidden>
                    <Ico size={18} strokeWidth={1.75} />
                  </span>
                  <span className="desktop-widgets__weather-hi">{hi}°</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="desktop-widgets__card desktop-widgets__card--music" style={cardStyle('music')}>
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move music widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'music')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="desktop-widgets__music-head">
          <span className="desktop-widgets__card-title desktop-widgets__card-title--inline">Music</span>
        </div>
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

      {PHOTO_IDS.map((pid) => {
        const open = sizeMenuFor === pid
        return (
          <div key={pid} className="desktop-widgets__card desktop-widgets__card--photo" style={cardStyle(pid)}>
            <div className="desktop-widgets__photo-chrome">
              <button
                type="button"
                className="desktop-widgets__grip desktop-widgets__grip--photo"
                aria-label={`Move ${pid} widget`}
                onPointerDown={(e) => handleGripPointerDown(e, pid)}
              >
                <GripVertical size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="desktop-widgets__size-trigger"
                aria-label="Widget size"
                aria-expanded={open}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setSizeMenuFor((x) => (x === pid ? null : pid))
                }}
              >
                <LayoutGrid size={14} strokeWidth={2} />
              </button>
            </div>
            {open && (
              <div ref={sizePopoverRef} className="desktop-widgets__size-popover" role="listbox" aria-label="Photo widget size">
                {PHOTO_SIZE_PRESETS.map((preset) => (
                  <button
                    key={`${preset.gridW}x${preset.gridH}`}
                    type="button"
                    className="desktop-widgets__size-tile"
                    role="option"
                    onClick={() => applyPhotoGrid(pid, preset.gridW, preset.gridH)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            <div className="desktop-widgets__photo-body">
              <div className="desktop-widgets__photo-placeholder">
                <ImageIcon size={28} strokeWidth={1.25} aria-hidden />
                <span className="desktop-widgets__photo-hint">Photo</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
