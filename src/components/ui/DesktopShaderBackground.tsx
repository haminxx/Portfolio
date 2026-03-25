import { Canvas, useThree } from '@react-three/fiber'
import { ShaderPlane } from './background-paper-shaders'

function Scene() {
  const { width, height } = useThree((s) => s.viewport)
  const pad = 1.12
  return (
    <ShaderPlane
      position={[0, 0, 0]}
      scale={[width * pad, height * pad, 1]}
      color1="#8fa3c2"
      color2="#f2f6fc"
    />
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
        background: '#e8edf5',
      }}
    >
      <Canvas
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5], near: 0.1, far: 20 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
