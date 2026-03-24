import { useState, useEffect, useMemo, useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'
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
  CloudMoon,
  Snowflake,
} from 'lucide-react'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { useGallery } from '../context/GalleryContext'
import { getImagePath } from '../lib/gallery'
import './DesktopWidgets.css'

const SD_LAT = 32.72
const SD_LON = -117.16
const LAYOUT_KEY = 'desktop-widget-layout'
const CHECKLIST_KEY = 'desktop-checklist-tasks'

const LONG_PRESS_MS = 450
const LONG_PRESS_MOVE_MAX = 10
const DRAG_THRESHOLD_PX = 4

type SizePreset = 'sm' | 'md' | 'lg'

const PHOTO_WIDGET_IDS = ['photo1', 'photo2', 'photo3'] as const
type PhotoWidgetId = (typeof PHOTO_WIDGET_IDS)[number]

const WIDGET_IDS = [
  'calendar',
  'clock',
  'weather',
  'music',
  'photo1',
  'photo2',
  'photo3',
  'checklist',
] as const
type WidgetId = (typeof WIDGET_IDS)[number]

const DEFAULT_POSITIONS: Record<WidgetId, { x: number; y: number }> = {
  calendar: { x: 20, y: 56 },
  clock: { x: 260, y: 56 },
  weather: { x: 20, y: 300 },
  music: { x: 260, y: 300 },
  photo1: { x: 500, y: 56 },
  photo2: { x: 500, y: 220 },
  photo3: { x: 660, y: 56 },
  checklist: { x: 20, y: 480 },
}

const DEFAULT_SIZES: Record<PhotoWidgetId, SizePreset> = {
  photo1: 'md',
  photo2: 'md',
  photo3: 'md',
}

const PHOTO_SIZE_PX: Record<SizePreset, { w: number; h: number }> = {
  sm: { w: 128, h: 104 },
  md: { w: 184, h: 148 },
  lg: { w: 240, h: 192 },
}

const WIDGET_SIZE: Record<WidgetId, { w: number; h: number }> = {
  calendar: { w: 220, h: 240 },
  clock: { w: 220, h: 128 },
  weather: { w: 380, h: 132 },
  music: { w: 220, h: 120 },
  photo1: PHOTO_SIZE_PX.md,
  photo2: PHOTO_SIZE_PX.md,
  photo3: PHOTO_SIZE_PX.md,
  checklist: { w: 220, h: 200 },
}

type LayoutState = {
  positions: Record<WidgetId, { x: number; y: number }>
  sizes: Record<PhotoWidgetId, SizePreset>
}

type CheckTask = { id: string; text: string; done: boolean }

function loadChecklist(): CheckTask[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY)
    if (!raw) {
      return [
        { id: '1', text: 'Review portfolio', done: true },
        { id: '2', text: 'Ship widgets', done: false },
      ]
    }
    const p = JSON.parse(raw) as unknown
    if (!Array.isArray(p)) return []
    return p
      .filter((t): t is CheckTask => t && typeof (t as CheckTask).id === 'string')
      .map((t) => ({
        id: t.id,
        text: typeof t.text === 'string' ? t.text : '',
        done: !!t.done,
      }))
  } catch {
    return []
  }
}

function saveChecklist(tasks: CheckTask[]) {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(tasks))
  } catch {
    /* ignore */
  }
}

function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) {
      return { positions: { ...DEFAULT_POSITIONS }, sizes: { ...DEFAULT_SIZES } }
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const positions = { ...DEFAULT_POSITIONS }
    const sizes = { ...DEFAULT_SIZES }

    if (parsed.positions && typeof parsed.positions === 'object') {
      const pos = parsed.positions as Record<string, { x?: number; y?: number }>
      for (const id of WIDGET_IDS) {
        if (pos[id]?.x != null && pos[id]?.y != null) {
          positions[id] = { x: pos[id].x!, y: pos[id].y! }
        }
      }
    } else {
      for (const id of WIDGET_IDS) {
        const e = parsed[id] as { x?: number; y?: number } | undefined
        if (e?.x != null && e?.y != null) {
          positions[id] = { x: e.x, y: e.y }
        }
      }
    }

    if (parsed.sizes && typeof parsed.sizes === 'object') {
      const sz = parsed.sizes as Record<string, string>
      for (const pid of PHOTO_WIDGET_IDS) {
        if (sz[pid] === 'sm' || sz[pid] === 'md' || sz[pid] === 'lg') {
          sizes[pid] = sz[pid]
        }
      }
    }

    return { positions, sizes }
  } catch {
    return { positions: { ...DEFAULT_POSITIONS }, sizes: { ...DEFAULT_SIZES } }
  }
}

