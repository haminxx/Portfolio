import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Animated paper-style plane (inspired by 21st.dev background paper shaders;
 * https://21st.dev/community/components/reuno-ui/background-paper-shaders/default )
 * — wave vertex + noise fragment; tuned for smoother motion and stronger contrast.
 */
const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    float t = time * 1.45;
    pos.y += sin(pos.x * 10.0 + t) * 0.1 * intensity;
    pos.x += cos(pos.y * 8.0 + t * 1.5) * 0.05 * intensity;
    
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
    float t = time * 1.45;
    
    float noise = sin(uv.x * 20.0 + t) * cos(uv.y * 15.0 + t * 0.8);
    noise += sin(uv.x * 35.0 - t * 2.0) * cos(uv.y * 25.0 + t * 1.2) * 0.5;
    
    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity * 0.42);
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export function ShaderPlane({
  position,
  scale,
  color1 = '#9eb0cc',
  color2 = '#f0f4fa',
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
      uniforms.intensity.value = 1.0 + Math.sin(state.clock.elapsedTime * 1.8) * 0.22
    }
  })

  return (
    <mesh ref={mesh} position={position} scale={scale ?? [1, 1, 1]}>
      <planeGeometry args={[2, 2, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
