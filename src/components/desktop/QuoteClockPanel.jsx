/** Hands-only clock as the “O” in NOW (no ring). — folder quote only */
export function QuoteAnalogClockO({
  date,
  accentColor = '#ffffff',
  secondHandColor,
}) {
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
  const sec = secondHandColor ?? accentColor

  return (
    <span className="desktop-widgets__quote-o-wrap" role="timer" aria-live="polite" aria-label={`Time ${label}`}>
      <svg className="desktop-widgets__quote-o-svg" viewBox="0 0 100 100" aria-hidden>
        <g transform="translate(50,50)">
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-26"
            stroke={accentColor}
            strokeWidth="5"
            strokeLinecap="round"
            transform={`rotate(${hourDeg})`}
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-36"
            stroke={accentColor}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${minDeg})`}
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-40"
            stroke={sec}
            strokeWidth="1.35"
            strokeLinecap="round"
            transform={`rotate(${secDeg})`}
          />
          <circle cx="0" cy="0" r="4" fill={accentColor} />
        </g>
      </svg>
    </span>
  )
}

/** Folder modal: long quote + centered clock + watermark. */
export function FolderQuoteClockWidget({ date }) {
  return (
    <div className="desktop-folder-quote">
      <p className="desktop-folder-quote__text">
        <span className="desktop-folder-quote__line">The problem is,</span>
        <span className="desktop-folder-quote__line desktop-folder-quote__line--with-clock">
          <span>You think you have</span>
          <QuoteAnalogClockO date={date} />
          <span>ime.</span>
        </span>
      </p>
      <p className="desktop-folder-quote__watermark">Portfolio quote widget</p>
    </div>
  )
}
