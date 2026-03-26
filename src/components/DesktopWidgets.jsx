import { useState, useEffect, useMemo, useCallback, useRef, useId, useLayoutEffect } from 'react'
import {
  Play,
  Pause,
  GripVertical,
  SkipBack,
  SkipForward,
  ImageIcon,
  RefreshCw,
  ListTodo,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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
import {
  STATIC_WIDGET_IDS,
  NON_RESIZABLE_WIDGET_IDS,
  CELL,
  clampGrid,
  defaultStaticGrid,
  defaultGridForWidget,
  getBoxSizeForWidget,
  getWidgetRectFromEntry,
} from '../lib/widgetLayoutShared'
import {
  loadPhotoWidgetIdList,
  savePhotoWidgetIdList,
  generatePhotoWidgetId,
  ADD_PHOTO_WIDGET_EVENT,
} from '../lib/photoWidgetRegistry'
import PhotoWidgetImportModal from './PhotoWidgetImportModal'
import { DESKTOP_SAFE_TOP } from '../desktopConstants'
import { getDesktopIconRects } from '../lib/widgetOverlapGeometry'
import './DesktopWidgets.css'

const SD_LAT = 32.72
const SD_LON = -117.16
const LAYOUT_KEY = 'desktop-widget-layout'

/** Month grid cells: null = empty pad, number = day of month (local timezone). */
function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const pad = first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < pad; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function weatherGraphicVariant(code) {
  if (code == null || Number.isNaN(code)) return 'cloud'
  const c = code
  if (c === 0 || c === 1) return 'clear'
  if (c === 2 || c === 3) return 'cloud'
  if (c === 45 || c === 48) return 'fog'
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain'
  if ((c >= 71 && c <= 77) || (c >= 85 && c <= 86)) return 'snow'
  if (c >= 95) return 'storm'
  return 'cloud'
}

/** Halftone / gradient weather illustration driven by WMO weather_code (spread dots + soft vertical fade). */
function WeatherConditionGraphic({ code, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const pid = `wtp-${uid}`
  const gid = `wtg-${uid}`
  const mid = `wtm-${uid}`
  const variant = weatherGraphicVariant(code)

  const patternSize = 14
  const dotR = 1.35

  let clipInner = null
  if (variant === 'clear') {
    clipInner = <ellipse cx="100" cy="62" rx="56" ry="52" />
  } else if (variant === 'cloud' || variant === 'fog') {
    clipInner = (
      <g>
        <circle cx="78" cy="68" r="28" />
        <circle cx="118" cy="64" r="32" />
        <circle cx="148" cy="70" r="24" />
        <rect x="54" y="66" width="112" height="38" rx="19" />
      </g>
    )
  } else if (variant === 'rain' || variant === 'storm') {
    clipInner = (
      <g>
        <circle cx="78" cy="58" r="26" />
        <circle cx="116" cy="54" r="30" />
        <circle cx="146" cy="60" r="22" />
        <rect x="52" y="56" width="108" height="36" rx="18" />
        <rect x="40" y="88" width="140" height="36" />
      </g>
    )
  } else if (variant === 'snow') {
    clipInner = (
      <g>
        <circle cx="80" cy="58" r="26" />
        <circle cx="118" cy="54" r="30" />
        <rect x="54" y="56" width="108" height="36" rx="18" />
        <rect x="36" y="82" width="152" height="44" />
      </g>
    )
  }

  const rainLines =
    variant === 'rain' || variant === 'storm' ? (
      <g opacity={0.45} stroke="#a8c4d8" strokeWidth={1.2} strokeLinecap="round">
        {[0, 14, 28, 42, 56, 70, 84, 98].map((x, i) => (
          <line key={i} x1={46 + x} y1={96} x2={38 + x} y2={118} />
        ))}
      </g>
    ) : null

  const snowDots =
    variant === 'snow' ? (
      <g fill="rgba(255,255,255,0.5)">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <circle key={i} cx={52 + (i % 3) * 36} cy={94 + Math.floor(i / 3) * 14} r={1.8} />
        ))}
      </g>
    ) : null

  const bolt =
    variant === 'storm' ? (
      <path
        d="M108 22 L98 48 L112 48 L96 78 L118 44 L102 44 Z"
        fill="rgba(255,220,120,0.35)"
        stroke="rgba(255,230,160,0.5)"
        strokeWidth={0.8}
      />
    ) : null

  return (
    <svg className={className} viewBox="0 0 200 126" aria-hidden>
      <defs>
        <pattern id={pid} width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
          <circle cx={patternSize / 2} cy={patternSize / 2} r={dotR} fill="#ffffff" />
        </pattern>
        <linearGradient id={gid} x1="0" y1="126" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>
        <mask id={mid}>
          <rect width="200" height="126" fill={`url(#${gid})`} />
        </mask>
        {clipInner ? <clipPath id={`wtc-${uid}`}>{clipInner}</clipPath> : null}
      </defs>
      {bolt}
      {clipInner ? (
        <g clipPath={`url(#wtc-${uid})`}>
          <rect width="200" height="126" fill={`url(#${pid})`} mask={`url(#${mid})`} />
        </g>
      ) : (
        <rect width="200" height="126" fill={`url(#${pid})`} mask={`url(#${mid})`} />
      )}
      {rainLines}
      {snowDots}
    </svg>
  )
}

