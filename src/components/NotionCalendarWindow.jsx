import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfWeek,
  addDays,
  startOfDay,
  format,
  parseISO,
  isValid,
  isSameDay,
} from 'date-fns'
import { useLanguage } from '../context/LanguageContext'
import NotionMinimalPageEditor from './notion/NotionMinimalPageEditor'
import './NotionCalendarWindow.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const ICON = '/dock-icons/notion-calendar.png'

function demoEvents(weekStart) {
  const slot = (d, h, m) =>
    `${format(addDays(weekStart, d), 'yyyy-MM-dd')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  return [
    { id: 'd1', title: 'Deep work', start: slot(0, 9, 0), end: slot(0, 11, 30), allDay: false },
    { id: 'd2', title: 'Lunch', start: slot(2, 12, 0), end: slot(2, 13, 0), allDay: false },
    { id: 'd3', title: 'Portfolio sync', start: slot(4, 15, 0), end: slot(4, 15, 45), allDay: false },
  ]
}

function evRange(ev) {
  const s = parseISO(ev.start)
  if (!isValid(s)) return null
  const e = parseISO(ev.end || ev.start)
  return { start: s, end: isValid(e) ? e : s }
}

function overlapsDay(ev, day) {
  const r = evRange(ev)
  if (!r) return false
  const a = startOfDay(day)
  const b = addDays(a, 1)
  return r.start < b && r.end > a
}

function formatEventRange(ev) {
  const s = parseISO(ev.start)
  if (!isValid(s)) return ''
  const e = parseISO(ev.end || ev.start)
  const t = (d) => format(d, 'p')
  return !isValid(e) || s.getTime() === e.getTime() ? t(s) : `${t(s)} – ${t(e)}`
}

export default function NotionCalendarWindow() {
  const { t } = useLanguage()
  const [appMode, setAppMode] = useState('calendar')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [configured, setConfigured] = useState(false)

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const eventsByDay = useMemo(() => {
    return days.map((day) =>
      events.filter((ev) => overlapsDay(ev, day)).sort((a, b) => String(a.start).localeCompare(String(b.start))),
    )
  }, [days, events])

  useEffect(() => {
    let cancelled = false
    const path = `/api/notion/calendar?start=${encodeURIComponent(weekStart.toISOString())}&end=${encodeURIComponent(
      addDays(weekStart, 7).toISOString(),
    )}`
    const url = API_BASE ? `${API_BASE}${path}` : path

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        const data = await res.json()
        if (cancelled) return
        if (!data.configured) {
          setConfigured(false)
          setEvents(demoEvents(weekStart))
        } else {
          setConfigured(true)
          setError(data.error || null)
          setEvents(data.error ? [] : data.events || [])
        }
      } catch {
        if (cancelled) return
        setConfigured(false)
        setError(null)
        setEvents(demoEvents(weekStart))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [weekStart])

  const monthLabel = format(weekStart, 'MMMM yyyy')
  const today = new Date()

  return (
    <div className="notion-cal">
      <header className="notion-cal__toolbar">
        <div className="notion-cal__brand">
          <img src={ICON} alt="" className="notion-cal__brand-img" width={20} height={20} />
          <span className="notion-cal__brand-text">{t('notionCalendar.brand')}</span>
        </div>
        <div className="notion-cal__mode-toggle" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={appMode === 'calendar'}
            className={`notion-cal__mode-btn ${appMode === 'calendar' ? 'notion-cal__mode-btn--active' : ''}`}
            onClick={() => setAppMode('calendar')}
          >
            Calendar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={appMode === 'page'}
            className={`notion-cal__mode-btn ${appMode === 'page' ? 'notion-cal__mode-btn--active' : ''}`}
            onClick={() => setAppMode('page')}
          >
            Page
          </button>
        </div>
        {appMode === 'calendar' && (
          <>
            <div className="notion-cal__nav">
              <button type="button" className="notion-cal__nav-btn" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label={t('notionCalendar.prevWeek')}>
                <ChevronLeft size={18} strokeWidth={1.75} />
              </button>
              <button type="button" className="notion-cal__today" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}>
                {t('notionCalendar.today')}
              </button>
              <button type="button" className="notion-cal__nav-btn" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label={t('notionCalendar.nextWeek')}>
                <ChevronRight size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="notion-cal__month" aria-live="polite">
              {monthLabel}
            </div>
          </>
        )}
      </header>

      {appMode === 'page' ? (
        <NotionMinimalPageEditor />
      ) : (
        <>
      {!configured && <p className="notion-cal__banner">{t('notionCalendar.demoMode')}</p>}
      {error && <p className="notion-cal__error">{error}</p>}
      {loading && <p className="notion-cal__loading">{t('notionCalendar.loading')}</p>}

      <div className="notion-cal__grid">
        <div className="notion-cal__weekdays">
          {days.map((d) => (
            <div
              key={format(d, 'yyyy-MM-dd')}
              className={`notion-cal__weekday ${isSameDay(d, today) ? 'notion-cal__weekday--today' : ''}`}
            >
              <span className="notion-cal__weekday-name">{format(d, 'EEE')}</span>
              <span className="notion-cal__weekday-num">{format(d, 'd')}</span>
            </div>
          ))}
        </div>
        <div className="notion-cal__columns">
          {days.map((d, i) => (
            <div key={format(d, 'yyyy-MM-dd')} className="notion-cal__col">
              <div className="notion-cal__col-inner">
                {eventsByDay[i].length === 0 && !loading && (
                  <span className="notion-cal__empty">{t('notionCalendar.empty')}</span>
                )}
                {eventsByDay[i].map((ev) => (
                  <div key={ev.id} className="notion-cal__event">
                    <div className="notion-cal__event-title">{ev.title}</div>
                    {ev.allDay ? (
                      <div className="notion-cal__event-time notion-cal__event-time--allday">{t('notionCalendar.allDay')}</div>
                    ) : (
                      <div className="notion-cal__event-time">{formatEventRange(ev)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="notion-cal__footer">
        <p className="notion-cal__hint">{t('notionCalendar.serverHint')}</p>
      </footer>
        </>
      )}
    </div>
  )
}
