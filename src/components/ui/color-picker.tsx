import { memo, useEffect, useRef, useState, type PointerEvent } from 'react'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

/** Rough RGB → HSL for initializing wheel from stored hex prefs. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 0, s: 100, l: 50 }
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const l = ((max + min) / 2) * 100
  const s = d < 1e-6 ? 0 : (d / (1 - Math.abs(2 * (l / 100) - 1))) * 100
  if (d > 1e-6) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / d + 2) * 60
        break
      default:
        h = ((r - g) / d + 4) * 60
    }
  }
  return { h: ((h % 360) + 360) % 360, s, l }
}

function hslToHex(h: number, s: number, l: number) {
  let L = l / 100
  const S = s / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = S * Math.min(L, 1 - L)
  const f = (n: number) => L - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1))
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((x) =>
        Math.round(x * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

export interface ColorPickerProps {
  size?: number
  padding?: number
  bulletRadius?: number
  spreadFactor?: number
  minSpread?: number
  maxSpread?: number
  minLight?: number
  maxLight?: number
  showColorWheel?: boolean
  numPoints?: number
  /** Main (draggable) bullet color — from persisted prefs */
  initialPrimaryHex?: string
  onColorChange?: (colors: string[]) => void
}

function ColorPickerInner({
  size = 280,
  padding = 20,
  bulletRadius = 24,
  spreadFactor = 0.4,
  minSpread = Math.PI / 1.5,
  maxSpread = Math.PI / 3,
  minLight = 15,
  maxLight = 90,
  showColorWheel = true,
  numPoints = 2,
  initialPrimaryHex,
  onColorChange,
}: ColorPickerProps) {
  const RADIUS = size / 2 - padding
  const onColorChangeRef = useRef(onColorChange)
  onColorChangeRef.current = onColorChange

  const [angle, setAngle] = useState(() => {
    const { h } = hexToHsl(initialPrimaryHex || '#888888')
    return (h / 180) * Math.PI
  })
  const [radius, setRadius] = useState(() => {
    const rMax = size / 2 - padding
    const { l } = hexToHsl(initialPrimaryHex || '#888888')
    const t = (l - minLight) / (maxLight - minLight)
    return Math.max(0, Math.min(rMax, t * rMax))
  })
  const [drag, setDrag] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const ref = useRef<HTMLCanvasElement>(null)

  const hue = ((((angle * 180) / Math.PI) % 360) + 360) % 360
  const light = maxLight * (radius / RADIUS)
  const color = hslToHex(hue, 100, light)

  const normalizedRadius = radius / RADIUS
  const spread = (minSpread + (maxSpread - minSpread) * Math.pow(normalizedRadius, 3)) * spreadFactor

  const angle1 = angle - spread
  const angle2 = angle + spread
  const hue1 = ((((angle1 * 180) / Math.PI) % 360) + 360) % 360
  const hue2 = ((((angle2 * 180) / Math.PI) % 360) + 360) % 360
  const light1 = maxLight * (radius / RADIUS)
  const light2 = maxLight * (radius / RADIUS)
  const color1 = hslToHex(hue1, 100, light1)
  const color2pt = hslToHex(hue2, 100, light2)

  const bx1 = size / 2 + Math.cos(angle1) * radius
  const by1 = size / 2 + Math.sin(angle1) * radius
  const bx2 = size / 2 + Math.cos(angle2) * radius
  const by2 = size / 2 + Math.sin(angle2) * radius

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)

    ctx.beginPath()
    ctx.arc(size / 2, size / 2, RADIUS, 0, Math.PI * 2)
    ctx.clip()

    for (let r = 0; r <= RADIUS; r++) {
      for (let a = 0; a < 360; a += 1) {
        const rad = (a * Math.PI) / 180
        const x = size / 2 + Math.cos(rad) * r
        const y = size / 2 + Math.sin(rad) * r
        const lightness = minLight + (maxLight - minLight) * (r / RADIUS)
        ctx.beginPath()
        ctx.strokeStyle = hslToHex(a, 100, lightness)
        ctx.moveTo(x, y)
        ctx.lineTo(x + 1, y + 1)
        ctx.stroke()
      }
    }
  }, [size, RADIUS, minLight, maxLight])

  useEffect(() => {
    if (!hasInteracted) return
    const colors =
      numPoints === 1 ? [color] : numPoints === 2 ? [color2pt, color] : [color2pt, color, color1]
    onColorChangeRef.current?.(colors)
  }, [color, color1, color2pt, numPoints, hasInteracted])

  function setFromPointer(e: PointerEvent<HTMLDivElement>) {
    const canvas = ref.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    let r = Math.sqrt(x * x + y * y)
    let a = Math.atan2(y, x)
    if (a < 0) a += 2 * Math.PI
    r = Math.max(0, Math.min(RADIUS, r))
    setAngle(a)
    setRadius(r)
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    setHasInteracted(true)
    setDrag(true)
    setFromPointer(e)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag) return
    setFromPointer(e)
  }

  function onPointerUp() {
    setDrag(false)
  }

  const bx = size / 2 + Math.cos(angle) * radius
  const by = size / 2 + Math.sin(angle) * radius

  return (
    <div>
      <div
        style={{
          width: size,
          height: size,
        }}
        className="relative select-none"
      >
        <canvas
          ref={ref}
          width={size}
          height={size}
          className={showColorWheel ? 'rounded-full' : 'rounded-full opacity-0'}
        />

        {numPoints >= 2 && (
          <div
            className="pointer-events-none absolute z-20 rounded-full border-2 border-white/80 opacity-90 shadow"
            style={{
              left: bx2 - bulletRadius / 1.7,
              top: by2 - bulletRadius / 1.7,
              width: bulletRadius * 1.2,
              height: bulletRadius * 1.2,
              background: color2pt,
            }}
          />
        )}

        <div
          className="absolute z-30 cursor-grab touch-none rounded-full border-2 border-white/90 shadow"
          style={{
            left: bx - bulletRadius,
            top: by - bulletRadius,
            width: bulletRadius * 2,
            height: bulletRadius * 2,
            background: color,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {numPoints >= 3 && (
          <div
            className="pointer-events-none absolute z-20 rounded-full border-2 border-white/80 opacity-90 shadow"
            style={{
              left: bx1 - bulletRadius / 1.7,
              top: by1 - bulletRadius / 1.7,
              width: bulletRadius * 1.2,
              height: bulletRadius * 1.2,
              background: color1,
            }}
          />
        )}
      </div>
    </div>
  )
}

const ColorPicker = memo(ColorPickerInner)
export default ColorPicker
