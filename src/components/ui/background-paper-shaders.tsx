import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** Reference: 21st.dev reuno-ui/background-paper-shaders (verbatim GLSL). */
const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vec2 uv = vUv;
    
    float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
    noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
    
    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity);
    
    float glow = 1.0 - length(uv - 0.5) * 2.0;
    glow = pow(glow, 2.0);
    
    gl_FragColor = vec4(color * glow, glow * 0.8);
  }
`

/** Slightly slower motion than raw elapsedTime while keeping reference shader math. */
const TIME_SCALE = 0.72

export function ShaderPlane({
  position,
  scale,
  viewportPad,
  color1 = '#ff5722',
  color2 = '#ffffff',
}: {
  position: [number, number, number]
  scale?: [number, number, number]
  viewportPad?: number
  color1?: string
  color2?: string
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const viewport = useThree((s) => s.viewport)

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 1.0 },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2],
  )

  const color1Ref = useRef(color1)
  const color2Ref = useRef(color2)
  color1Ref.current = color1
  color2Ref.current = color2

  useFrame((state) => {
    if (!mesh.current) return
    if (viewportPad != null) {
      const w = viewport.width
      const h = viewport.height
      if (w > 0 && h > 0) {
        mesh.current.scale.set(w * viewportPad, h * viewportPad, 1)
      }
    }
    const t = state.clock.elapsedTime * TIME_SCALE
    uniforms.time.value = t
    uniforms.intensity.value = 1.0 + Math.sin(t * 2) * 0.3
    uniforms.color1.value.set(color1Ref.current)
    uniforms.color2.value.set(color2Ref.current)
  })

  return (
    <mesh
      ref={mesh}
      position={position}
      scale={viewportPad != null ? [1, 1, 1] : (scale ?? [1, 1, 1])}
      frustumCulled={false}
    >
      <planeGeometry args={[2, 2, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function EnergyRing({
  radius = 1,
  position = [0, 0, 0],
}: {
  radius?: number
  position?: [number, number, number]
}) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!mesh.current) return
    const m = mesh.current
    m.rotation.z = state.clock.elapsedTime * TIME_SCALE
    const mat = m.material as THREE.MeshBasicMaterial
    if (mat) mat.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3
  })

  return (
    <mesh ref={mesh} position={position}>
      <ringGeometry args={[radius * 0.8, radius, 32]} />
      <meshBasicMaterial color="#ff5722" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}
