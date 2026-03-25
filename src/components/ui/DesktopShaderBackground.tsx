import { useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ShaderPlane } from './background-paper-shaders'

export type DesktopShaderBackgroundProps = {
  color1?: string
  color2?: string
  speed?: number
  waveAmp?: number
}

function Scene({
  color1,
  color2,
  speed,
  waveAmp,
}: {
  color1: string
  color2: string
  speed: number
  waveAmp: number
}) {
  const { scene, gl } = useThree()

  useEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }, [scene, gl])

  return (
    <ShaderPlane
      position={[0, 0, 0]}
      viewportPad={1.12}
      color1={color1}
      color2={color2}
      speed={speed}
      waveAmp={waveAmp}
    />
  )
}

const DEFAULT_COLOR1 = '#121018'
const DEFAULT_COLOR2 = '#d4cfc4'
const DEFAULT_SPEED = 0.35
const DEFAULT_WAVE = 1.0

export default function DesktopShaderBackground({
  color1 = DEFAULT_COLOR1,
  color2 = DEFAULT_COLOR2,
  speed = DEFAULT_SPEED,
  waveAmp = DEFAULT_WAVE,
}: DesktopShaderBackgroundProps) {
  const fallbackBg = useMemo(() => color1, [color1])

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: fallbackBg,
      }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          premultipliedAlpha: false,
        }}
        camera={{ position: [0, 0, 5], near: 0.1, far: 20 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Scene color1={color1} color2={color2} speed={speed} waveAmp={waveAmp} />
      </Canvas>
    </div>
  )
}
