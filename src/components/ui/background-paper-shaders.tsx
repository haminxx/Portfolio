import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Muted luxury pairs (khaki, navy, wine, forest, plum, bronze) — slow cross-fade in useFrame. */
const LUXURY_PAIRS = [
  { c1: '#2e2924', c2: '#524739' },
  { c1: '#1a2432', c2: '#3a4d68' },
  { c1: '#2a1e26', c2: '#4a3342' },
  { c1: '#1e2c27', c2: '#3a5248' },
  { c1: '#25222e', c2: '#3f3a4f' },
  { c1: '#2b2618', c2: '#4a4230' },
]

const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    /* Primary slow wave; secondary motion kept subtle for one dominant swell */
    pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.028 * intensity;
    
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
    glow = pow(max(glow, 0.001), 2.0);
    
    gl_FragColor = vec4(color * glow, glow * 0.88);
  }
`

export function ShaderPlane({
  position,
  scale,
}: {
  position: [number, number, number]
  scale?: [number, number, number]
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const tmp1a = useRef(new THREE.Color())
  const tmp1b = useRef(new THREE.Color())
  const tmp2a = useRef(new THREE.Color())
  const tmp2b = useRef(new THREE.Color())

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 1.0 },
      color1: { value: new THREE.Color(LUXURY_PAIRS[0].c1) },
      color2: { value: new THREE.Color(LUXURY_PAIRS[0].c2) },
    }),
    [],
  )

  useFrame((state) => {
    if (!mesh.current) return
    const elapsed = state.clock.elapsedTime
    /* Slow animation overall */
    uniforms.time.value = elapsed * 0.19
    uniforms.intensity.value = 1.0 + Math.sin(elapsed * 0.45) * 0.28

    const n = LUXURY_PAIRS.length
    const span = 22
    const phase = ((elapsed / span) * n) % n
    const i0 = Math.floor(phase) % n
    const f = phase - Math.floor(phase)
    const t = f * f * (3.0 - 2.0 * f)

    const pA = LUXURY_PAIRS[i0]
    const pB = LUXURY_PAIRS[(i0 + 1) % n]
    tmp1a.current.set(pA.c1)
    tmp1b.current.set(pB.c1)
    tmp2a.current.set(pA.c2)
    tmp2b.current.set(pB.c2)
    uniforms.color1.value.copy(tmp1a.current).lerp(tmp1b.current, t)
    uniforms.color2.value.copy(tmp2a.current).lerp(tmp2b.current, t)
  })

  return (
    <mesh ref={mesh} position={position} scale={scale ?? [1, 1, 1]}>
      <planeGeometry args={[2, 2, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
