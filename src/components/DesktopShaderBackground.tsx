import { Canvas, useThree } from '@react-three/fiber'
import { ShaderPlane, EnergyRing } from './ui/background-paper-shaders'

function SceneContent() {
  const { viewport } = useThree()
  const sx = viewport.width / 2
  const sy = viewport.height / 2
  const ringR = Math.min(viewport.width, viewport.height) * 0.42

  return (
    <>
      <ShaderPlane position={[0, 0, 0]} scale={[sx, sy, 1]} color1="#0c0b10" color2="#352848" />
      <EnergyRing radius={ringR} position={[0, 0, 0.02]} />
    </>
  )
}

export default function DesktopShaderBackground() {
  return (
    <Canvas
      className="!fixed inset-0 !h-full !w-full pointer-events-none"
      style={{ zIndex: 1 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 2], fov: 50 }}
    >
      <SceneContent />
    </Canvas>
  )
}
