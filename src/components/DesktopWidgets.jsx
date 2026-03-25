import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Play,
  Pause,
  GripVertical,
  SkipBack,
  SkipForward,
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
  RefreshCw,
  ListTodo,
} from 'lucide-react'
import { Calendar } from './ui/calendar'
import ColorPicker from './ui/color-picker'
import BackgroundMotionSlider from './ui/BackgroundMotionSlider'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { useDesktopBackground } from '../context/DesktopBackgroundContext'
import { getImagePath } from '../lib/gallery'
import { loadPhotoWidgetState, savePhotoWidgetState } from '../lib/photoWidgetStorage'
import {
  loadNotesStore,
  getPinnedChecklistItems,
  setPinnedChecklistItemDone,
  NOTES_CHANGED_EVENT,
} from '../lib/notesStorage'
import PhotoWidgetImportModal from './PhotoWidgetImportModal'
import { DESKTOP_SAFE_TOP } from '../desktopConstants'
import { getDesktopIconRects } from '../lib/widgetOverlapGeometry'
import './DesktopWidgets.css'

const SD_LAT = 32.72
const SD_LON = -117.16
const LAYOUT_KEY = 'desktop-widget-layout'
const CELL = 40
const GRID_MIN = 2
const GRID_MAX = 16

const PHOTO_IDS = ['photoA', 'photoB', 'photoC']

const WIDGET_IDS = ['calendar', 'clock', 'weather', 'music', 'bgControls', 'notesChecklist', ...PHOTO_IDS]

function formatTrackTime(sec) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const STATIC_SIZES = {
  calendar: { w: 200, h: 220 },
  clock: { w: 200, h: 120 },
  weather: { w: 200, h: 130 },
  music: { w: 312, h: 136 },
  bgControls: { w: 160, h: 160 },
  notesChecklist: { w: 200, h: 200 },
}

const DEFAULT_LAYOUT = {
  calendar: { x: 20, y: 56 },
  clock: { x: 240, y: 56 },
  weather: { x: 20, y: 300 },
  music: { x: 240, y: 300 },
  bgControls: { x: 1000, y: 420 },
  notesChecklist: { x: 480, y: 300 },
  photoA: { x: 24, y: 260, gridW: 8, gridH: 12 },
  photoB: { x: 400, y: 56, gridW: 6, gridH: 8 },
  photoC: { x: 860, y: 56, gridW: 8, gridH: 7 },
}

function clampGrid(n) {
  const v = Math.round(Number(n))
  if (Number.isNaN(v)) return GRID_MIN
  return Math.max(GRID_MIN, Math.min(GRID_MAX, v))
}

function getBoxSize(id, entry) {
  if (PHOTO_IDS.includes(id)) {
    const gw = clampGrid(entry?.gridW ?? GRID_MIN)
    const gh = clampGrid(entry?.gridH ?? GRID_MIN)
    return { w: gw * CELL, h: gh * CELL }
  }
  return STATIC_SIZES[id] || { w: 200, h: 150 }
}

function getWidgetRect(id, entry) {
  const { w, h } = getBoxSize(id, entry)
  const x = entry.x ?? 0
  const y = entry.y ?? 0
  return { left: x, top: y, right: x + w, bottom: y + h }
}

function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
}

