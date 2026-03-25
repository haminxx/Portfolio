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
import {
  STATIC_WIDGET_IDS,
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
import AnalogClockFace from './AnalogClockFace'
import { DESKTOP_SAFE_TOP } from '../desktopConstants'
import { getDesktopIconRects } from '../lib/widgetOverlapGeometry'
import LiquidGlass from 'liquid-glass-react'
import './DesktopWidgets.css'

const SD_LAT = 32.72
const SD_LON = -117.16
const LAYOUT_KEY = 'desktop-widget-layout'

const WORLD_ZONES = [
  { key: 'la', label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { key: 'seoul', label: 'Seoul', tz: 'Asia/Seoul' },
  { key: 'london', label: 'London', tz: 'Europe/London' },
]

function parseLongOffsetToMinutes(str) {
  if (!str) return null
  const m = String(str).match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/i)
  if (!m) return null
  const sign = m[1] === '-' ? -1 : 1
  const h = parseInt(m[2], 10)
  const min = m[3] ? parseInt(m[3], 10) : 0
  return sign * (h * 60 + min)
}

function offsetHoursCityVsUser(userTz, cityTz, at) {
  try {
    const fu = new Intl.DateTimeFormat('en', { timeZone: userTz, timeZoneName: 'longOffset' }).formatToParts(at)
    const fc = new Intl.DateTimeFormat('en', { timeZone: cityTz, timeZoneName: 'longOffset' }).formatToParts(at)
    const u = fu.find((p) => p.type === 'timeZoneName')?.value
    const c = fc.find((p) => p.type === 'timeZoneName')?.value
    const mu = parseLongOffsetToMinutes(u)
    const mc = parseLongOffsetToMinutes(c)
    if (mu == null || mc == null) return null
    return (mc - mu) / 60
  } catch {
    return null
  }
}

function formatOffsetVersusUser(h) {
  if (h == null || Number.isNaN(h)) return '—'
  if (Math.abs(h) < 0.05) return 'Same as you'
  const rounded = Math.round(h * 2) / 2
  const a = Math.abs(rounded)
  const unit = a === 1 ? 'hour' : 'hours'
  if (rounded > 0) return `${a} ${unit} ahead`
  return `${a} ${unit} behind`
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
    out[id] = {
      ...base,
      gridW: clampGrid(base.gridW ?? def.gridW),
      gridH: clampGrid(base.gridH ?? def.gridH),
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
  mouseContainerRef,
}) {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState({ status: 'idle', current: null, error: null })
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
  const [selectedDate, setSelectedDate] = useState(() => new Date())
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

  const userTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }, [])

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
      url.searchParams.set('timezone', 'auto')
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('forecast failed')
      const data = await res.json()
      const cur = data.current
      const temp = cur?.temperature_2m
      const code = cur?.weather_code ?? cur?.weathercode
      if (temp == null && code == null) throw new Error('no current data')
      setWeather({
        status: 'ready',
        current: { temp, code },
        error: null,
      })
    } catch (e) {
      setWeather({ status: 'error', current: null, error: e?.message || 'unavailable' })
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

  const WeatherTodayIcon =
    weather.status === 'ready' && weather.current
      ? weatherCodeToIcon(weather.current.code)
      : null

  const togglePinnedItem = useCallback((itemId, done) => {
    setPinnedChecklistItemDone(notesStore, itemId, done)
  }, [notesStore])

  const homeTimeLabel = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

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

  const positionedStyle = (id) => ({ position: 'absolute', ...cardStyle(id) })

  const liquidGlassBase = {
    mouseContainer: mouseContainerRef ?? null,
    mode: 'standard',
    blurAmount: 0.07,
    elasticity: 0.22,
    saturation: 135,
    aberrationIntensity: 1.6,
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

      <LiquidGlass
        {...liquidGlassBase}
        className={cardClass('calendar', 'desktop-widgets__card--liquid desktop-widgets__card--calendar')}
        style={positionedStyle('calendar')}
        cornerRadius={22}
        padding="14px 14px 14px"
      >
        <div className="desktop-widgets__blend">
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
              today={now}
              weekStartsOn={0}
              className="w-full rounded-xl [--cell-size:1.65rem] sm:[--cell-size:1.65rem]"
            />
          </div>
          <button
            type="button"
            className="desktop-widgets__widget-resize-handle"
            aria-label="Resize calendar widget"
            onPointerDown={(e) => handleWidgetResizePointerDown(e, 'calendar')}
          />
        </div>
      </LiquidGlass>

      <LiquidGlass
        {...liquidGlassBase}
        className={cardClass('clock', 'desktop-widgets__card--liquid desktop-widgets__card--clock')}
        style={positionedStyle('clock')}
        cornerRadius={22}
        padding="14px 14px 14px"
      >
        <div className="desktop-widgets__blend">
          <button
            type="button"
            className="desktop-widgets__grip"
            aria-label="Move clock widget"
            onPointerDown={(e) => handleGripPointerDown(e, 'clock')}
          >
            <GripVertical size={14} strokeWidth={2} />
          </button>
          <div
            className="desktop-widgets__adaptive desktop-widgets__world-clock"
            role="timer"
            aria-live="polite"
            aria-label={`World clock, home ${homeTimeLabel}`}
          >
            {WORLD_ZONES.map((z) => {
              const off = offsetHoursCityVsUser(userTz, z.tz, now)
              const timeStr = now.toLocaleTimeString(undefined, {
                timeZone: z.tz,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })
              return (
                <div key={z.key} className="desktop-widgets__world-clock__col">
                  <span className="desktop-widgets__world-clock__city">{z.label}</span>
                  <AnalogClockFace
                    now={now}
                    timeZone={z.tz}
                    size={50}
                    ariaLabel={`${z.label} ${timeStr}`}
                  />
                  <span className="desktop-widgets__world-clock__delta">{formatOffsetVersusUser(off)}</span>
                </div>
              )
            })}
            <div className="desktop-widgets__world-clock__col desktop-widgets__world-clock__col--home">
              <span className="desktop-widgets__world-clock__city">
                {userLoc.status === 'pending' ? 'Locating…' : userLoc.label || 'Your time'}
              </span>
              <AnalogClockFace now={now} size={50} ariaLabel={`Home ${homeTimeLabel}`} />
              <span className="desktop-widgets__world-clock__delta">Base</span>
            </div>
          </div>
          <button
            type="button"
            className="desktop-widgets__widget-resize-handle"
            aria-label="Resize clock widget"
            onPointerDown={(e) => handleWidgetResizePointerDown(e, 'clock')}
          />
        </div>
      </LiquidGlass>

      <LiquidGlass
        {...liquidGlassBase}
        className={cardClass('weather', 'desktop-widgets__card--liquid desktop-widgets__card--weather')}
        style={positionedStyle('weather')}
        cornerRadius={22}
        padding="14px 14px 14px"
      >
        <div className="desktop-widgets__blend">
          <button
            type="button"
            className="desktop-widgets__grip"
            aria-label="Move weather widget"
            onPointerDown={(e) => handleGripPointerDown(e, 'weather')}
          >
            <GripVertical size={14} strokeWidth={2} />
          </button>
          <div className="desktop-widgets__adaptive desktop-widgets__weather-body">
            <div className="desktop-widgets__card-title desktop-widgets__weather-city">
              {userLoc.status === 'pending' ? '…' : userLoc.label || 'Weather'}
            </div>
            {weather.status === 'loading' && <p className="desktop-widgets__muted">Loading…</p>}
            {weather.status === 'error' && <p className="desktop-widgets__muted">{weather.error}</p>}
            {weather.status === 'ready' && weather.current && WeatherTodayIcon ? (
              <div className="desktop-widgets__weather-today">
                <span className="desktop-widgets__weather-today-icon" aria-hidden>
                  <WeatherTodayIcon size={36} strokeWidth={1.75} />
                </span>
                <div className="desktop-widgets__weather-today-meta">
                  <span className="desktop-widgets__weather-today-temp">
                    {weather.current.temp != null && Number.isFinite(weather.current.temp)
                      ? Math.round(weather.current.temp)
                      : '—'}
                    °
                  </span>
                  <span className="desktop-widgets__weather-today-sub">Now</span>
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="desktop-widgets__widget-resize-handle"
            aria-label="Resize weather widget"
            onPointerDown={(e) => handleWidgetResizePointerDown(e, 'weather')}
          />
        </div>
      </LiquidGlass>

      <div className={cardClass('bgControls', 'desktop-widgets__card--flat desktop-widgets__card--bg-controls')} style={positionedStyle('bgControls')}>
        <div className="desktop-widgets__blend">
          <button
            type="button"
            className="desktop-widgets__grip"
            aria-label="Move background controls widget"
            onPointerDown={(e) => handleGripPointerDown(e, 'bgControls')}
          >
            <GripVertical size={14} strokeWidth={2} />
          </button>
        </div>
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
        <div className="desktop-widgets__blend">
          <button
            type="button"
            className="desktop-widgets__widget-resize-handle"
            aria-label="Resize background controls widget"
            onPointerDown={(e) => handleWidgetResizePointerDown(e, 'bgControls')}
          />
        </div>
      </div>

      <div className={cardClass('music', 'desktop-widgets__card--flat desktop-widgets__card--music')} style={positionedStyle('music')}>
        <div className="desktop-widgets__blend">
          <button
            type="button"
            className="desktop-widgets__grip"
            aria-label="Move music widget"
            onPointerDown={(e) => handleGripPointerDown(e, 'music')}
          >
            <GripVertical size={14} strokeWidth={2} />
          </button>
        </div>
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
        <div className="desktop-widgets__blend">
          <button
            type="button"
            className="desktop-widgets__widget-resize-handle"
            aria-label="Resize music widget"
            onPointerDown={(e) => handleWidgetResizePointerDown(e, 'music')}
          />
        </div>
      </div>

      <LiquidGlass
        {...liquidGlassBase}
        className={cardClass('notesChecklist', 'desktop-widgets__card--liquid desktop-widgets__card--notes')}
        style={positionedStyle('notesChecklist')}
        cornerRadius={22}
        padding="14px 14px 14px"
      >
        <div className="desktop-widgets__blend desktop-widgets__notes-liquid-inner">
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
          <button
            type="button"
            className="desktop-widgets__widget-resize-handle"
            aria-label="Resize notes widget"
            onPointerDown={(e) => handleWidgetResizePointerDown(e, 'notesChecklist')}
          />
        </div>
      </LiquidGlass>

      {photoIds.map((pid) => {
        const pdata = photoData[pid]
        return (
          <div key={pid} className={cardClass(pid, 'desktop-widgets__card--photo')} style={positionedStyle(pid)}>
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
              </div>
              <div className="desktop-widgets__blend">
                <button
                  type="button"
                  className="desktop-widgets__widget-resize-handle"
                  aria-label="Resize photo widget"
                  onPointerDown={(e) => handleWidgetResizePointerDown(e, pid)}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