function saveLayout(state: LayoutState) {
  try {
    localStorage.setItem(
      LAYOUT_KEY,
      JSON.stringify({ positions: state.positions, sizes: state.sizes }),
    )
  } catch {
    /* ignore */
  }
}

function buildMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function weatherIconForCode(code: number | null | undefined) {
  if (code == null) return Cloud
  if (code === 0) return Sun
  if (code <= 3) return CloudSun
  if (code >= 45 && code <= 48) return Cloud
  if (code >= 51 && code <= 67) return CloudRain
  if (code >= 71 && code <= 77) return Snowflake
  if (code >= 80 && code <= 82) return CloudRain
  if (code >= 95) return CloudMoon
  return Cloud
}

function fahrenheit(c: number) {
  return Math.round((c * 9) / 5 + 32)
}

export default function DesktopWidgets() {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState<{
    status: 'idle' | 'loading' | 'ready' | 'error'
    days: { date: string; high: number | null; low: number | null; code: number | null }[]
    error: string | null
  }>({ status: 'idle', days: [], error: null })
  const [layout, setLayout] = useState<LayoutState>(loadLayout)
  const [viewCal, setViewCal] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }))
  const [selCal, setSelCal] = useState(() => ({
    y: new Date().getFullYear(),
    m: new Date().getMonth(),
    d: new Date().getDate(),
  }))
  const [checkTasks, setCheckTasks] = useState<CheckTask[]>(loadChecklist)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [sizeMenuFor, setSizeMenuFor] = useState<PhotoWidgetId | null>(null)
  const [sizeMenuPos, setSizeMenuPos] = useState<{ left: number; top: number } | null>(null)

  const dragRef = useRef<{
    id: WidgetId
    startX: number
    startY: number
    origX: number
    origY: number
    gripEl: HTMLElement
    pointerId: number
  } | null>(null)
  const longPressRef = useRef<{
    timer: ReturnType<typeof setTimeout>
    id: PhotoWidgetId
    startX: number
    startY: number
    gripEl: HTMLElement
    pointerId: number
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTrack, isPlaying, togglePlay } = useMusicPlayer()
  const { selectedPhotoIndex } = useGallery()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    saveChecklist(checkTasks)
  }, [checkTasks])

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
      const times: string[] = data.daily?.time || []
      const maxT: (number | null)[] = data.daily?.temperature_2m_max || []
      const minT: (number | null)[] = data.daily?.temperature_2m_min || []
      const codes: (number | null)[] = data.daily?.weathercode || []
      const days = times.map((t, i) => ({
        date: t,
        high: maxT[i] ?? null,
        low: minT[i] ?? null,
        code: codes[i] ?? null,
      }))
      setWeather({ status: 'ready', days, error: null })
    } catch (e) {
      setWeather({
        status: 'error',
        days: [],
        error: e instanceof Error ? e.message : 'unavailable',
      })
    }
  }, [])

  useEffect(() => {
    loadWeather()
  }, [loadWeather])

  useEffect(() => {
    if (!sizeMenuFor) return
    const close = (ev: Event) => {
      const t = ev.target
      if (t instanceof HTMLElement && t.closest('.desktop-size-menu')) return
      setSizeMenuFor(null)
      setSizeMenuPos(null)
    }
    const attach = window.setTimeout(() => {
      document.addEventListener('pointerdown', close)
    }, 200)
    return () => {
      window.clearTimeout(attach)
      document.removeEventListener('pointerdown', close)
    }
  }, [sizeMenuFor])

  const dimsFor = useCallback(
    (id: WidgetId) => {
      if (PHOTO_WIDGET_IDS.includes(id as PhotoWidgetId)) {
        const preset = layout.sizes[id as PhotoWidgetId] ?? 'md'
        return PHOTO_SIZE_PX[preset]
      }
      return WIDGET_SIZE[id]
    },
    [layout.sizes],
  )

  const clampPos = useCallback(
    (id: WidgetId, x: number, y: number) => {
      const el = containerRef.current
      if (!el) return { x, y }
      const rect = el.getBoundingClientRect()
      const { w, h } = dimsFor(id)
      const maxX = Math.max(0, rect.width - w)
      const maxY = Math.max(0, rect.height - h)
      return {
        x: Math.max(0, Math.min(maxX, x)),
        y: Math.max(0, Math.min(maxY, y)),
      }
    },
    [dimsFor],
  )

  const clearLongPress = useCallback(() => {
    const lp = longPressRef.current
    if (lp) {
      clearTimeout(lp.timer)
      longPressRef.current = null
    }
  }, [])

  const handleGripPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, id: WidgetId) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()
      const el = containerRef.current
      if (!el) return
      const pos = layout.positions[id]
      const gripEl = e.currentTarget
      const pointerId = e.pointerId
      const isPhoto = PHOTO_WIDGET_IDS.includes(id as PhotoWidgetId)

      if (isPhoto) {
        const photoId = id as PhotoWidgetId
        longPressRef.current = {
          timer: setTimeout(() => {
            longPressRef.current = null
            const r = gripEl.getBoundingClientRect()
            setSizeMenuFor(photoId)
            setSizeMenuPos({ left: r.left, top: r.bottom + 4 })
            try {
              gripEl.releasePointerCapture(pointerId)
            } catch {
              /* ignore */
            }
          }, LONG_PRESS_MS),
          id: photoId,
          startX: e.clientX,
          startY: e.clientY,
          gripEl,
          pointerId,
        }
      }

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
        /* ignore */
      }

      let dragStarted = false

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current
        if (!d || ev.pointerId !== d.pointerId) return
        const dx = ev.clientX - d.startX
        const dy = ev.clientY - d.startY
        const lp = longPressRef.current
        if (lp && lp.pointerId === ev.pointerId) {
          if (Math.hypot(ev.clientX - lp.startX, ev.clientY - lp.startY) > LONG_PRESS_MOVE_MAX) {
            clearTimeout(lp.timer)
            longPressRef.current = null
          }
        }
        if (!dragStarted) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
          dragStarted = true
          clearLongPress()
        }
        const next = clampPos(d.id, d.origX + dx, d.origY + dy)
        setLayout((prev) => ({
          ...prev,
          positions: { ...prev.positions, [d.id]: next },
        }))
      }

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== dragRef.current?.pointerId) return
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        clearLongPress()
        const d = dragRef.current
        try {
          d?.gripEl?.releasePointerCapture?.(ev.pointerId)
        } catch {
          /* ignore */
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
    [layout.positions, clampPos, clearLongPress],
  )

  const setPhotoSize = useCallback((id: PhotoWidgetId, preset: SizePreset) => {
    setLayout((prev) => {
      const next = {
        ...prev,
        sizes: { ...prev.sizes, [id]: preset },
      }
      const pos = clampPos(id, prev.positions[id].x, prev.positions[id].y)
      next.positions = { ...next.positions, [id]: pos }
      saveLayout(next)
      return next
    })
    setSizeMenuFor(null)
    setSizeMenuPos(null)
  }, [clampPos])

  const calGrid = useMemo(
    () => buildMonthGrid(viewCal.y, viewCal.m),
    [viewCal.y, viewCal.m],
  )
  const calLabel = useMemo(
    () =>
      new Date(viewCal.y, viewCal.m, 1).toLocaleString(undefined, {
        month: 'short',
        year: 'numeric',
      }),
    [viewCal.y, viewCal.m],
  )
  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()

  const dateUpper = now
    .toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase()

  const cardOffset = (id: WidgetId) => {
    const p = layout.positions[id] ?? DEFAULT_POSITIONS[id]
    return { left: p.x, top: p.y }
  }

  const panelClass =
    'rounded-2xl border border-white/15 bg-black/35 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl'

  return (
    <div ref={containerRef} className="desktop-widgets" aria-hidden>
      {sizeMenuFor && sizeMenuPos && (
        <div
          className="fixed z-[80] flex flex-col gap-0.5 rounded-lg border border-white/20 bg-zinc-900/95 p-1 shadow-xl backdrop-blur-md"
          style={{ left: sizeMenuPos.left, top: sizeMenuPos.top }}
        >
          {(['sm', 'md', 'lg'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              className="rounded-md px-3 py-1.5 text-left text-xs font-medium text-white/90 hover:bg-white/10"
              onClick={() => setPhotoSize(sizeMenuFor, preset)}
            >
              {preset === 'sm' ? 'Small' : preset === 'md' ? 'Medium' : 'Large'}
            </button>
          ))}
          <button
            type="button"
            className="rounded-md px-3 py-1 text-left text-[10px] text-white/50 hover:bg-white/5"
            onClick={() => {
              setSizeMenuFor(null)
              setSizeMenuPos(null)
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Calendar */}
      <div
        className={`desktop-widgets__card pointer-events-auto absolute ${panelClass} !w-auto !min-w-[220px] p-3 text-white`}
        style={{ ...cardOffset('calendar'), width: WIDGET_SIZE.calendar.w }}
      >
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move calendar widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'calendar')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            className="rounded p-1 text-white/80 hover:bg-white/10"
            aria-label="Previous month"
            onClick={() =>
              setViewCal((v) => (v.m <= 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
            }
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold tracking-wide">{calLabel}</span>
          <button
            type="button"
            className="rounded p-1 text-white/80 hover:bg-white/10"
            aria-label="Next month"
            onClick={() =>
              setViewCal((v) => (v.m >= 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-white/70">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calGrid.map((d, i) => {
            const isTodayCell =
              d != null && viewCal.y === todayY && viewCal.m === todayM && d === todayD
            const isSel =
              d != null && selCal.d === d && selCal.y === viewCal.y && selCal.m === viewCal.m
            return (
              <span
                key={i}
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  d == null ? 'text-transparent' : 'cursor-pointer text-white/90'
                } ${isSel ? 'bg-white font-bold text-black' : ''} ${
                  isTodayCell && !isSel ? 'ring-1 ring-white/50' : ''
                }`}
                onClick={() => {
                  if (d != null) setSelCal({ y: viewCal.y, m: viewCal.m, d })
                }}
                role="gridcell"
              >
                {d ?? '·'}
              </span>
            )
          })}
        </div>
      </div>

      {/* Clock — split reference style */}
      <div
        className={`desktop-widgets__card pointer-events-auto absolute flex overflow-hidden rounded-2xl border border-white/15 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] ${panelClass} !p-0`}
        style={{ ...cardOffset('clock'), width: WIDGET_SIZE.clock.w, height: WIDGET_SIZE.clock.h }}
      >
        <button
          type="button"
          className="desktop-widgets__grip !absolute !left-1 !top-1 z-10"
          aria-label="Move clock widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'clock')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="flex w-[22%] shrink-0 flex-col items-center justify-center bg-black/80 py-2" />
        <div
          className="flex min-w-0 flex-1 flex-col items-center justify-center bg-gradient-to-br from-amber-900/40 via-stone-800/50 to-zinc-900/60 px-2 text-center"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(60,40,25,0.85) 0%, rgba(45,35,30,0.9) 50%, rgba(30,28,26,0.92) 100%)',
          }}
        >
          <div className="text-[11px] font-bold leading-tight tracking-wide text-white">{dateUpper}</div>
          <div className="mt-1 text-3xl font-black tabular-nums tracking-tight text-white">
            {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Weather */}
      <div
        className={`desktop-widgets__card pointer-events-auto absolute ${panelClass} !h-auto px-3 py-2 text-white`}
        style={{ ...cardOffset('weather'), width: WIDGET_SIZE.weather.w }}
      >
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move weather widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'weather')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="mb-2 text-sm font-bold">San Diego</div>
        {weather.status === 'loading' && <p className="text-xs text-white/50">Loading…</p>}
        {weather.status === 'error' && <p className="text-xs text-white/50">{weather.error}</p>}
        {weather.status === 'ready' && (
          <div className="flex justify-between gap-1">
            {weather.days.map((d, idx) => {
              const dow = new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
              })
              const short = dow.slice(0, 2)
              const hi = d.high != null ? fahrenheit(d.high) : '—'
              const Icon = weatherIconForCode(d.code)
              const ty = now.getFullYear()
              const tm = String(now.getMonth() + 1).padStart(2, '0')
              const td = String(now.getDate()).padStart(2, '0')
              const todayStr = `${ty}-${tm}-${td}`
              const isToday = d.date === todayStr
              return (
                <div
                  key={d.date}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 ${
                    isToday ? 'bg-white/10 ring-1 ring-white/20' : ''
                  }`}
                >
                  <span className="text-[10px] font-bold">{short}</span>
                  <Icon className="h-5 w-5 text-amber-300" strokeWidth={2} />
                  <span className="text-xs font-bold tabular-nums">{hi}°</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Music */}
      <div
        className={`desktop-widgets__card pointer-events-auto absolute ${panelClass}`}
        style={{ ...cardOffset('music'), width: WIDGET_SIZE.music.w, minHeight: WIDGET_SIZE.music.h }}
      >
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move music widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'music')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="text-sm font-bold text-white">Music</div>
        {currentTrack ? (
          <div className="desktop-widgets__music-row mt-1">
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
          <p className="desktop-widgets__muted mt-1">Nothing playing</p>
        )}
      </div>

      {/* Photo frames */}
      {PHOTO_WIDGET_IDS.map((pid) => {
        const { w, h } = dimsFor(pid)
        const src = selectedPhotoIndex != null ? getImagePath(selectedPhotoIndex) : null
        return (
          <div
            key={pid}
            className={`desktop-widgets__card pointer-events-auto absolute overflow-hidden rounded-2xl border border-white/20 shadow-lg ${panelClass} !p-1`}
            style={{ ...cardOffset(pid), width: w, height: h }}
          >
            <button
              type="button"
              className="desktop-widgets__grip"
              aria-label={`Move ${pid} widget, long-press for size`}
              onPointerDown={(e) => handleGripPointerDown(e, pid)}
            >
              <GripVertical size={14} strokeWidth={2} />
            </button>
            <div className="mt-5 flex h-[calc(100%-2.25rem)] w-full items-center justify-center overflow-hidden rounded-lg bg-black/30">
              {src ? (
                <img src={src} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
              ) : (
                <span className="px-2 text-center text-[10px] text-white/40">Open Photos and tap a photo</span>
              )}
            </div>
          </div>
        )
      })}

      {/* Checklist */}
      <div
        className={`desktop-widgets__card pointer-events-auto absolute overflow-hidden !rounded-2xl border border-amber-200/20 shadow-lg ${panelClass}`}
        style={{
          ...cardOffset('checklist'),
          width: WIDGET_SIZE.checklist.w,
          minHeight: WIDGET_SIZE.checklist.h,
        }}
      >
        <button
          type="button"
          className="desktop-widgets__grip"
          aria-label="Move checklist widget"
          onPointerDown={(e) => handleGripPointerDown(e, 'checklist')}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="h-6 shrink-0 bg-[#ffd52b]/90" />
        <div className="flex h-2 items-center justify-center gap-1 bg-[#f5f5f0]/10">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} className="h-0.5 w-0.5 rounded-full bg-white/30" />
          ))}
        </div>
        <ul className="max-h-[140px] space-y-1 overflow-y-auto bg-gradient-to-b from-[#fafaf8] to-[#eceae4] p-2 text-sm text-zinc-800">
          {checkTasks.map((task) => (
            <li
              key={task.id}
              className="flex cursor-pointer items-start gap-2 rounded border border-transparent px-1 py-0.5 hover:border-black/10"
              onClick={() => setEditingTaskId(task.id)}
            >
              <button
                type="button"
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-400 bg-white"
                aria-label={task.done ? 'Mark not done' : 'Mark done'}
                onClick={(e) => {
                  e.stopPropagation()
                  setCheckTasks((prev) =>
                    prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
                  )
                }}
              >
                {task.done ? <span className="text-[10px] font-bold text-green-600">✓</span> : null}
              </button>
              {editingTaskId === task.id ? (
                <input
                  className="min-w-0 flex-1 border-b border-zinc-400 bg-transparent text-sm outline-none"
                  value={task.text}
                  autoFocus
                  onChange={(e) =>
                    setCheckTasks((prev) =>
                      prev.map((t) => (t.id === task.id ? { ...t, text: e.target.value } : t)),
                    )
                  }
                  onBlur={() => setEditingTaskId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTaskId(null)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={task.done ? 'text-zinc-400 line-through' : ''}>{task.text || 'Empty task'}</span>
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              className="w-full rounded py-1 text-left text-xs text-zinc-500 hover:bg-black/5"
              onClick={() => {
                const id = `t-${Date.now()}`
                setCheckTasks((prev) => [...prev, { id, text: 'New task', done: false }])
                setEditingTaskId(id)
              }}
            >
              + Add task
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
