import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    float wavePhase = pos.x * 2.8 + pos.y * 0.4 + time * 0.32;
    pos.y += sin(wavePhase) * 0.12 * intensity;
    
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
    
    float softWave = sin(uv.x * 3.14159 * 1.4 + uv.y * 2.1 + time * 0.35) * 0.5 + 0.5;
    vec3 base = mix(color1, color2, smoothstep(0.0, 1.0, softWave * 0.72 + uv.y * 0.28));
    
    float lightBand = sin(uv.x * 2.4 + uv.y * 1.1 - time * 0.22);
    lightBand = smoothstep(0.25, 1.0, lightBand * 0.5 + 0.5);
    vec3 highlight = vec3(0.97, 0.98, 1.0);
    base = mix(base, highlight, lightBand * 0.22 * intensity);
    
    float vignette = length(uv - 0.5) * 1.15;
    float dim = mix(1.0, 0.91, smoothstep(0.35, 1.05, vignette));
    
    gl_FragColor = vec4(base * dim, 0.92);
  }
`

export function ShaderPlane({
  position,
  scale,
  color1 = '#1a1520',
  color2 = '#3d3550',
}: {
  position: [number, number, number]
  scale?: [number, number, number]
  color1?: string
  color2?: string
}) {
  const mesh = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 1.0 },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2],
  )

  useFrame((state) => {
    if (mesh.current) {
      uniforms.time.value = state.clock.elapsedTime
      uniforms.intensity.value = 0.92 + Math.sin(state.clock.elapsedTime * 0.45) * 0.08
    }
  })

  return (
    <mesh ref={mesh} position={position} scale={scale ?? [1, 1, 1]}>
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
    const m = mesh.current
    if (m) {
      m.rotation.z = state.clock.elapsedTime
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
    }
  })

  return (
    <mesh ref={mesh} position={position}>
      <ringGeometry args={[radius * 0.8, radius, 32]} />
      <meshBasicMaterial color="#4a3f6b" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}
