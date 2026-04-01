import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import './NotionCalendarWindow.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function startOfWeekSunday(d) {
  const x = new Date(d)
  const day = x.getDay()
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function formatDayKey(d) {
  return d.toISOString().slice(0, 10)
}

function parseEventTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function eventIntersectsDay(ev, dayStart, dayEnd) {
  const s = parseEventTime(ev.start)
  const e = parseEventTime(ev.end) || s
  if (!s) return false
  return s < dayEnd && e > dayStart
}

function buildDemoEvents(weekStart) {
  const ws = new Date(weekStart)
  const pad = (n) => String(n).padStart(2, '0')
  const at = (dayOffset, h, m) => {
    const d = addDays(ws, dayOffset)
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}:00`
    return iso
  }
  return [
    {
      id: 'demo-1',
      title: 'Deep work',
      start: at(0, 9, 0),
      end: at(0, 11, 30),
      allDay: false,
    },
    {
      id: 'demo-2',
      title: 'Lunch',
      start: at(2, 12, 0),
      end: at(2, 13, 0),
      allDay: false,
    },
    {
      id: 'demo-3',
      title: 'Portfolio sync',
      start: at(4, 15, 0),
      end: at(4, 15, 45),
      allDay: false,
    },
  ]
}

export default function NotionCalendarWindow() {
  const { t } = useLanguage()
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekSunday(new Date()))
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [configured, setConfigured] = useState(false)

  const weekStart = useMemo(() => startOfWeekSunday(weekAnchor), [weekAnchor])
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const startIso = weekStart.toISOString()
    const endIso = weekEnd.toISOString()
    const path = `/api/notion/calendar?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`
    const url = API_BASE ? `${API_BASE}${path}` : path
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (!data.configured) {
        setConfigured(false)
        setEvents(buildDemoEvents(weekStart))
        setLoading(false)
        return
      }
      setConfigured(true)
      if (data.error) {
        setError(data.error)
        setEvents([])
      } else {
        setEvents(Array.isArray(data.events) ? data.events : [])
      }
    } catch {
      setConfigured(false)
      setEvents(buildDemoEvents(weekStart))
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd])

  useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
    return fmt.format(weekStart)
  }, [weekStart])

  const goPrevWeek = () => setWeekAnchor((a) => addDays(a, -7))
  const goNextWeek = () => setWeekAnchor((a) => addDays(a, 7))
  const goToday = () => setWeekAnchor(startOfWeekSunday(new Date()))

  const isToday = (d) => formatDayKey(d) === formatDayKey(new Date())

  return (
    <div className="notion-cal">
      <header className="notion-cal__toolbar">
        <div className="notion-cal__brand">
          <CalendarDays size={18} strokeWidth={1.5} className="notion-cal__brand-icon" aria-hidden />
          <span className="notion-cal__brand-text">{t('notionCalendar.brand')}</span>
        </div>
        <div className="notion-cal__nav">
          <button type="button" className="notion-cal__nav-btn" onClick={goPrevWeek} aria-label={t('notionCalendar.prevWeek')}>
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>
          <button type="button" className="notion-cal__today" onClick={goToday}>
            {t('notionCalendar.today')}
          </button>
          <button type="button" className="notion-cal__nav-btn" onClick={goNextWeek} aria-label={t('notionCalendar.nextWeek')}>
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="notion-cal__month" aria-live="polite">
          {monthLabel}
        </div>
      </header>

      {!configured && (
        <p className="notion-cal__banner">{t('notionCalendar.demoMode')}</p>
      )}
      {error && <p className="notion-cal__error">{error}</p>}
      {loading && <p className="notion-cal__loading">{t('notionCalendar.loading')}</p>}

      <div className="notion-cal__grid">
        <div className="notion-cal__weekdays">
          {days.map((d) => {
            const wd = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d)
            const dm = d.getDate()
            return (
              <div
                key={formatDayKey(d)}
                className={`notion-cal__weekday ${isToday(d) ? 'notion-cal__weekday--today' : ''}`}
              >
                <span className="notion-cal__weekday-name">{wd}</span>
                <span className="notion-cal__weekday-num">{dm}</span>
              </div>
            )
          })}
        </div>
        <div className="notion-cal__columns">
          {days.map((d) => {
            const key = formatDayKey(d)
            const dayStart = new Date(d)
            const dayEnd = addDays(dayStart, 1)
            const dayEvents = events
              .filter((ev) => eventIntersectsDay(ev, dayStart, dayEnd))
              .sort((a, b) => String(a.start).localeCompare(String(b.start)))

            return (
              <div key={key} className="notion-cal__col">
                <div className="notion-cal__col-inner">
                  {dayEvents.length === 0 && !loading && (
                    <span className="notion-cal__empty">{t('notionCalendar.empty')}</span>
                  )}
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="notion-cal__event">
                      <div className="notion-cal__event-title">{ev.title}</div>
                      {!ev.allDay && (
                        <div className="notion-cal__event-time">
                          {formatEventRange(ev)}
                        </div>
                      )}
                      {ev.allDay && (
                        <div className="notion-cal__event-time notion-cal__event-time--allday">{t('notionCalendar.allDay')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="notion-cal__footer">
        <p className="notion-cal__hint">{t('notionCalendar.serverHint')}</p>
      </footer>
    </div>
  )
}

function formatEventRange(ev) {
  const s = parseEventTime(ev.start)
  const e = parseEventTime(ev.end)
  if (!s) return ''
  const tf = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
  if (!e || e.getTime() === s.getTime()) return tf.format(s)
  return `${tf.format(s)} – ${tf.format(e)}`
}
