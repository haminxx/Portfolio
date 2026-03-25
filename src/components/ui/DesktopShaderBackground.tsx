import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ShaderPlane } from './background-paper-shaders'

const FALLBACK_BG = '#2a2420'

function Scene() {
  const { width, height, scene, gl } = useThree()
  const pad = 1.12

  useEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }, [scene, gl])

  return (
    <ShaderPlane position={[0, 0, 0]} scale={[width * pad, height * pad, 1]} />
  )
}

export default function DesktopShaderBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: FALLBACK_BG,
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
        <Scene />
      </Canvas>
    </div>
  )
}
