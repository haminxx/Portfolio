import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Paper-style luxury wave (inspired by 21st.dev background paper shaders;
 * https://21st.dev/community/components/reuno-ui/background-paper-shaders/default )
 * — custom GLSL, not a copy of third-party source.
 */
const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vWave;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    float w1 = sin(pos.x * 1.65 + pos.y * 0.95 + time * 0.2) * 0.11;
    float w2 = sin((pos.x * 0.85 - pos.y * 1.15) + time * 0.14) * 0.042;
    float w3 = sin(length(pos.xy) * 2.4 - time * 0.12) * 0.028;
    float wave = (w1 + w2 + w3) * intensity;
    vWave = wave;
    pos.y += wave;
    
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
  varying float vWave;
  
  void main() {
    vec2 uv = vUv;
    
    float flow = sin(uv.x * 2.8 + uv.y * 1.9 + time * 0.12) * 0.5 + 0.5;
    vec3 base = mix(color1, color2, smoothstep(0.08, 0.95, flow * 0.65 + uv.y * 0.28 + vWave * 0.35));
    
    float silk = sin(uv.x * 5.2 + uv.y * 4.1 - time * 0.11);
    silk = pow(smoothstep(0.2, 0.92, silk * 0.5 + 0.5), 2.8);
    vec3 sheen = vec3(0.99, 0.995, 1.0);
    base = mix(base, sheen, silk * 0.2 * intensity);
    
    float sweep = sin(uv.x * 1.1 + uv.y * 0.7 - time * 0.09);
    sweep = smoothstep(0.35, 0.95, sweep * 0.5 + 0.5);
    base = mix(base, vec3(1.0), sweep * 0.1 * intensity);
    
    float vignette = length(uv - 0.5) * 1.12;
    float dim = mix(1.0, 0.9, smoothstep(0.32, 1.02, vignette));
    
    gl_FragColor = vec4(base * dim, 0.91);
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
      uniforms.intensity.value = 0.88 + Math.sin(state.clock.elapsedTime * 0.38) * 0.1
    }
  })

  return (
    <mesh ref={mesh} position={position} scale={scale ?? [1, 1, 1]}>
      <planeGeometry args={[2, 2, 96, 96]} />
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
