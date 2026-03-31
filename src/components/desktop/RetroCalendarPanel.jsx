import { useMemo, useRef, useLayoutEffect } from 'react'

export function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const pad = first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < pad; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** `compact` = square summary; `full` = two-column month grid (folder modal). */
export default function RetroCalendarPanel({
  now,
  variant = 'full',
  weekdayAccentColor,
  /** Compact variant: big day number (defaults to weekday accent). */
  dayAccentColor,
}) {
  const y = now.getFullYear()
  const m = now.getMonth()
  const cells = useMemo(() => buildMonthCells(y, m), [y, m])
  const monthName = new Date(y, m, 1).toLocaleString(undefined, { month: 'long' }).toUpperCase()
  const dowToday = now.toLocaleString(undefined, { weekday: 'short' }).toUpperCase()
  const monthShort = now.toLocaleString(undefined, { month: 'short' }).toUpperCase()
  const dayToday = String(now.getDate())
  const wrapRef = useRef(null)
  const leftRef = useRef(null)

  useLayoutEffect(() => {
    if (variant !== 'full') return
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
  }, [y, m, now, variant])

  const isToday = (day) =>
    day != null && now.getFullYear() === y && now.getMonth() === m && now.getDate() === day

  if (variant === 'compact') {
    return (
      <div className="desktop-widgets__retro-cal desktop-widgets__retro-cal--compact">
        <div
          className="desktop-widgets__retro-cal-compact-top"
          style={weekdayAccentColor ? { color: weekdayAccentColor } : undefined}
        >
          {dowToday} {monthShort}
        </div>
        <div
          className="desktop-widgets__retro-cal-compact-day"
          style={dayAccentColor || weekdayAccentColor ? { color: dayAccentColor || weekdayAccentColor } : undefined}
        >
          {dayToday}
        </div>
      </div>
    )
  }

  return (
    <div className="desktop-widgets__retro-cal" ref={wrapRef}>
      <div className="desktop-widgets__retro-cal-summary" ref={leftRef}>
        <div className="desktop-widgets__retro-cal-dow">{dowToday}</div>
        <div className="desktop-widgets__retro-cal-day-big">{dayToday}</div>
      </div>
      <div className="desktop-widgets__retro-cal-main">
        <div className="desktop-widgets__retro-cal-month-row">
          <span className="desktop-widgets__retro-cal-month">{monthName}</span>
        </div>
        <div className="desktop-widgets__retro-cal-dow-row" aria-hidden>
          {DOW.map((letter, i) => (
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
