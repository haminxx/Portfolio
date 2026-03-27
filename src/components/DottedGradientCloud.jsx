import { useMemo } from 'react'

const COOL = '#4fc3f7'
const WARM = '#ffeb3b'

function lerpColor(t) {
  const ah = COOL.slice(1).match(/.{2}/g).map((x) => parseInt(x, 16))
  const bh = WARM.slice(1).match(/.{2}/g).map((x) => parseInt(x, 16))
  const r = Math.round(ah[0] + (bh[0] - ah[0]) * t)
  const g = Math.round(ah[1] + (bh[1] - ah[1]) * t)
  const b = Math.round(ah[2] + (bh[2] - ah[2]) * t)
  return `rgb(${r},${g},${b})`
}

function inCloudShape(x, y) {
  const d1 = ((x - 38) ** 2) / 28 ** 2 + ((y - 48) ** 2) / 22 ** 2
  const d2 = ((x - 58) ** 2) / 32 ** 2 + ((y - 44) ** 2) / 26 ** 2
  const d3 = ((x - 72) ** 2) / 24 ** 2 + ((y - 50) ** 2) / 20 ** 2
  const bar = x > 32 && x < 78 && y > 52 && y < 68
  return d1 <= 1 || d2 <= 1 || d3 <= 1 || bar
}

export default function DottedGradientCloud({ className = '' }) {
  const circles = useMemo(() => {
    const out = []
    let seed = 42
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    for (let gy = 0; gy < 34; gy += 1) {
      for (let gx = 0; gx < 50; gx += 1) {
        const x = 8 + gx * 1.68 + (rnd() - 0.5) * 0.9
        const y = 18 + gy * 1.75 + (rnd() - 0.5) * 0.9
        if (!inCloudShape(x, y)) continue
        const dist = Math.hypot(x - 50, y - 50) / 45
        const density = Math.max(0, 1 - dist * 0.85)
        if (rnd() > 0.25 + density * 0.55) continue
        const baseR = 0.35 + density * 1.15 + rnd() * 0.35
        const gxGrad = (x - 20) / 65
        const gyGrad = (y - 30) / 50
        const t = Math.max(0, Math.min(1, gxGrad * 0.65 + gyGrad * 0.35))
        out.push({ cx: x, cy: y, r: baseR, fill: lerpColor(t) })
      }
    }
    return out
  }, [])

  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} opacity={0.92} />
      ))}
    </svg>
  )
}