/** Slate + cream calendar; right column height tracks left column. Dates use device local time. */
function RetroCalendarWidget({ viewMonth, now, onPrevMonth, onNextMonth }) {
  const y = viewMonth.getFullYear()
  const m = viewMonth.getMonth()
  const cells = useMemo(() => buildMonthCells(y, m), [y, m])
  const monthName = viewMonth.toLocaleString(undefined, { month: 'long' }).toUpperCase()
  const dowToday = now.toLocaleString(undefined, { weekday: 'short' }).toUpperCase()
  const dayToday = String(now.getDate())
  const wrapRef = useRef(null)
  const leftRef = useRef(null)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const left = leftRef.current
    if (!wrap || !left) return
    const sync = () => {
      const h = Math.ceil(left.getBoundingClientRect().height)
      wrap.style.setProperty('--retro-cal-left-h', `${Math.max(72, h)}px`)
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(left)
    return () => ro.disconnect()
  }, [y, m, now])

  const isToday = (day) =>
    day != null &&
    now.getFullYear() === y &&
    now.getMonth() === m &&
    now.getDate() === day

  return (
    <div className="desktop-widgets__retro-cal" ref={wrapRef}>
      <div className="desktop-widgets__retro-cal-summary" ref={leftRef}>
        <div className="desktop-widgets__retro-cal-dow">{dowToday}</div>
        <div className="desktop-widgets__retro-cal-day-big">{dayToday}</div>
      </div>
      <div className="desktop-widgets__retro-cal-main">
        <div className="desktop-widgets__retro-cal-month-row">
          <button
            type="button"
            className="desktop-widgets__retro-cal-nav"
            aria-label="Previous month"
            onClick={onPrevMonth}
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
          </button>
          <span className="desktop-widgets__retro-cal-month">{monthName}</span>
          <button
            type="button"
            className="desktop-widgets__retro-cal-nav"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            <ChevronRight size={16} strokeWidth={2.25} />
          </button>
        </div>
        <div className="desktop-widgets__retro-cal-dow-row" aria-hidden>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((letter, i) => (
            <span key={`${letter}-${i}`} className="desktop-widgets__retro-cal-dow-cell">
              {letter}
            </span>
          ))}
        </div>
        <div className="desktop-widgets__retro-cal-grid" role="grid" aria-label={`Calendar ${monthName} ${y}`}>
          {cells.map((day, idx) => (
            <div key={idx} className="desktop-widgets__retro-cal-cell" role="presentation">
              {day != null ? (
                <span
                  className={
                    isToday(day)
                      ? 'desktop-widgets__retro-cal-num desktop-widgets__retro-cal-num--today'
                      : 'desktop-widgets__retro-cal-num'
                  }
                >
                  {day}
                </span>
              ) : (
                <span className="desktop-widgets__retro-cal-num desktop-widgets__retro-cal-num--empty" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Hands-only clock as the “O” in NOW (no ring); local time from `date`. */
function QuoteAnalogClockO({ date }) {
  const h = (date.getHours() % 12) + date.getMinutes() / 60 + date.getSeconds() / 3600
  const hourDeg = h * 30
  const minDeg = date.getMinutes() * 6 + date.getSeconds() * 0.1
  const secDeg = date.getSeconds() * 6
  const label = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return (
    <span className="desktop-widgets__quote-o-wrap" role="timer" aria-live="polite" aria-label={`Time ${label}`}>
      <svg className="desktop-widgets__quote-o-svg" viewBox="0 0 100 100" aria-hidden>
        <g transform="translate(50,50)">
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-26"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            transform={`rotate(${hourDeg})`}
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-36"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${minDeg})`}
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-40"
            stroke="#ff2d2d"
            strokeWidth="1.35"
            strokeLinecap="round"
            transform={`rotate(${secDeg})`}
          />
          <circle cx="0" cy="0" r="4" fill="#fff" />
        </g>
      </svg>
    </span>
  )
}

function QuoteTimeWidget({ date }) {
  return (
    <div className="desktop-widgets__quote-widget">
      <p className="desktop-widgets__quote-line desktop-widgets__quote-line--1">There is no</p>
      <p className="desktop-widgets__quote-line desktop-widgets__quote-line--2">perfect timing</p>
      <p className="desktop-widgets__quote-line desktop-widgets__quote-line--3">
        <span className="desktop-widgets__quote-now-prefix">DO IT N</span>
        <QuoteAnalogClockO date={date} />
        <span className="desktop-widgets__quote-now-suffix">W</span>
      </p>
      <p className="desktop-widgets__quote-watermark">@office_oasis</p>
    </div>
  )
}

function buildPrecipHeadline(hourly) {
  if (!hourly?.length) {
    return { textBefore: 'Loading forecast…', bold: '', textAfter: '' }
  }
  const p0 = typeof hourly[0]?.precipProb === 'number' ? hourly[0].precipProb : 0
  const p1 = typeof hourly[1]?.precipProb === 'number' ? hourly[1].precipProb : 0
  if (p0 < 18 && p1 < 18) {
    return { textBefore: 'No rain is expected in the next ', bold: '2 hours', textAfter: '.' }
  }
  if (p0 >= 45 || p1 >= 45) {
    return { textBefore: 'Rain likely in the next ', bold: '2 hours', textAfter: '.' }
  }
  return { textBefore: 'Stay aware — chance of rain in the next ', bold: 'few hours', textAfter: '.' }
}

function formatTrackTime(sec) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const DEFAULT_LAYOUT = {
  calendar: { x: 20, y: 56, ...defaultStaticGrid('calendar') },
  clock: { x: 240, y: 56, ...defaultStaticGrid('clock') },
  weather: { x: 20, y: 300, ...defaultStaticGrid('weather') },
  music: { x: 240, y: 300, ...defaultStaticGrid('music') },
  bgControls: { x: 1000, y: 420, ...defaultStaticGrid('bgControls') },
  notesChecklist: { x: 480, y: 300, ...defaultStaticGrid('notesChecklist') },
  photoA: { x: 24, y: 260, gridW: 8, gridH: 12 },
  photoB: { x: 400, y: 56, gridW: 6, gridH: 8 },
  photoC: { x: 860, y: 56, gridW: 8, gridH: 7 },
}

function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
}

function hasOverlapWithAny(movingId, pos, layoutMap, desktopItems, widgetIds) {
  const entry = { ...layoutMap[movingId], ...pos }
  const r = getWidgetRectFromEntry(movingId, entry)
  for (const id of widgetIds) {
    if (id === movingId) continue
    const other = layoutMap[id]
    if (!other) continue
    const r2 = getWidgetRectFromEntry(id, other)
    if (rectsOverlap(r, r2)) return true
  }
  for (const ir of getDesktopIconRects(desktopItems)) {
    if (rectsOverlap(r, ir)) return true
  }
  return false
}

function loadLayout(photoIdList) {
  const ids = [...STATIC_WIDGET_IDS, ...photoIdList]
  const out = {}
  for (const id of STATIC_WIDGET_IDS) {
    out[id] = { ...DEFAULT_LAYOUT[id] }
  }
  for (const id of photoIdList) {
    const def = defaultGridForWidget(id)
    out[id] = {
      ...(DEFAULT_LAYOUT[id] || {
        x: 32 + (photoIdList.indexOf(id) % 5) * 56,
        y: 240 + Math.floor(photoIdList.indexOf(id) / 5) * 40,
        ...def,
      }),
    }
  }
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      for (const id of ids) {
        if (parsed[id]?.x != null && parsed[id]?.y != null) {
          const defG = defaultGridForWidget(id)
          const prev = out[id] || { x: 100, y: 300, ...defG }
          out[id] = {
            ...prev,
            x: parsed[id].x,
            y: parsed[id].y,
            gridW: parsed[id].gridW != null ? clampGrid(parsed[id].gridW) : clampGrid(prev.gridW ?? defG.gridW),
            gridH: parsed[id].gridH != null ? clampGrid(parsed[id].gridH) : clampGrid(prev.gridH ?? defG.gridH),
          }
        }
      }
    }
  } catch {
    // keep out
  }

  for (const id of STATIC_WIDGET_IDS) {
    const def = defaultStaticGrid(id)
    const base = { ...DEFAULT_LAYOUT[id], ...out[id] }
    const locked = NON_RESIZABLE_WIDGET_IDS.includes(id)
    out[id] = {
      ...base,
      gridW: locked ? def.gridW : clampGrid(base.gridW ?? def.gridW),
      gridH: locked ? def.gridH : clampGrid(base.gridH ?? def.gridH),
    }
  }
  for (const id of photoIdList) {
    const def = defaultGridForWidget(id)
    const base = out[id] || { x: 80, y: 300, ...def }
    out[id] = {
      ...base,
      gridW: clampGrid(base.gridW ?? def.gridW),
      gridH: clampGrid(base.gridH ?? def.gridH),
    }
  }
  return out
}

function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch {
    // ignore
  }
}

function weatherCodeToShortLabel(code) {
  if (code == null || Number.isNaN(code)) return 'Weather'
  const c = code
  if (c === 0) return 'Clear'
  if (c === 1 || c === 2) return 'Mainly clear'
  if (c === 3) return 'Overcast'
  if (c === 45 || c === 48) return 'Fog'
  if (c >= 51 && c <= 55) return 'Drizzle'
  if (c === 56 || c === 57) return 'Freezing drizzle'
  if (c >= 61 && c <= 65) return 'Rain'
  if (c === 66 || c === 67) return 'Freezing rain'
  if (c >= 71 && c <= 77) return 'Snow'
  if (c >= 80 && c <= 82) return 'Rain showers'
  if (c >= 85 && c <= 86) return 'Snow showers'
  if (c >= 95) return 'Thunderstorm'
  return 'Weather'
}

/** Defaults match desktop hero layout: helmet (large), motion bike (tall), WORK HARD (square). Indices 0-based into gallery manifest. */
const DEFAULT_PHOTO_WIDGET = {
  photoA: { galleryIndex: 34, cropPadding: 0 },
  photoB: { galleryIndex: 32, cropPadding: 0 },
  photoC: { galleryIndex: 27, cropPadding: 0 },
}

function readInitialPhotoMap(photoIdList) {
  const o = {}
  for (const id of photoIdList) {
    o[id] = loadPhotoWidgetState(id) ?? DEFAULT_PHOTO_WIDGET[id] ?? { galleryIndex: 0, cropPadding: 0 }
  }
  return o
}

export default function DesktopWidgets({
  desktopItems = [],
  onLayoutChange,
  onOpenApp,
}) {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState({
    status: 'idle',
    current: null,
    hourly: [],
    dailyMax: null,
    dailyMin: null,
    error: null,
  })
  const [userLoc, setUserLoc] = useState({
    status: 'pending',
    lat: null,
    lon: null,
    label: '',
  })
  const [photoIds, setPhotoIds] = useState(() => loadPhotoWidgetIdList())
  const [layout, setLayout] = useState(() => loadLayout(loadPhotoWidgetIdList()))
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [photoImportFor, setPhotoImportFor] = useState(null)
  const [photoData, setPhotoData] = useState(() => readInitialPhotoMap(loadPhotoWidgetIdList()))
  const [notesStore, setNotesStore] = useState(() => loadNotesStore())
  const dragRef = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const [resizingWidgetId, setResizingWidgetId] = useState(null)
  const containerRef = useRef(null)
  const widgetResizeRef = useRef(null)
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

  const widgetIds = useMemo(() => [...STATIC_WIDGET_IDS, ...photoIds], [photoIds])

  useEffect(() => {
    setPhotoData((prev) => {
      const next = { ...prev }
      let changed = false
      for (const id of photoIds) {
        if (next[id] == null) {
          next[id] = loadPhotoWidgetState(id) ?? DEFAULT_PHOTO_WIDGET[id] ?? { galleryIndex: 0, cropPadding: 0 }
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [photoIds])

  useEffect(() => {
    setLayout((prev) => {
      let changed = false
      const next = { ...prev }
      for (const id of photoIds) {
        if (!next[id]) {
          const def = defaultGridForWidget(id)
          const n = photoIds.indexOf(id)
          next[id] = {
            x: 32 + (n % 5) * 56,
            y: 220 + Math.floor(n / 5) * 44,
            ...def,
          }
          changed = true
        }
      }
      if (changed) saveLayout(next)
      return changed ? next : prev
    })
  }, [photoIds])

  useEffect(() => {
    const handler = (e) => {
      const gi = e.detail?.galleryIndex
      if (typeof gi !== 'number' || !Number.isFinite(gi)) return
      const nid = generatePhotoWidgetId()
      setPhotoIds((prev) => {
        const next = [...prev, nid]
        savePhotoWidgetIdList(next)
        return next
      })
      setLayout((prev) => {
        const nPhoto = Object.keys(prev).filter((k) => k.startsWith('photo')).length
        const def = defaultGridForWidget(nid)
        const nextLay = {
          ...prev,
          [nid]: {
            x: 40 + (nPhoto % 6) * 48,
            y: 200 + Math.floor(nPhoto / 6) * 48,
            ...def,
          },
        }
        saveLayout(nextLay)
        return nextLay
      })
      const state = { galleryIndex: gi, cropPadding: 0 }
      savePhotoWidgetState(nid, state)
      setPhotoData((p) => ({ ...p, [nid]: state }))
    }
    window.addEventListener(ADD_PHOTO_WIDGET_EVENT, handler)
    return () => window.removeEventListener(ADD_PHOTO_WIDGET_EVENT, handler)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLoc({ status: 'fallback', lat: SD_LAT, lon: SD_LON, label: 'San Diego' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        let label = 'Local'
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
          )
          const j = await r.json()
          label = j.city || j.locality || j.principalSubdivision || label
        } catch {
          // keep "Local"
        }
        setUserLoc({ status: 'ok', lat, lon, label })
      },
      () => {
        setUserLoc({ status: 'denied', lat: SD_LAT, lon: SD_LON, label: 'San Diego' })
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300_000 },
    )
  }, [])

  const loadWeather = useCallback(async (lat, lon) => {
    setWeather((w) => ({ ...w, status: 'loading', error: null }))
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', String(lat))
      url.searchParams.set('longitude', String(lon))
      url.searchParams.set('current', 'temperature_2m,weather_code')
      url.searchParams.set('hourly', 'temperature_2m,weather_code,precipitation_probability')
      url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min')
      url.searchParams.set('forecast_days', '2')
      url.searchParams.set('timezone', 'auto')
      url.searchParams.set('temperature_unit', 'fahrenheit')
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('forecast failed')
      const data = await res.json()
      const cur = data.current
      const temp = cur?.temperature_2m
      const code = cur?.weather_code ?? cur?.weathercode
      if (temp == null && code == null) throw new Error('no current data')

      const hourlyTimes = data.hourly?.time ?? []
      const hourlyTemp = data.hourly?.temperature_2m ?? []
      const hourlyCode = data.hourly?.weather_code ?? []
      const hourlyPrecipProb = data.hourly?.precipitation_probability ?? []
      const curTime = cur?.time
      let startIdx = 0
      if (hourlyTimes.length) {
        if (curTime) {
          const at = hourlyTimes.findIndex((t) => t >= curTime)
          startIdx = at >= 0 ? at : Math.max(0, hourlyTimes.length - 6)
        }
      }
      const hourly = []
      for (let i = 0; i < 6; i++) {
        const j = startIdx + i
        if (j >= hourlyTimes.length) break
        hourly.push({
          time: hourlyTimes[j],
          temp: hourlyTemp[j],
          code: hourlyCode[j],
          precipProb: hourlyPrecipProb[j] ?? null,
        })
      }

      const dailyMax = data.daily?.temperature_2m_max?.[0] ?? null
      const dailyMin = data.daily?.temperature_2m_min?.[0] ?? null

      setWeather({
        status: 'ready',
        current: { temp, code },
        hourly,
        dailyMax,
        dailyMin,
        error: null,
      })
    } catch (e) {
      setWeather({
        status: 'error',
        current: null,
        hourly: [],
        dailyMax: null,
        dailyMin: null,
        error: e?.message || 'unavailable',
      })
    }
  }, [])

  useEffect(() => {
    if (userLoc.lat == null || userLoc.lon == null) return
    loadWeather(userLoc.lat, userLoc.lon)
  }, [userLoc.lat, userLoc.lon, loadWeather])

  const clampPos = useCallback((id, x, y, layoutMap) => {
    const el = containerRef.current
    if (!el) return { x, y }
    const rect = el.getBoundingClientRect()
    const entry = layoutMap[id] || DEFAULT_LAYOUT[id]
    const { w, h } = getBoxSizeForWidget(id, entry)
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
      const { w, h } = getBoxSizeForWidget(movingId, base)
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
          if (!hasOverlapWithAny(movingId, cand, merged, desktopItems, widgetIds)) {
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
    [clampPos, desktopItems, widgetIds],
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
          for (const wid of widgetIds) {
            const p = next[wid]
            if (!p) continue
            if (hasOverlapWithAny(wid, { x: p.x, y: p.y }, next, desktopItems, widgetIds)) {
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
    [layout, clampPos, nudgeToFreeSpot, desktopItems, widgetIds],
  )

  const handleWidgetResizePointerDown = useCallback(
    (e, wid) => {
      if (e.button !== 0) return
      if (NON_RESIZABLE_WIDGET_IDS.includes(wid)) return
      e.stopPropagation()
      e.preventDefault()
      const entry = layout[wid] || DEFAULT_LAYOUT[wid]
      const origW = clampGrid(entry.gridW)
      const origH = clampGrid(entry.gridH)
      setResizingWidgetId(wid)
      widgetResizeRef.current = {
        wid,
        startX: e.clientX,
        startY: e.clientY,
        origW,
        origH,
      }
      const handleEl = e.currentTarget
      const capId = e.pointerId
      try {
        handleEl.setPointerCapture(capId)
      } catch {
        // ignore
      }

      const onMove = (ev) => {
        const d = widgetResizeRef.current
        if (!d) return
        const nextW = clampGrid(d.origW + Math.round((ev.clientX - d.startX) / CELL))
        const nextH = clampGrid(d.origH + Math.round((ev.clientY - d.startY) / CELL))
        setLayout((prev) => {
          const base = { ...(prev[d.wid] || DEFAULT_LAYOUT[d.wid]), gridW: nextW, gridH: nextH }
          const pos = clampPos(d.wid, base.x, base.y, { ...prev, [d.wid]: base })
          return { ...prev, [d.wid]: { ...base, ...pos } }
        })
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        try {
          handleEl.releasePointerCapture(capId)
        } catch {
          // ignore
        }
        widgetResizeRef.current = null
        setResizingWidgetId(null)
        setLayout((prev) => {
          let next = prev
          for (const id of widgetIds) {
            const p = next[id]
            if (!p) continue
            if (hasOverlapWithAny(id, { x: p.x, y: p.y }, next, desktopItems, widgetIds)) {
              next = nudgeToFreeSpot(id, next)
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
    [layout, clampPos, nudgeToFreeSpot, desktopItems, widgetIds],
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

  const cardClass = (id, extra) =>
    `desktop-widgets__card ${extra}${resizingWidgetId === id ? ' desktop-widgets__card--resizing' : ''}`.trim()

  const cardStyle = (id) => {
    const p = layout[id] || DEFAULT_LAYOUT[id]
    const { w, h } = getBoxSizeForWidget(id, p)
    return {
      left: p.x,
      top: p.y,
      width: w,
      height: h,
      zIndex: draggingId === id ? 10000 : undefined,
    }
  }

  return (
    <div ref={containerRef} className="desktop-widgets" aria-hidden>
      {photoImportFor && (
        <PhotoWidgetImportModal
          lastState={photoData[photoImportFor]}
          onClose={() => setPhotoImportFor(null)}
          onApply={(state) => handlePhotoApply(photoImportFor, state)}
        />
      )}

      <div
        className={cardClass('calendar', 'desktop-widgets__card--calendar desktop-widgets__card--has-drag-strip')}
        style={cardStyle('calendar')}
      >
        <div className="desktop-widgets__calendar-widget-body">
          <RetroCalendarWidget
            viewMonth={calMonth}
            now={now}
            onPrevMonth={() =>
              setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
            }
            onNextMonth={() =>
              setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
            }
          />
        </div>
        <button
          type="button"
          className="desktop-widgets__drag-strip"
          aria-label="Move calendar widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'calendar')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize calendar widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'calendar')}
        />
      </div>

      <div
        className={cardClass('clock', 'desktop-widgets__card--clock desktop-widgets__card--has-drag-strip')}
        style={cardStyle('clock')}
      >
        <div className="desktop-widgets__quote-widget-shell desktop-widgets__blend">
          <QuoteTimeWidget date={now} />
        </div>
        <button
          type="button"
          className="desktop-widgets__drag-strip"
          aria-label="Move clock widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'clock')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize clock widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'clock')}
        />
      </div>

      <div
        className={cardClass(
          'weather',
          'desktop-widgets__card--weather desktop-widgets__card--glass liquid-glass-panel desktop-widgets__card--has-drag-strip',
        )}
        style={cardStyle('weather')}
      >
        <div className="desktop-widgets__glass-chrome desktop-widgets__weather-square-wrap">
          {weather.status === 'loading' && (
            <div className="desktop-widgets__weather-square desktop-widgets__weather-square--loading">
              <p className="desktop-widgets__weather-square__status">Loading…</p>
            </div>
          )}
          {weather.status === 'error' && (
            <div className="desktop-widgets__weather-square desktop-widgets__weather-square--loading">
              <p className="desktop-widgets__weather-square__status">{weather.error}</p>
            </div>
          )}
          {weather.status === 'ready' && weather.current ? (
            <div className="desktop-widgets__weather-square">
              <div className="desktop-widgets__weather-square__header">
                <span className="desktop-widgets__weather-square__temp-now">
                  {weather.current.temp != null && Number.isFinite(weather.current.temp)
                    ? Math.round(weather.current.temp)
                    : '—'}
                  °F
                </span>
                <p className="desktop-widgets__weather-square__blurb">
                  {(() => {
                    const h = buildPrecipHeadline(weather.hourly)
                    return (
                      <>
                        {h.textBefore}
                        {h.bold ? <strong>{h.bold}</strong> : null}
                        {h.textAfter}
                      </>
                    )
                  })()}
                </p>
              </div>
              <div className="desktop-widgets__weather-square__graphic">
                <WeatherConditionGraphic
                  code={weather.current?.code}
                  className="desktop-widgets__weather-square__cloud"
                />
              </div>
              {weather.hourly?.length > 0 ? (
                <div className="desktop-widgets__weather-square__hourly">
                  {weather.hourly.slice(0, 4).map((slot, idx) => {
                    const t = slot.time ? new Date(slot.time) : null
                    const timeLabel = t
                      ? t.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                      : '—'
                    return (
                      <div
                        key={slot.time ?? idx}
                        className={`desktop-widgets__weather-square__hour-col${idx < 3 ? ' desktop-widgets__weather-square__hour-col--divider' : ''}`}
                      >
                        <span className="desktop-widgets__weather-square__hour-time">{timeLabel}</span>
                        <span className="desktop-widgets__weather-square__hour-temp">
                          {slot.temp != null && Number.isFinite(slot.temp) ? `${Math.round(slot.temp)}°F` : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="desktop-widgets__drag-strip"
          aria-label="Move weather widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'weather')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize weather widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'weather')}
        />
      </div>

      <div
        className={cardClass(
          'bgControls',
          'desktop-widgets__card--bg-controls desktop-widgets__card--has-drag-strip',
        )}
        style={cardStyle('bgControls')}
      >
        <div className="desktop-widgets__no-blend desktop-widgets__bg-controls-body desktop-widgets__bg-controls-body--compact">
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
        <button
          type="button"
          className="desktop-widgets__drag-strip"
          aria-label="Move background controls widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'bgControls')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
      </div>

      <div
        className={cardClass('music', 'desktop-widgets__card--music desktop-widgets__card--has-drag-strip')}
        style={cardStyle('music')}
      >
        <button
          type="button"
          className="desktop-widgets__drag-strip"
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
                  <div className="desktop-widgets__no-blend">
                    <div className="desktop-widgets__ipod-screen-bezel" />
                    <div
                      className="desktop-widgets__ipod-screen-glass"
                      style={{
                        backgroundImage: `url(${currentTrack.thumbnail})`,
                      }}
                    />
                  </div>
                  <div className="desktop-widgets__ipod-screen-content">
                    <img
                      src={currentTrack.thumbnail}
                      alt=""
                      className="desktop-widgets__ipod-art desktop-widgets__no-blend"
                      width={44}
                      height={44}
                      draggable={false}
                    />
                    <div className="desktop-widgets__blend desktop-widgets__adaptive desktop-widgets__ipod-meta">
                      <div className="desktop-widgets__ipod-title">{currentTrack.title}</div>
                      <div className="desktop-widgets__ipod-artist">
                        {currentTrack.artist || 'YouTube Music'}
                      </div>
                    </div>
                  </div>
                  <div className="desktop-widgets__no-blend">
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
                  </div>
                  <div className="desktop-widgets__blend desktop-widgets__adaptive desktop-widgets__ipod-times">
                    <span>{formatTrackTime(progressSec)}</span>
                    <span>{formatTrackTime(durationSec)}</span>
                  </div>
                </>
              ) : (
                <div className="desktop-widgets__blend desktop-widgets__adaptive desktop-widgets__ipod-idle">
                  Nothing playing
                </div>
              )}
            </div>
            <div className="desktop-widgets__ipod-wheel-wrap">
              <div className="desktop-widgets__blend desktop-widgets__adaptive desktop-widgets__ipod-wheel">
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
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize music widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'music')}
        />
      </div>

      <div
        className={cardClass(
          'notesChecklist',
          'desktop-widgets__card--notes desktop-widgets__card--has-drag-strip',
        )}
        style={cardStyle('notesChecklist')}
      >
        <div className="desktop-widgets__blend desktop-widgets__notes-inner">
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
        <button
          type="button"
          className="desktop-widgets__drag-strip"
          aria-label="Move notes widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'notesChecklist')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize notes widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'notesChecklist')}
        />
      </div>

      {photoIds.map((pid) => {
        const pdata = photoData[pid]
        return (
          <div
            key={pid}
            className={cardClass(pid, 'desktop-widgets__card--photo desktop-widgets__card--has-drag-strip')}
            style={cardStyle(pid)}
          >
            <div className="desktop-widgets__photo-body">
              {pdata ? (
                <img
                  src={getImagePath(pdata.galleryIndex)}
                  alt=""
                  className="desktop-widgets__photo-img"
                  style={{ clipPath: `inset(${pdata.cropPadding ?? 0}%)` }}
                />
              ) : (
                <div className="desktop-widgets__photo-placeholder desktop-widgets__blend">
                  <ImageIcon size={28} strokeWidth={1.25} aria-hidden />
                  <span className="desktop-widgets__photo-hint">Photo</span>
                </div>
              )}
              <div className="desktop-widgets__photo-overlay desktop-widgets__blend">
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
              </div>
            </div>
            <button
              type="button"
              className="desktop-widgets__drag-strip"
              aria-label={`Move ${pid} widget`}
              onPointerDown={(e) => handleGripPointerDown(e, pid)}
            >
              <GripVertical size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="desktop-widgets__widget-resize-handle"
              aria-label="Resize photo widget"
              onPointerDown={(e) => handleWidgetResizePointerDown(e, pid)}
            />
          </div>
        )
      })}
    </div>
  )
}
