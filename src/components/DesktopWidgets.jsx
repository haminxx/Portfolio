import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Play,
  Pause,
  GripVertical,
  SkipBack,
  SkipForward,
  ImageIcon,
  RefreshCw,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
  CloudSun,
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
  SQUARE_WIDGET_IDS,
  snapSquareLayoutEntry,
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
import {
  fetchWeatherImperial,
  buildWeatherNextHint,
} from '../lib/openWeather'
import RetroCalendarPanel from './desktop/RetroCalendarPanel'
import { DoItNowClockWidget } from './desktop/QuoteClockPanel'
import { KnotAnimation } from './ui/knot-animation'
import './DesktopWidgets.css'

const SD_LAT = 32.72
const SD_LON = -117.16
const LAYOUT_KEY = 'desktop-widget-layout-v6'

function formatLocationLabel(raw) {
  if (!raw || typeof raw !== 'string') return 'Local'
  let s = raw.trim()
  if (s.includes(',')) s = s.split(',')[0].trim()
  if (/\b(county|parish|municipality)\b/i.test(s) && s.length > 24) {
    s = s.replace(/\b(county|parish|municipality)\b.*$/i, '').trim()
  }
  return s || 'Local'
}

function hexRgbInvert(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex ?? '').trim())
  if (!m) return '#ffffff'
  const x = (i) => (255 - parseInt(m[i], 16)).toString(16).padStart(2, '0')
  return `#${x(1)}${x(2)}${x(3)}`
}

function WidgetDragGrip({ id, label, onDown }) {
  return (
    <button
      type="button"
      className="desktop-widgets__grip desktop-widgets__widget-drag-grip"
      aria-label={label}
      onPointerDown={(e) => onDown(e, id)}
    >
      <GripVertical size={14} strokeWidth={2} />
    </button>
  )
}

