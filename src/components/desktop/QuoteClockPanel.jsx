/** Hands-only clock as the “O” in NOW (no ring). */
export function QuoteAnalogClockO({ date, secondHandColor = '#ff2d2d' }) {
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
            stroke={secondHandColor}
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

/** Desktop “DO IT NOW” line with clock as O. */
export function DoItNowClockWidget({ date }) {
  return (
    <div className="desktop-widgets__quote-widget">
      <p className="desktop-widgets__quote-line desktop-widgets__quote-line--now-only">
        <span className="desktop-widgets__quote-now-prefix">DO IT N</span>
        <QuoteAnalogClockO date={date} />
        <span className="desktop-widgets__quote-now-suffix">W</span>
      </p>
    </div>
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