function hasOverlapWithAny(movingId, pos, layoutMap, desktopItems = []) {
  const entry = { ...layoutMap[movingId], ...pos }
  const r = getWidgetRect(movingId, entry)
  for (const id of WIDGET_IDS) {
    if (id === movingId) continue
    const other = layoutMap[id]
    if (!other) continue
    const r2 = getWidgetRect(id, other)
    if (rectsOverlap(r, r2)) return true
  }
  for (const ir of getDesktopIconRects(desktopItems)) {
    if (rectsOverlap(r, ir)) return true
  }
  return false
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
          if (parsed[id].gridW != null) out[id].gridW = clampGrid(parsed[id].gridW)
          if (parsed[id].gridH != null) out[id].gridH = clampGrid(parsed[id].gridH)
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

function formatLocalYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

/** Defaults match desktop hero layout: helmet (large), motion bike (tall), WORK HARD (square). Indices 0-based into gallery manifest. */
const DEFAULT_PHOTO_WIDGET = {
  photoA: { galleryIndex: 34, cropPadding: 0 },
  photoB: { galleryIndex: 32, cropPadding: 0 },
  photoC: { galleryIndex: 27, cropPadding: 0 },
}

function readInitialPhotoMap() {
  const o = {}
  for (const id of PHOTO_IDS) {
    o[id] = loadPhotoWidgetState(id) ?? DEFAULT_PHOTO_WIDGET[id]
  }
  return o
}

export default function DesktopWidgets({
  desktopItems = [],
  onLayoutChange,
  onOpenApp,
}) {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState({ status: 'idle', days: [], error: null })
  const [layout, setLayout] = useState(loadLayout)
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [sizeMenuFor, setSizeMenuFor] = useState(null)
  const [photoImportFor, setPhotoImportFor] = useState(null)
  const [photoData, setPhotoData] = useState(readInitialPhotoMap)
  const [notesStore, setNotesStore] = useState(() => loadNotesStore())
  const dragRef = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const containerRef = useRef(null)
  const sizePopoverRef = useRef(null)
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    next: playNext,
    prev: playPrev,
    progressSec,
    durationSec,
    seekTo,
  } = useMusicPlayer()
  const {
    color1: bgColor1,
    color2: bgColor2,
    speed: bgSpeed,
    setColor1: setBgColor1,
    setColor2: setBgColor2,
    setSpeed: setBgSpeed,
  } = useDesktopBackground()

  const onMeshColorsFromWheel = useCallback(
    (colors) => {
      if (!colors?.length) return
      if (colors.length >= 2) {
        setBgColor1(colors[0])
        setBgColor2(colors[1])
      } else if (colors[0]) {
        setBgColor2(colors[0])
      }
    },
    [setBgColor1, setBgColor2],
  )

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const sync = () => setNotesStore(loadNotesStore())
    window.addEventListener(NOTES_CHANGED_EVENT, sync)
    const onStorage = (e) => {
      if (e.key === 'portfolio-notes-v1') sync()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(NOTES_CHANGED_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    onLayoutChange?.(layout)
  }, [layout, onLayoutChange])

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

  const weatherWeekSlots = useMemo(() => {
    if (weather.status !== 'ready' || !weather.days?.length) return []
    const byDate = Object.fromEntries(weather.days.map((x) => [x.date, x]))
    const today = new Date()
    const keyToday = formatLocalYMD(today)
    const sun = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const slots = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + i)
      const key = formatLocalYMD(d)
      const data = byDate[key]
      slots.push({
        key,
        dayNum: d.getDate(),
        isToday: key === keyToday,
        dowLabel: d.toLocaleDateString(undefined, { weekday: 'short' }),
        high: data?.high,
        code: data?.code,
      })
    }
    return slots
  }, [weather])

  const clampPos = useCallback((id, x, y, layoutMap) => {
    const el = containerRef.current
    if (!el) return { x, y }
    const rect = el.getBoundingClientRect()
    const entry = layoutMap[id] || DEFAULT_LAYOUT[id]
    const { w, h } = getBoxSize(id, entry)
    const maxX = Math.max(0, rect.width - w)
    const minY = DESKTOP_SAFE_TOP
    const maxY = Math.max(minY, rect.height - h)
    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    }
  }, [])

  /** Pick the valid position closest to the drop point (not top-left scan order). */
  const nudgeToFreeSpot = useCallback(
    (movingId, layoutMap) => {
      const el = containerRef.current
      if (!el) return layoutMap
      const base = { ...layoutMap[movingId] }
      const rect = el.getBoundingClientRect()
      const { w, h } = getBoxSize(movingId, base)
      const maxX = Math.max(0, rect.width - w)
      const maxY = Math.max(0, rect.height - h)
      const cx = base.x
      const cy = base.y
      const step = 6
      let bestCand = null
      let bestDist = Infinity
      for (let gy = 0; gy <= maxY; gy += step) {
        for (let gx = 0; gx <= maxX; gx += step) {
          const cand = clampPos(movingId, gx, gy, layoutMap)
          const merged = { ...layoutMap, [movingId]: { ...base, ...cand } }
          if (!hasOverlapWithAny(movingId, cand, merged, desktopItems)) {
            const d = (cand.x - cx) ** 2 + (cand.y - cy) ** 2
            if (d < bestDist) {
              bestDist = d
              bestCand = cand
            }
          }
        }
      }
      if (bestCand) return { ...layoutMap, [movingId]: { ...base, ...bestCand } }
      return layoutMap
    },
    [clampPos, desktopItems],
  )

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
      setDraggingId(id)
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
          const candidate = clampPos(d.id, d.origX + dx, d.origY + dy, prev)
          return { ...prev, [d.id]: { ...prev[d.id], ...candidate } }
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
        setDraggingId(null)
        setLayout((prev) => {
          let next = prev
          for (const wid of WIDGET_IDS) {
            const p = next[wid]
            if (!p) continue
            if (hasOverlapWithAny(wid, { x: p.x, y: p.y }, next, desktopItems)) {
              next = nudgeToFreeSpot(wid, next)
            }
          }
          saveLayout(next)
          return next
        })
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [layout, clampPos, nudgeToFreeSpot, desktopItems],
  )

  const applyPhotoGrid = useCallback(
    (id, gridW, gridH) => {
      setLayout((prev) => {
        const base = { ...prev[id], gridW: clampGrid(gridW), gridH: clampGrid(gridH) }
        const pos = clampPos(id, base.x, base.y, { ...prev, [id]: base })
        let next = { ...prev, [id]: { ...base, ...pos } }
        if (hasOverlapWithAny(id, pos, next, desktopItems)) {
          next = nudgeToFreeSpot(id, next)
        }
        saveLayout(next)
        return next
      })
      setSizeMenuFor(null)
    },
    [clampPos, nudgeToFreeSpot, desktopItems],
  )

  const handlePhotoApply = useCallback((pid, state) => {
    savePhotoWidgetState(pid, state)
    setPhotoData((prev) => ({ ...prev, [pid]: state }))
    setPhotoImportFor(null)
  }, [])

  const pinnedItems = useMemo(
    () => getPinnedChecklistItems(notesStore.pinnedNoteId, notesStore.notes),
    [notesStore],
  )

  const togglePinnedItem = useCallback((itemId, done) => {
    setPinnedChecklistItemDone(notesStore, itemId, done)
  }, [notesStore])

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
    return {
      left: p.x,
      top: p.y,
      width: w,
      height: h,
      zIndex: draggingId === id ? 10000 : undefined,
    }
  }

  const gridRange = useMemo(
    () => Array.from({ length: GRID_MAX - GRID_MIN + 1 }, (_, i) => GRID_MIN + i),
    [],
  )

  return (
    <div ref={containerRef} className="desktop-widgets" aria-hidden>
      {photoImportFor && (
        <PhotoWidgetImportModal
          lastState={photoData[photoImportFor]}
          onClose={() => setPhotoImportFor(null)}
          onApply={(state) => handlePhotoApply(photoImportFor, state)}
        />
      )}

      <div className="desktop-widgets__card desktop-widgets__card--calendar" style={cardStyle('calendar')}>
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move calendar widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'calendar')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="desktop-widgets__adaptive desktop-widgets__cal-rdp">
          <Calendar
            mode="single"
            month={calMonth}
            onMonthChange={(d) => setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1))}
            selected={selectedDate}
            onSelect={(d) => {
              if (d) {
                setSelectedDate(d)
                setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1))
              }
            }}
            weekStartsOn={0}
            className="w-full rounded-xl [--cell-size:1.65rem] sm:[--cell-size:1.65rem]"
          />
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
          <div className="desktop-widgets__adaptive desktop-widgets__clock-main">
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
        <div className="desktop-widgets__adaptive desktop-widgets__weather-body">
          <div className="desktop-widgets__card-title desktop-widgets__weather-city">San Diego</div>
          {weather.status === 'loading' && <p className="desktop-widgets__muted">Loading…</p>}
          {weather.status === 'error' && <p className="desktop-widgets__muted">{weather.error}</p>}
          {weather.status === 'ready' && (
          <div className="desktop-widgets__weather-strip">
            {weatherWeekSlots.map((slot) => {
              const hi = slot.high != null ? Math.round(slot.high) : '—'
              const Ico = weatherCodeToIcon(slot.code)
              return (
                <div
                  key={slot.key}
                  className={`desktop-widgets__weather-day ${slot.isToday ? 'desktop-widgets__weather-day--today' : ''}`}
                >
                  <div className="desktop-widgets__weather-day-top">
                    {slot.isToday ? (
                      <span className="desktop-widgets__weather-date-badge">{slot.dayNum}</span>
                    ) : (
                      <span className="desktop-widgets__weather-date-placeholder" aria-hidden />
                    )}
                  </div>
                  <span className="desktop-widgets__weather-dow">{slot.dowLabel}</span>
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
      </div>

      <div className="desktop-widgets__card desktop-widgets__card--bg-controls" style={cardStyle('bgControls')}>
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move background controls widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'bgControls')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="desktop-widgets__bg-controls-body desktop-widgets__bg-controls-body--compact">
          <div className="desktop-widgets__bg-wheel-square">
            <ColorPicker
              size={100}
              padding={8}
              bulletRadius={11}
              numPoints={2}
              minLight={6}
              maxLight={38}
              maxSaturation={52}
              showColorWheel
              initialPrimaryHex={bgColor2}
              onColorChange={onMeshColorsFromWheel}
            />
          </div>
          <div className="desktop-widgets__bg-speed-wrap">
            <BackgroundMotionSlider
              min={0.15}
              max={1.5}
              step={0.03}
              value={bgSpeed}
              onChange={setBgSpeed}
              aria-label="Background motion speed"
            />
          </div>
        </div>
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
        <div className="desktop-widgets__ipod">
          <div className="desktop-widgets__ipod-chassis">
            <div className="desktop-widgets__ipod-screen">
              {currentTrack ? (
                <>
                  <div className="desktop-widgets__ipod-screen-bezel" />
                  <div
                    className="desktop-widgets__ipod-screen-glass"
                    style={{
                      backgroundImage: `url(${currentTrack.thumbnail})`,
                    }}
                  />
                  <div className="desktop-widgets__ipod-screen-content">
                    <img
                      src={currentTrack.thumbnail}
                      alt=""
                      className="desktop-widgets__ipod-art"
                      width={44}
                      height={44}
                    />
                    <div className="desktop-widgets__adaptive desktop-widgets__ipod-meta">
                      <div className="desktop-widgets__ipod-title">{currentTrack.title}</div>
                      <div className="desktop-widgets__ipod-artist">
                        {currentTrack.artist || 'YouTube Music'}
                      </div>
                    </div>
                  </div>
                  <div
                    role="slider"
                    tabIndex={0}
                    aria-valuemin={0}
                    aria-valuemax={Math.max(0, durationSec || 0)}
                    aria-valuenow={progressSec}
                    className="desktop-widgets__ipod-bar"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      const el = e.currentTarget
                      const apply = (clientX) => {
                        const rect = el.getBoundingClientRect()
                        const d = durationSec > 0 ? durationSec : 1
                        const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
                        seekTo(p * d)
                      }
                      apply(e.clientX)
                      const move = (ev) => apply(ev.clientX)
                      const up = () => {
                        window.removeEventListener('pointermove', move)
                        window.removeEventListener('pointerup', up)
                      }
                      window.addEventListener('pointermove', move)
                      window.addEventListener('pointerup', up)
                    }}
                    onKeyDown={(e) => {
                      const d = durationSec > 0 ? durationSec : 0
                      if (!d) return
                      if (e.key === 'ArrowRight') seekTo(Math.min(d, progressSec + 5))
                      if (e.key === 'ArrowLeft') seekTo(Math.max(0, progressSec - 5))
                    }}
                  >
                    <div
                      className="desktop-widgets__ipod-bar-fill"
                      style={{
                        width: `${durationSec > 0 ? Math.min(100, (100 * progressSec) / durationSec) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="desktop-widgets__adaptive desktop-widgets__ipod-times">
                    <span>{formatTrackTime(progressSec)}</span>
                    <span>{formatTrackTime(durationSec)}</span>
                  </div>
                </>
              ) : (
                <div className="desktop-widgets__adaptive desktop-widgets__ipod-idle">Nothing playing</div>
              )}
            </div>
            <div className="desktop-widgets__ipod-wheel-wrap">
              <div className="desktop-widgets__adaptive desktop-widgets__ipod-wheel">
                <button
                  type="button"
                  className="desktop-widgets__ipod-wheel-label desktop-widgets__ipod-wheel-label--menu"
                  onClick={() => onOpenApp?.('youtubeMusic')}
                >
                  MENU
                </button>
                <button
                  type="button"
                  className="desktop-widgets__ipod-wheel-btn desktop-widgets__ipod-wheel-btn--prev"
                  onClick={() => playPrev()}
                  aria-label="Previous track"
                >
                  <SkipBack size={15} strokeWidth={2.35} />
                </button>
                <button
                  type="button"
                  className="desktop-widgets__ipod-wheel-btn desktop-widgets__ipod-wheel-btn--next"
                  onClick={() => playNext()}
                  aria-label="Next track"
                >
                  <SkipForward size={15} strokeWidth={2.35} />
                </button>
                <button
                  type="button"
                  className="desktop-widgets__ipod-wheel-center"
                  onClick={() => togglePlay()}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={16} strokeWidth={2.4} /> : <Play size={16} strokeWidth={2.4} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="desktop-widgets__card desktop-widgets__card--notes" style={cardStyle('notesChecklist')}>
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move notes widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'notesChecklist')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="desktop-widgets__adaptive desktop-widgets__notes-head">
          <ListTodo size={14} strokeWidth={2} aria-hidden />
          <span className="desktop-widgets__card-title desktop-widgets__card-title--inline">Pinned note</span>
        </div>
        {!notesStore.pinnedNoteId ? (
          <p className="desktop-widgets__adaptive desktop-widgets__muted desktop-widgets__muted--small">
            Open Notes and pin a note for this list.
          </p>
        ) : pinnedItems.length === 0 ? (
          <p className="desktop-widgets__adaptive desktop-widgets__muted desktop-widgets__muted--small">
            No checklist items yet.
          </p>
        ) : (
          <ul className="desktop-widgets__adaptive desktop-widgets__notes-list">
            {pinnedItems.map((it) => (
              <li key={it.id} className="desktop-widgets__notes-item">
                <label className="desktop-widgets__notes-check-label">
                  <input
                    type="checkbox"
                    checked={!!it.done}
                    onChange={(e) => togglePinnedItem(it.id, e.target.checked)}
                  />
                  <span className={it.done ? 'desktop-widgets__notes-text desktop-widgets__notes-text--done' : 'desktop-widgets__notes-text'}>
                    {it.text || '—'}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {PHOTO_IDS.map((pid) => {
        const open = sizeMenuFor === pid
        const pdata = photoData[pid]
        const layoutEntry = layout[pid] || DEFAULT_LAYOUT[pid]
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
                className="desktop-widgets__sync-trigger"
                aria-label="Import from Photos gallery"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setPhotoImportFor(pid)
                }}
              >
                <RefreshCw size={14} strokeWidth={2} />
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
              <div ref={sizePopoverRef} className="desktop-widgets__size-popover desktop-widgets__size-popover--grid" role="group" aria-label="Photo widget grid size">
                <div className="desktop-widgets__size-select-row">
                  <label className="desktop-widgets__size-select-label">
                    Width
                    <select
                      className="desktop-widgets__size-select"
                      value={clampGrid(layoutEntry.gridW)}
                      onChange={(e) => applyPhotoGrid(pid, Number(e.target.value), clampGrid(layoutEntry.gridH))}
                    >
                      {gridRange.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="desktop-widgets__size-mul">×</span>
                  <label className="desktop-widgets__size-select-label">
                    Height
                    <select
                      className="desktop-widgets__size-select"
                      value={clampGrid(layoutEntry.gridH)}
                      onChange={(e) => applyPhotoGrid(pid, clampGrid(layoutEntry.gridW), Number(e.target.value))}
                    >
                      {gridRange.map((n) => (
                        <option key={`h-${n}`} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
            <div className="desktop-widgets__photo-body">
              {pdata ? (
                <img
                  src={getImagePath(pdata.galleryIndex)}
                  alt=""
                  className="desktop-widgets__photo-img"
                  style={{ clipPath: `inset(${pdata.cropPadding ?? 0}%)` }}
                />
              ) : (
                <div className="desktop-widgets__photo-placeholder">
                  <ImageIcon size={28} strokeWidth={1.25} aria-hidden />
                  <span className="desktop-widgets__photo-hint">Photo</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
