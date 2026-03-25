import { useMemo, type CSSProperties } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'
import './DesktopShaderBackground.css'

export type DesktopShaderBackgroundProps = {
  color1?: string
  color2?: string
  speed?: number
}

const DEFAULT_COLOR1 = '#1a1a1a'
const DEFAULT_COLOR2 = '#e8e4df'
const DEFAULT_SPEED = 0.72
const DEMO_BG = '#0a0a0a'

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const s = hex.trim()
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s)
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function toHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function mixColors(a: string, b: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(b)
  if (!A || !B) return a
  return toHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t)
}

/** Four mesh stops: deep base, mid blend, accent, near-highlight — driven by the two widget colors. */
export function meshGradientColorsFromPair(color1: string, color2: string): string[] {
  return [color1, mixColors(color1, color2, 0.38), color2, mixColors(color2, '#ffffff', 0.84)]
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return `rgba(128,128,128,${alpha})`
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

export default function DesktopShaderBackground({
  color1 = DEFAULT_COLOR1,
  color2 = DEFAULT_COLOR2,
  speed = DEFAULT_SPEED,
}: DesktopShaderBackgroundProps) {
  const colors = useMemo(() => meshGradientColorsFromPair(color1, color2), [color1, color2])
  const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED
  const pulseSec = Math.max(2.2, 9.5 / Math.min(Math.max(safeSpeed, 0.12), 2.5))

  const orbStyle = (extra: CSSProperties): CSSProperties => ({
    animation: `desktop-shader-bg-pulse ${pulseSec}s ease-in-out infinite`,
    ...extra,
  })

  return (
    <div
      aria-hidden
      className="desktop-shader-bg"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: DEMO_BG,
      }}
    >
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={colors}
        speed={safeSpeed}
        distortion={0.82}
        swirl={0.12}
        grainMixer={0}
        grainOverlay={0}
        fit="cover"
      />
      <div
        className="desktop-shader-bg__orb"
        style={orbStyle({
          top: '12%',
          left: '8%',
          width: 'min(42vw, 420px)',
          height: 'min(42vw, 420px)',
          background: hexToRgba(color2, 0.22),
        })}
      />
      <div
        className="desktop-shader-bg__orb"
        style={orbStyle({
          bottom: '6%',
          right: '4%',
          width: 'min(48vw, 480px)',
          height: 'min(48vw, 480px)',
          background: hexToRgba(color2, 0.18),
          animationDelay: `${pulseSec * 0.33}s`,
        })}
      />
      <div
        className="desktop-shader-bg__orb"
        style={orbStyle({
          top: '38%',
          right: '18%',
          width: 'min(36vw, 360px)',
          height: 'min(36vw, 360px)',
          background: hexToRgba(color1, 0.2),
          animationDelay: `${pulseSec * 0.66}s`,
        })}
      />
    </div>
  )
}
