import { useId } from 'react'

/**
 * Compact analog clock; hands driven by wall time in optional IANA timeZone.
 */
function getHmsInZone(date, timeZone) {
  const opts = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }
  if (timeZone) opts.timeZone = timeZone
  const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(date)
  const n = (type) => {
    const p = parts.find((x) => x.type === type)
    return p ? parseInt(p.value, 10) : 0
  }
  return { h: n('hour') % 24, m: n('minute'), s: n('second') }
}

export default function AnalogClockFace({ now, timeZone, size = 52, ariaLabel }) {
  const uid = useId().replace(/:/g, '')
  const filterId = `analog-clock-${uid}`
  const { h, m, s } = getHmsInZone(now, timeZone)
  const h12 = h % 12
  const secAngle = s * 6
  const minAngle = m * 6 + s * 0.1
  const hourAngle = h12 * 30 + m * 0.5 + s * (1 / 120)

  const vb = 100
  const c = vb / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      className="analog-clock-face"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle
        cx={c}
        cy={c}
        r={42}
        fill="rgba(0,0,0,0.2)"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.85"
      />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const rad = ((i / 12) * Math.PI * 2) - Math.PI / 2
        const x1 = c + Math.cos(rad) * 36
        const y1 = c + Math.sin(rad) * 36
        const x2 = c + Math.cos(rad) * 40
        const y2 = c + Math.sin(rad) * 40
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
        )
      })}
      <g
        transform={`translate(${c} ${c}) rotate(${hourAngle})`}
        filter={`url(#${filterId})`}
      >
        <line x1="0" y1="4" x2="0" y2="-22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <g transform={`translate(${c} ${c}) rotate(${minAngle})`} filter={`url(#${filterId})`}>
        <line x1="0" y1="5" x2="0" y2="-32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g transform={`translate(${c} ${c}) rotate(${secAngle})`}>
        <line
          x1="0"
          y1="6"
          x2="0"
          y2="-36"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.95"
        />
      </g>
      <circle cx={c} cy={c} r="3.2" fill="currentColor" opacity="0.95" />
    </svg>
  )
}