function WeatherGlyph({ main, code, description }) {
  const m = (main || '').toLowerCase()
  const d = (description || '').toLowerCase()
  const sz = 16
  const stroke = 1.65
  if (m.includes('thunder') || d.includes('thunder') || (code >= 200 && code < 300)) {
    return <CloudLightning size={sz} strokeWidth={stroke} aria-hidden />
  }
  if (m.includes('snow') || d.includes('snow') || (code >= 71 && code <= 77) || (code >= 600 && code < 700)) {
    return <Snowflake size={sz} strokeWidth={stroke} aria-hidden />
  }
  if (m.includes('rain') || m.includes('drizzle') || d.includes('rain') || (code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain size={sz} strokeWidth={stroke} aria-hidden />
  }
  if (m.includes('fog') || m.includes('mist') || d.includes('fog') || (code >= 45 && code <= 48)) {
    return <CloudFog size={sz} strokeWidth={stroke} aria-hidden />
  }
  if (m.includes('clear') || code === 0 || d.includes('clear')) {
    return <Sun size={sz} strokeWidth={stroke} aria-hidden />
  }
  if (m.includes('cloud') || code === 3 || d.includes('overcast')) {
    return <Cloud size={sz} strokeWidth={stroke} aria-hidden />
  }
  if (code === 1 || code === 2 || d.includes('mainly')) {
    return <CloudSun size={sz} strokeWidth={stroke} aria-hidden />
  }
  return <Cloud size={sz} strokeWidth={stroke} aria-hidden />
}

function formatTrackTime(sec) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Hero reference: weather to the right of clock (same row); knot to the right of date; tall photo left;
 * right column: two 5×5 photos, wide music, notes + color wheel, year bar.
 */
const RX = 900
const DEFAULT_LAYOUT = {
  clock: { x: 20, y: 56, ...defaultStaticGrid('clock') },
  weather: { x: 20 + 7 * CELL, y: 56, ...defaultStaticGrid('weather') },
  calendar: { x: 20, y: 56 + 3 * CELL, ...defaultStaticGrid('calendar') },
  knotWidget: { x: 20 + 4 * CELL, y: 56 + 3 * CELL, ...defaultStaticGrid('knotWidget') },
  photoA: { x: 20, y: 56 + 3 * CELL + 4 * CELL + 10, gridW: 7, gridH: 10 },
  photoB: { x: RX, y: 56, gridW: 5, gridH: 5 },
  photoC: { x: RX + 5 * CELL, y: 56, gridW: 5, gridH: 5 },
  music: { x: RX, y: 56 + 5 * CELL + 8, ...defaultStaticGrid('music') },
  notesChecklist: { x: RX, y: 56 + 5 * CELL + 8 + 3 * CELL + 8, ...defaultStaticGrid('notesChecklist') },
  bgControls: { x: RX + 5 * CELL, y: 56 + 5 * CELL + 8 + 3 * CELL + 8, ...defaultStaticGrid('bgControls') },
  yearProgress: {
    x: RX,
    y: 56 + 5 * CELL + 8 + 3 * CELL + 8 + 4 * CELL + 8,
    ...defaultStaticGrid('yearProgress'),
  },
}

const YEAR_WEEKS = 52

/** 52 dots = weeks in the year; click footer left to toggle month mode (dots = days in month). */
function YearProgressWidget({ now }) {
  const [mode, setMode] = useState('year')

  const yearMode = useMemo(() => {
    const y = now.getFullYear()
    const start = new Date(y, 0, 1)
    const end = new Date(y + 1, 0, 1)
    const total = Math.round((end - start) / 86400000)
    const dof = Math.min(total, Math.max(0, Math.floor((now - start) / 86400000)))
    const pastCompleteWeeks = Math.min(YEAR_WEEKS, Math.floor(dof / 7))
    const weeksLeft = Math.max(0, YEAR_WEEKS - pastCompleteWeeks)
    return { year: y, pastCompleteWeeks, weeksLeft }
  }, [now])

  const monthMode = useMemo(() => {
    const y = now.getFullYear()
    const m = now.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const monthLabel = now.toLocaleString(undefined, { month: 'long' })
    const pastDaysBeforeToday = dayOfMonth - 1
    const daysLeft = Math.max(0, daysInMonth - dayOfMonth + 1)
    return { daysInMonth, pastDaysBeforeToday, daysLeft, monthLabel }
  }, [now])

  const ariaLabel =
    mode === 'year'
      ? `Year ${yearMode.year}, ${yearMode.weeksLeft} weeks remaining`
      : `${monthMode.monthLabel}, ${monthMode.daysLeft} days remaining in this month`

  return (
    <div className="desktop-widgets__year-widget" role="img" aria-label={ariaLabel}>
      <div className="desktop-widgets__year-dots-wrap">
        <div
          className={
            mode === 'year'
              ? 'desktop-widgets__year-dots-grid desktop-widgets__year-dots-grid--weeks'
              : 'desktop-widgets__year-dots-grid desktop-widgets__year-dots-grid--month'
          }
          aria-hidden
        >
          {mode === 'year'
            ? Array.from({ length: YEAR_WEEKS }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < yearMode.pastCompleteWeeks
                      ? 'desktop-widgets__year-dot desktop-widgets__year-dot--past'
                      : 'desktop-widgets__year-dot desktop-widgets__year-dot--left'
                  }
                />
              ))
            : Array.from({ length: monthMode.daysInMonth }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < monthMode.pastDaysBeforeToday
                      ? 'desktop-widgets__year-dot desktop-widgets__year-dot--past'
                      : 'desktop-widgets__year-dot desktop-widgets__year-dot--left'
                  }
                />
              ))}
        </div>
      </div>
      <div className="desktop-widgets__year-footer">
        <button
          type="button"
          className="desktop-widgets__year-footer-toggle"
          onClick={() => setMode((m) => (m === 'year' ? 'month' : 'year'))}
        >
          {mode === 'year' ? yearMode.year : monthMode.monthLabel}
        </button>
        <span>
          {mode === 'year' ? `${yearMode.weeksLeft} weeks left` : `${monthMode.daysLeft} days left`}
        </span>
      </div>
    </div>
  )
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
  for (const sid of SQUARE_WIDGET_IDS) {
    if (out[sid]) out[sid] = snapSquareLayoutEntry(sid, out[sid])
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
    temp: null,
    feelsLike: null,
    description: '',
    weatherMain: '',
    weatherCode: null,
    locationLabel: '',
    hourly: [],
    error: null,
    source: '',
    sunrise: null,
    sunset: null,
    sameConditionHint: '',
  })
  const [userLoc, setUserLoc] = useState({
    status: 'pending',
    lat: null,
    lon: null,
    label: '',
  })
  const [photoIds, setPhotoIds] = useState(() => loadPhotoWidgetIdList())
  const [layout, setLayout] = useState(() => loadLayout(loadPhotoWidgetIdList()))
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
  const knotFg = useMemo(() => hexRgbInvert(bgColor2), [bgColor2])

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
          label = j.locality || j.city || j.principalSubdivision || label
          if (/coast|region|metro|valley$/i.test(String(label)) && j.locality) label = j.locality
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
      const data = await fetchWeatherImperial(lat, lon)
      setWeather({
        status: 'ready',
        temp: data.temp,
        feelsLike: data.feelsLike,
        description: data.description,
        weatherMain: data.weatherMain ?? '',
        weatherCode: data.weatherCode ?? null,
        locationLabel: data.locationLabel,
        hourly: data.hourly,
        error: null,
        source: data.source,
        sunrise: data.sunrise ?? null,
        sunset: data.sunset ?? null,
        sameConditionHint: data.sameConditionHint ?? '',
      })
    } catch (e) {
      setWeather({
        status: 'error',
        temp: null,
        feelsLike: null,
        description: '',
        weatherMain: '',
        weatherCode: null,
        locationLabel: '',
        hourly: [],
        error: e?.message || 'unavailable',
        source: '',
        sunrise: null,
        sunset: null,
        sameConditionHint: '',
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
      const origS = SQUARE_WIDGET_IDS.includes(wid) ? clampGrid(Math.min(origW, origH)) : null
      setResizingWidgetId(wid)
      widgetResizeRef.current = {
        wid,
        startX: e.clientX,
        startY: e.clientY,
        origW,
        origH,
        origS,
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
        let nextW
        let nextH
        if (d.origS != null) {
          const delta = Math.round(((ev.clientX - d.startX) + (ev.clientY - d.startY)) / (2 * CELL))
          const s = clampGrid(d.origS + delta)
          nextW = s
          nextH = s
        } else {
          nextW = clampGrid(d.origW + Math.round((ev.clientX - d.startX) / CELL))
          nextH = clampGrid(d.origH + Math.round((ev.clientY - d.startY) / CELL))
        }
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

  const weatherNext = useMemo(() => {
    if (weather.status !== 'ready') return { conditionWord: '—', horizon: '—' }
    return buildWeatherNextHint(
      weather.description,
      weather.weatherMain,
      weather.weatherCode,
      weather.hourly,
    )
  }, [weather])

  const weatherCity = useMemo(() => {
    const geo = userLoc.status === 'ok' && userLoc.label && userLoc.label !== 'Local' ? userLoc.label : ''
    const api = (weather.locationLabel && String(weather.locationLabel).trim()) || ''
    return formatLocationLabel(geo || api || userLoc.label || '')
  }, [userLoc.status, userLoc.label, weather.locationLabel])

  const weatherSunCompact = useMemo(
    () => (weather.status === 'ready' ? formatSunriseSunsetCompact(weather.sunrise, weather.sunset) : ''),
    [weather.status, weather.sunrise, weather.sunset],
  )

  const weatherCurrentLabel = useMemo(() => {
    if (weather.status !== 'ready') return '—'
    const desc = (weather.description || '').trim()
    if (desc) return desc.split(/\s+/)[0]
    return (weather.weatherMain || '—').toString()
  }, [weather.status, weather.description, weather.weatherMain])

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

      <div className={cardClass('calendar', 'desktop-widgets__card--calendar')} style={cardStyle('calendar')}>
        <div className="desktop-widgets__card-chrome">
          <WidgetDragGrip id="calendar" label="Move calendar widget" onDown={handleGripPointerDown} />
          <div className="desktop-widgets__calendar-widget-body">
            <RetroCalendarPanel now={now} variant="compact" weekdayAccentColor={knotFg} />
          </div>
        </div>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize calendar widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'calendar')}
        />
      </div>

      <div className={cardClass('clock', 'desktop-widgets__card--clock')} style={cardStyle('clock')}>
        <div className="desktop-widgets__card-chrome desktop-widgets__quote-widget-shell desktop-widgets__blend">
          <WidgetDragGrip id="clock" label="Move clock widget" onDown={handleGripPointerDown} />
          <DoItNowClockWidget date={now} />
        </div>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize clock widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'clock')}
        />
      </div>

      <div className={cardClass('weather', 'desktop-widgets__card--weather')} style={cardStyle('weather')}>
        <div className="desktop-widgets__card-chrome">
          <WidgetDragGrip id="weather" label="Move weather widget" onDown={handleGripPointerDown} />
          <div className="desktop-widgets__weather-compact">
            {weather.status === 'loading' && (
              <p className="desktop-widgets__weather-compact__status">Loading…</p>
            )}
            {weather.status === 'error' && (
              <div className="desktop-widgets__weather-compact__status-wrap">
                <p className="desktop-widgets__weather-compact__status">{weather.error}</p>
                <p className="desktop-widgets__weather-compact__hint">
                  Set VITE_OPENWEATHER_API_KEY or allow location.
                </p>
              </div>
            )}
            {weather.status === 'ready' ? (
              <div className="desktop-widgets__weather-compact__stack">
                <p className="desktop-widgets__weather-compact__row desktop-widgets__weather-compact__row--body">
                  <span className="desktop-widgets__weather-compact__white">
                    {weather.temp != null && Number.isFinite(weather.temp) ? Math.round(weather.temp) : '—'}°F
                  </span>
                  <span className="desktop-widgets__weather-compact__grey"> now</span>
                </p>
                <p className="desktop-widgets__weather-compact__row desktop-widgets__weather-compact__row--body">
                  <span className="desktop-widgets__weather-compact__grey">in </span>
                  <span className="desktop-widgets__weather-compact__white">{weatherCity}</span>
                </p>
                <p className="desktop-widgets__weather-compact__row desktop-widgets__weather-compact__row--body">
                  <span className="desktop-widgets__weather-compact__grey">feels </span>
                  <span className="desktop-widgets__weather-compact__white">
                    {weather.feelsLike != null && Number.isFinite(weather.feelsLike)
                      ? `${Math.round(weather.feelsLike)}°F`
                      : '—'}
                  </span>
                </p>
                <p className="desktop-widgets__weather-compact__row desktop-widgets__weather-compact__row--icon">
                  <span className="desktop-widgets__weather-compact__icon">
                    <WeatherGlyph
                      main={weather.weatherMain}
                      code={weather.weatherCode}
                      description={weather.description}
                    />
                  </span>
                  <span className="desktop-widgets__weather-compact__weather-primary">
                    <span className="desktop-widgets__weather-compact__white">{weatherCurrentLabel}</span>
                  </span>
                </p>
                {weatherNext.horizon && weatherNext.horizon !== '—' ? (
                  <p className="desktop-widgets__weather-compact__row desktop-widgets__weather-compact__row--body">
                    <span className="desktop-widgets__weather-compact__grey">Next </span>
                    <span className="desktop-widgets__weather-compact__white">{weatherNext.conditionWord}</span>
                    <span className="desktop-widgets__weather-compact__grey"> · {weatherNext.horizon}</span>
                  </p>
                ) : null}
                {weather.sameConditionHint ? (
                  <p className="desktop-widgets__weather-compact__row desktop-widgets__weather-compact__row--body desktop-widgets__weather-compact__row--horizon">
                    <span className="desktop-widgets__weather-compact__grey">{weather.sameConditionHint}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize weather widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'weather')}
        />
      </div>

      <div className={cardClass('bgControls', 'desktop-widgets__card--bg-controls')} style={cardStyle('bgControls')}>
        <div className="desktop-widgets__card-chrome">
          <WidgetDragGrip id="bgControls" label="Move background controls widget" onDown={handleGripPointerDown} />
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
        </div>
      </div>

      <div className={cardClass('music', 'desktop-widgets__card--music')} style={cardStyle('music')}>
        <div className="desktop-widgets__card-chrome desktop-widgets__card-chrome--music">
          <WidgetDragGrip id="music" label="Move music widget" onDown={handleGripPointerDown} />
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
        </div>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize music widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'music')}
        />
      </div>

      <div className={cardClass('notesChecklist', 'desktop-widgets__card--notes')} style={cardStyle('notesChecklist')}>
        <div className="desktop-widgets__card-chrome">
          <WidgetDragGrip id="notesChecklist" label="Move notes widget" onDown={handleGripPointerDown} />
          <div className="desktop-widgets__blend desktop-widgets__notes-inner">
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
        </div>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize notes widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'notesChecklist')}
        />
      </div>

      <div className={cardClass('knotWidget', 'desktop-widgets__card--knot')} style={cardStyle('knotWidget')}>
        <div className="desktop-widgets__card-chrome">
          <WidgetDragGrip id="knotWidget" label="Move knot widget" onDown={handleGripPointerDown} />
          <div className="desktop-widgets__knot-shell" style={{ color: knotFg }}>
            <KnotAnimation color={false} speedA={0.045} speedB={0.022} />
          </div>
        </div>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize knot widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'knotWidget')}
        />
      </div>

      <div className={cardClass('yearProgress', 'desktop-widgets__card--year')} style={cardStyle('yearProgress')}>
        <div className="desktop-widgets__card-chrome">
          <WidgetDragGrip id="yearProgress" label="Move year progress widget" onDown={handleGripPointerDown} />
          <YearProgressWidget now={now} />
        </div>
        <button
          type="button"
          className="desktop-widgets__widget-resize-handle"
          aria-label="Resize year progress widget"
          onPointerDown={(e) => handleWidgetResizePointerDown(e, 'yearProgress')}
        />
      </div>

      {photoIds.map((pid) => {
        const pdata = photoData[pid]
        return (
          <div
            key={pid}
            className={cardClass(pid, 'desktop-widgets__card--photo')}
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
                  className="desktop-widgets__grip desktop-widgets__widget-drag-grip desktop-widgets__photo-drag-grip"
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
              </div>
            </div>
            <button
              type="button"
              className="desktop-widgets__widget-resize-handle desktop-widgets__photo-resize-handle"
              aria-label="Resize photo widget"
              onPointerDown={(e) => handleWidgetResizePointerDown(e, pid)}
            />
          </div>
        )
      })}
    </div>
  )
}
