import { useRef, useMemo, useLayoutEffect } from 'react'
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

/**
 * Uses imperative THREE.ShaderMaterial + <primitive attach="material" /> so production
 * bundles (Vite/Rolldown) do not break R3F's lowercase shaderMaterial constructor resolution
 * ("X is not a constructor").
 */
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

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          intensity: { value: 1.0 },
          color1: { value: new THREE.Color(color1) },
          color2: { value: new THREE.Color(color2) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    [color1, color2],
  )

  useLayoutEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  useFrame((state) => {
    material.uniforms.time.value = state.clock.elapsedTime
    material.uniforms.intensity.value = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.3
  })

  return (
    <mesh ref={mesh} position={position} scale={scale ?? [1, 1, 1]}>
      <planeGeometry args={[2, 2, 32, 32]} />
      <primitive object={material} attach="material" />
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

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#4a3f6b',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    [],
  )

  useLayoutEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  useFrame((state) => {
    const m = mesh.current
    if (m) {
      m.rotation.z = state.clock.elapsedTime
      material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
    }
  })

  return (
    <mesh ref={mesh} position={position} material={material}>
      <ringGeometry args={[radius * 0.8, radius, 32]} />
    </mesh>
  )
}
