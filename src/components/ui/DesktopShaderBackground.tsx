import { Canvas, useThree } from '@react-three/fiber'
import { ShaderPlane } from './background-paper-shaders'

function Scene() {
  const { width, height } = useThree((s) => s.viewport)
  const pad = 1.08
  return (
    <ShaderPlane
      position={[0, 0, 0]}
      scale={[width * pad, height * pad, 1]}
      color1="#121018"
      color2="#2c2438"
    />
  )
}

export default function DesktopShaderBackground() {
  return (
    <div
      className="desktop-shader-wrap"
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5], near: 0.1, far: 20 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
